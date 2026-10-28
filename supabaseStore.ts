import type { SupabaseClient } from '@supabase/supabase-js';

type Projection = Record<string, number>;
type Sort = Record<string, number>;

export interface RecordCursor<T> {
  sort(sort: Sort): RecordCursor<T>;
  limit(count: number): RecordCursor<T>;
  toArray(): Promise<T[]>;
}

export interface RecordCollection<T extends Record<string, any>> {
  find(filter?: any, options?: { projection?: Projection }): RecordCursor<T>;
  findOne(filter?: any, options?: { projection?: Projection }): Promise<T | null>;
  insertOne(doc: T): Promise<{ acknowledged: boolean; insertedId: any }>;
  updateOne(filter: any, update: any, options?: { upsert?: boolean }): Promise<any>;
  deleteOne(filter: any): Promise<{ acknowledged: boolean; deletedCount: number }>;
  countDocuments(filter?: any): Promise<number>;
  createIndex(spec: any, options?: any): Promise<string>;
}

export function matchesFilter(doc: any, filter?: any): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const [key, filterVal] of Object.entries(filter)) {
    const docVal = doc[key];
    if (filterVal && typeof filterVal === 'object' && !Array.isArray(filterVal)) {
      if ('$in' in filterVal) {
        const values = (filterVal as any).$in as any[];
        if (Array.isArray(docVal) ? !docVal.some(value => values.includes(value)) : !values.includes(docVal)) return false;
      } else if ('$ne' in filterVal && docVal === (filterVal as any).$ne) {
        return false;
      } else if ('$gte' in filterVal && docVal < (filterVal as any).$gte) {
        return false;
      } else if ('$lte' in filterVal && docVal > (filterVal as any).$lte) {
        return false;
      }
    } else if (Array.isArray(docVal) ? !docVal.includes(filterVal) : docVal !== filterVal) {
      return false;
    }
  }

  return true;
}

function project<T>(doc: T, projection?: Projection): T {
  if (!projection) return structuredClone(doc);

  const isInclusive = Object.values(projection).some(value => value === 1);
  if (isInclusive) {
    const result: Record<string, any> = {};
    for (const [key, included] of Object.entries(projection)) {
      if (included === 1 && (doc as any)[key] !== undefined) result[key] = (doc as any)[key];
    }
    return result as T;
  }

  const result = structuredClone(doc) as Record<string, any>;
  for (const [key, included] of Object.entries(projection)) {
    if (included === 0) delete result[key];
  }
  return result as T;
}

class SupabaseRecordCursor<T extends Record<string, any>> implements RecordCursor<T> {
  private sortBy?: Sort;
  private maxRows?: number;

  constructor(
    private readonly load: () => Promise<T[]>,
    private readonly projection?: Projection,
  ) {}

  sort(sort: Sort) {
    this.sortBy = sort;
    return this;
  }

  limit(count: number) {
    this.maxRows = count;
    return this;
  }

  async toArray(): Promise<T[]> {
    let rows = await this.load();

    if (this.sortBy) {
      const [field, direction] = Object.entries(this.sortBy)[0];
      rows = rows.sort((a, b) => {
        const left = a[field] ?? '';
        const right = b[field] ?? '';
        if (left < right) return -1 * direction;
        if (left > right) return direction;
        return 0;
      });
    }

    if (typeof this.maxRows === 'number' && this.maxRows > 0) {
      rows = rows.slice(0, this.maxRows);
    }

    return rows.map(row => project(row, this.projection));
  }
}

