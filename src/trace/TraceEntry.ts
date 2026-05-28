import type { EObject } from 'emfts';

/**
 * A single trace record linking rule execution to source/target bindings.
 */
export interface TraceEntry {
  /** Rule name */
  ruleName: string;
  /** Source variable bindings */
  sourceBindings: Record<string, unknown>;
  /** Target variable bindings */
  targetBindings: Record<string, unknown>;
  /** Primary source object */
  sourceObject?: EObject;
  /** Primary target object */
  targetObject?: EObject;
}
