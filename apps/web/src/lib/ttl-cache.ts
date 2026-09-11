export class TtlCache<T> {
  private readonly store = new Map<string, { value: T; expires: number }>();

  constructor(
    private readonly ttlMs: number,
    private readonly max = 256,
    private readonly now: () => number = Date.now,
  ) {}

  get(key: string): T | undefined {
    if (this.ttlMs <= 0) return undefined;
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expires <= this.now()) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: T): void {
    if (this.ttlMs <= 0) return;
    if (this.store.size >= this.max && !this.store.has(key)) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expires: this.now() + this.ttlMs });
  }
}
