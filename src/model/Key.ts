import type { EClass, EStructuralFeature } from 'emfts';

/**
 * Identifies an EClass by a set of structural features — used for
 * object identity during enforce (QVTr) and resolve (QVTo).
 * Eclipse equivalent: org.eclipse.qvtd.pivot.qvtrelation.Key
 */
export interface Key {
  /** The class this key identifies */
  identifies: EClass;
  /** The identifying features */
  parts: EStructuralFeature[];
  /** Optional opposite-direction features */
  oppositeParts?: EStructuralFeature[];
}
