import type { EClass, EStructuralFeature } from 'emfts';

/**
 * Value that a PropertyTemplateItem can bind to.
 */
export type TemplateValue =
  | { kind: 'variable'; name: string }
  | { kind: 'literal'; value: unknown }
  | { kind: 'ocl'; expression: string }
  | { kind: 'template'; template: ObjectTemplateExp }
  | { kind: 'collection'; template: CollectionTemplateExp };

/**
 * An object template expression — matches/creates objects of a given EClass.
 * Eclipse equivalent: org.eclipse.qvtd.pivot.qvttemplate.ObjectTemplateExp
 */
export interface ObjectTemplateExp {
  /** The EClass to match or create */
  referredClass: EClass;
  /** Optional variable name for the matched/created object */
  bindVariable?: string;
  /** Feature bindings */
  parts: PropertyTemplateItem[];
}

/**
 * A single property binding within an ObjectTemplateExp.
 * Eclipse equivalent: org.eclipse.qvtd.pivot.qvttemplate.PropertyTemplateItem
 */
export interface PropertyTemplateItem {
  /** The structural feature being matched/set */
  referredProperty: EStructuralFeature;
  /** The value expression */
  value: TemplateValue;
  /** Whether to navigate via opposite direction */
  isOpposite: boolean;
}

/**
 * A collection template expression — matches/creates collections.
 * Eclipse equivalent: org.eclipse.qvtd.pivot.qvttemplate.CollectionTemplateExp
 */
export interface CollectionTemplateExp {
  /** Collection type: Set, Bag, Sequence, OrderedSet */
  referredCollectionType: string;
  /** Member values */
  members: TemplateValue[];
  /** Optional rest variable for remaining elements */
  rest?: string;
}
