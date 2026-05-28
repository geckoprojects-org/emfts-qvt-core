import type { EObject, EClass, EStructuralFeature } from 'emfts';
import type { TraceEntry } from './TraceEntry.js';

/**
 * Bidirectional trace model — records source→target mappings per rule.
 * Used for:
 *  - when-clause relation calls (trace lookup)
 *  - QVTo resolve() (find already-transformed objects)
 *  - Key-based object identity (find existing target by key values)
 */
export class TraceModel {
  private readonly entries: TraceEntry[] = [];
  /** rule+source → entry for fast lookup */
  private readonly sourceIndex = new Map<string, TraceEntry[]>();
  /** rule+target → entry for reverse lookup */
  private readonly targetIndex = new Map<string, TraceEntry[]>();

  /**
   * Record a trace entry.
   */
  addEntry(entry: TraceEntry): void {
    this.entries.push(entry);

    // Index by rule+source
    if (entry.sourceObject) {
      const key = this.indexKey(entry.ruleName, entry.sourceObject);
      let list = this.sourceIndex.get(key);
      if (!list) {
        list = [];
        this.sourceIndex.set(key, list);
      }
      list.push(entry);
    }

    // Index by rule+target
    if (entry.targetObject) {
      const key = this.indexKey(entry.ruleName, entry.targetObject);
      let list = this.targetIndex.get(key);
      if (!list) {
        list = [];
        this.targetIndex.set(key, list);
      }
      list.push(entry);
    }
  }

  /**
   * Shorthand: record a source→target mapping for a rule.
   */
  addTrace(source: EObject, target: EObject, ruleName: string, sourceBindings?: Record<string, unknown>, targetBindings?: Record<string, unknown>): void {
    this.addEntry({
      ruleName,
      sourceObject: source,
      targetObject: target,
      sourceBindings: sourceBindings ?? {},
      targetBindings: targetBindings ?? {},
    });
  }

  /**
   * Find target for a given source and rule (forward lookup).
   */
  findTarget(source: EObject, ruleName: string): EObject | null {
    const key = this.indexKey(ruleName, source);
    const entries = this.sourceIndex.get(key);
    if (entries && entries.length > 0) {
      return entries[0].targetObject ?? null;
    }
    return null;
  }

  /**
   * Find source for a given target and rule (reverse lookup).
   */
  findSource(target: EObject, ruleName: string): EObject | null {
    const key = this.indexKey(ruleName, target);
    const entries = this.targetIndex.get(key);
    if (entries && entries.length > 0) {
      return entries[0].sourceObject ?? null;
    }
    return null;
  }

  /**
   * Check if a trace exists for source bindings (used in when-clause relation calls).
   * Returns matching target bindings if found.
   */
  lookupRelation(ruleName: string, sourceBindingValues: unknown[]): Record<string, unknown> | null {
    for (const entry of this.entries) {
      if (entry.ruleName !== ruleName) continue;
      const entrySourceValues = Object.values(entry.sourceBindings);
      if (this.arraysMatch(entrySourceValues, sourceBindingValues)) {
        return entry.targetBindings;
      }
    }
    return null;
  }

  /**
   * Find a target object by key feature values (used in PatternEnforcer).
   */
  findByKey(eClass: EClass, keyValues: Map<EStructuralFeature, unknown>): EObject | null {
    for (const entry of this.entries) {
      const target = entry.targetObject;
      if (!target) continue;
      const targetClass = target.eClass();
      if (targetClass !== eClass && !eClass.isSuperTypeOf(targetClass)) continue;

      let matches = true;
      for (const [feature, value] of keyValues) {
        if (target.eGet(feature) !== value) {
          matches = false;
          break;
        }
      }
      if (matches) return target;
    }
    return null;
  }

  /** Get all entries. */
  getEntries(): readonly TraceEntry[] {
    return this.entries;
  }

  /** Number of entries. */
  get size(): number {
    return this.entries.length;
  }

  private indexKey(ruleName: string, obj: EObject): string {
    // Use object identity via a WeakRef-like approach — for now use string concat
    // In practice, object identity is by reference in the Map
    return `${ruleName}#${this.objectId(obj)}`;
  }

  private objectId(obj: EObject): number {
    if (!this.idMap.has(obj)) {
      this.idMap.set(obj, this.nextId++);
    }
    return this.idMap.get(obj)!;
  }

  private readonly idMap = new Map<EObject, number>();
  private nextId = 0;

  private arraysMatch(a: unknown[], b: unknown[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, i) => val === b[i]);
  }
}
