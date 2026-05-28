import type { TypedModel } from './TypedModel.js';

/**
 * A domain links a rule to a typed model with directionality.
 * Eclipse equivalent: org.eclipse.qvtd.pivot.qvtbase.Domain
 */
export interface Domain {
  /** Name (= TypedModel.name) */
  name: string;
  /** Whether this domain can be checked for matches */
  isCheckable: boolean;
  /** Whether this domain can be enforced (create/update) */
  isEnforceable: boolean;
  /** The typed model this domain refers to */
  typedModel: TypedModel;
}
