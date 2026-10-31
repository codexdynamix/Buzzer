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
      let query = this.client
        .from('app_records')
        .select('document')
        .eq('collection', this.collection);

      const canPushExactFilter = Boolean(filter && Object.keys(filter).length > 0) &&
        Object.values(filter).every(value => value === null || typeof value !== 'object');
      if (canPushExactFilter) query = query.contains('document', filter);

      const { data, error } = await query;
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
    const existing = await this.findOne(filter);
    if (!existing && !options?.upsert) return { acknowledged: true, modifiedCount: 0 };

    const initialDocument: Record<string, any> = {};
    for (const [key, value] of Object.entries(filter ?? {})) {
      if (!(value && typeof value === 'object')) initialDocument[key] = value;
    }
    const id = existing ? getRecordId(existing) : getRecordId(initialDocument) || crypto.randomUUID();
    if (!id) throw new Error(`Supabase record in ${this.collection} has no id`);

    initialDocument.id = id;
    const { data, error } = await this.client.rpc('update_app_record', {
      p_collection: this.collection,
      p_id: id,
      p_initial_document: initialDocument,
      p_update: update,
      p_upsert: Boolean(options?.upsert),
    });
    if (error) throw new Error(`Supabase update failed for ${this.collection}: ${error.message}`);

    return {
      acknowledged: true,
      modifiedCount: data ? 1 : 0,
      ...(options?.upsert && !existing && data ? { upsertedCount: 1 } : {}),
    };
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
