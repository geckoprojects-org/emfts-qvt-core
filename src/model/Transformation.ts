import type { TypedModel } from './TypedModel.js';
import type { Rule } from './Rule.js';

/**
 * Top-level container for a QVT transformation.
 * Eclipse equivalent: org.eclipse.qvtd.pivot.qvtbase.Transformation
 */
export interface Transformation {
  /** Transformation name */
  name: string;
  /** in/out/inout model parameters */
  modelParameters: TypedModel[];
  /** Relations (QVTr) or Mappings (QVTo) */
  rules: Rule[];
}
