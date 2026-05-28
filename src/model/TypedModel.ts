import type { EPackage } from '@emfts/core';

/**
 * Declares a model parameter of a transformation — name + metamodel packages.
 * Eclipse equivalent: org.eclipse.qvtd.pivot.qvtbase.TypedModel
 */
export interface TypedModel {
  /** Logical model name (e.g. 'uml', 'rdbms') */
  name: string;
  /** Metamodel packages this model uses */
  usedPackages: EPackage[];
}
