import type { Domain } from './Domain.js';

/**
 * Abstract basis for both Relations (QVTr) and Mappings (QVTo).
 * Eclipse equivalent: org.eclipse.qvtd.pivot.qvtbase.Rule
 */
export interface Rule {
  /** Rule name */
  name: string;
  /** Domains (source/target) */
  domains: Domain[];
  /** Whether this rule is abstract */
  isAbstract: boolean;
  /** Optional rule that this one overrides */
  overrides?: Rule;
}
