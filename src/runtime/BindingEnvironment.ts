/**
 * Immutable variable scope for pattern matching — Prolog-style unification.
 * tryBind returns a new environment on success, null on conflict.
 */
export class BindingEnvironment {
  private readonly bindings: ReadonlyMap<string, unknown>;

  constructor(bindings?: ReadonlyMap<string, unknown>) {
    this.bindings = bindings ?? new Map();
  }

  /** Get a bound value. */
  get(name: string): unknown {
    return this.bindings.get(name);
  }

  /** Check whether a variable is bound. */
  has(name: string): boolean {
    return this.bindings.has(name);
  }

  /**
   * Try to bind a variable.
   * - If unbound: returns new env with the binding added.
   * - If already bound to the same value: returns this env unchanged.
   * - If already bound to a different value: returns null (conflict).
   */
  tryBind(name: string, value: unknown): BindingEnvironment | null {
    const existing = this.bindings.get(name);
    if (existing !== undefined) {
      return existing === value ? this : null;
    }
    const newBindings = new Map(this.bindings);
    newBindings.set(name, value);
    return new BindingEnvironment(newBindings);
  }

  /** Create a child scope inheriting all bindings. */
  child(): BindingEnvironment {
    return new BindingEnvironment(new Map(this.bindings));
  }

  /** Export all bindings as a plain record. */
  toRecord(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [k, v] of this.bindings) {
      result[k] = v;
    }
    return result;
  }

  /** Number of bindings. */
  get size(): number {
    return this.bindings.size;
  }
}