function applySet(target: any, values: Record<string, any>) {
  for (const [path, value] of Object.entries(values)) {
    const parts = path.split('.');
    let current = target;
    for (const part of parts.slice(0, -1)) {
      if (!current[part] || typeof current[part] !== 'object') current[part] = {};
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
  }
}

function applyInc(target: any, values: Record<string, number>) {
  for (const [path, value] of Object.entries(values)) {
    const parts = path.split('.');
    let current = target;
    for (const part of parts.slice(0, -1)) {
      if (!current[part] || typeof current[part] !== 'object') current[part] = {};
      current = current[part];
    }
    const key = parts[parts.length - 1];
    current[key] = (current[key] || 0) + value;
  }
}

function applyUnset(target: any, values: Record<string, unknown>) {
  for (const path of Object.keys(values)) {
    const parts = path.split('.');
    let current = target;
    for (const part of parts.slice(0, -1)) {
      if (!current[part] || typeof current[part] !== 'object') {
        current = undefined;
        break;
      }
      current = current[part];
    }
    if (current) delete current[parts[parts.length - 1]];
  }
}

function getRecordId(document: Record<string, any>) {
  const value = document.id ?? document._id ?? document.ticketId ?? document.token ??
    document.date ?? document.name;
  return value == null ? '' : String(value);
}

export class SupabaseCollection<T extends Record<string, any>> implements RecordCollection<T> {
  constructor(
    private readonly client: SupabaseClient,
    private readonly collection: string,
  ) {}

  find(filter?: any, options?: { projection?: Projection }) {
    return new SupabaseRecordCursor<T>(async () => {
      const { data, error } = await this.client
        .from('app_records')
        .select('document')
        .eq('collection', this.collection);

      if (error) throw new Error(`Supabase read failed for ${this.collection}: ${error.message}`);

      return (data ?? [])
        .map(row => row.document as T)
        .filter(document => matchesFilter(document, filter));
    }, options?.projection);
  }

  async findOne(filter?: any, options?: { projection?: Projection }): Promise<T | null> {
    const [document] = await this.find(filter, options).limit(1).toArray();
    return document ?? null;
  }

  async insertOne(doc: T) {
    const id = getRecordId(doc);
    if (!id) throw new Error(`Supabase record in ${this.collection} must include an id`);

    const { error } = await this.client
      .from('app_records')
      .insert({ collection: this.collection, id, document: doc });
    if (error) throw new Error(`Supabase insert failed for ${this.collection}: ${error.message}`);

    return { acknowledged: true, insertedId: id };
  }

  async updateOne(filter: any, update: any, options?: { upsert?: boolean }) {
    const document = await this.findOne(filter);
    if (!document) {
      if (!options?.upsert) return { acknowledged: true, modifiedCount: 0 };

      const inserted: Record<string, any> = {};
      for (const [key, value] of Object.entries(filter ?? {})) {
        if (!(value && typeof value === 'object')) inserted[key] = value;
      }
      if (update.$setOnInsert) applySet(inserted, update.$setOnInsert);
      if (update.$set) applySet(inserted, update.$set);
      if (update.$inc) applyInc(inserted, update.$inc);
      if (!inserted.id) inserted.id = crypto.randomUUID();
      await this.insertOne(inserted as T);
      return { acknowledged: true, modifiedCount: 1, upsertedCount: 1 };
    }

    const updated = structuredClone(document) as Record<string, any>;
    if (update.$set) applySet(updated, update.$set);
    if (update.$inc) applyInc(updated, update.$inc);
    if (update.$unset) applyUnset(updated, update.$unset);
    if (update.$addToSet) {
      for (const [key, value] of Object.entries(update.$addToSet)) {
        if (!Array.isArray(updated[key])) updated[key] = [];
        const present = updated[key].some((item: any) => JSON.stringify(item) === JSON.stringify(value));
        if (!present) updated[key].push(value);
      }
    }

    const id = getRecordId(document);
    if (!id) throw new Error(`Supabase record in ${this.collection} has no id`);
    const { error } = await this.client
      .from('app_records')
      .update({ document: updated, updated_at: new Date().toISOString() })
      .eq('collection', this.collection)
      .eq('id', id);
    if (error) throw new Error(`Supabase update failed for ${this.collection}: ${error.message}`);

    return { acknowledged: true, modifiedCount: 1 };
  }

  async deleteOne(filter: any) {
    const document = await this.findOne(filter);
    if (!document) return { acknowledged: true, deletedCount: 0 };

    const id = getRecordId(document);
    const { error } = await this.client
      .from('app_records')
      .delete()
      .eq('collection', this.collection)
      .eq('id', id);
    if (error) throw new Error(`Supabase delete failed for ${this.collection}: ${error.message}`);

    return { acknowledged: true, deletedCount: 1 };
  }

  async countDocuments(filter?: any) {
    if (filter && Object.keys(filter).length > 0) return (await this.find(filter).toArray()).length;

    const { count, error } = await this.client
      .from('app_records')
      .select('id', { count: 'exact', head: true })
      .eq('collection', this.collection);
    if (error) throw new Error(`Supabase count failed for ${this.collection}: ${error.message}`);
    return count ?? 0;
  }

  async createIndex() {
    return `${this.collection}_index_managed_by_migration`;
  }
}
