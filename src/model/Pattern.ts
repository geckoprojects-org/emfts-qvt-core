/**
 * A pattern is a container for predicates and bound variables.
 * Eclipse equivalent: org.eclipse.qvtd.pivot.qvtbase.Pattern
 */
export interface Pattern {
  /** OCL predicate expressions */
  predicates: string[];
  /** Variable names bound by this pattern */
  bindsTo: string[];
}
