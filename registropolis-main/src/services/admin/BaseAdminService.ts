
// Pure base class for instancing/admin singletons.
// Do not use generics, just a simple shared static instance map.

export class BaseAdminService {
  protected static instances: Map<string, any> = new Map();

  protected constructor() {}

  // Generic instance getter for future extension, here as identity helper
  // Children should NOT override this with a generic, always return their own type!
  protected static getInstanceKey<T>(key: string, ctor: new () => T): T {
    if (!this.instances.has(key)) {
      this.instances.set(key, new ctor());
    }
    return this.instances.get(key);
  }
}
