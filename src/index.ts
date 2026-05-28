// Model interfaces (QVTBase equivalents)
export type { Transformation } from './model/Transformation.js';
export type { TypedModel } from './model/TypedModel.js';
export type { Rule } from './model/Rule.js';
export type { Domain } from './model/Domain.js';
export type { Pattern } from './model/Pattern.js';
export type { Key } from './model/Key.js';

// Template types (QVTTemplate equivalents)
export type {
  ObjectTemplateExp,
  PropertyTemplateItem,
  CollectionTemplateExp,
  TemplateValue,
} from './template/TemplateExp.js';

// Trace
export type { TraceEntry } from './trace/TraceEntry.js';
export { TraceModel } from './trace/TraceModel.js';

// Runtime
export { BindingEnvironment } from './runtime/BindingEnvironment.js';
export { ModelExtent } from './runtime/ModelExtent.js';
export { PatternMatcher } from './runtime/PatternMatcher.js';
export { PatternEnforcer } from './runtime/PatternEnforcer.js';
export { ExecutionDiagnostic, DiagnosticSeverity } from './runtime/ExecutionDiagnostic.js';
export type { DiagnosticEntry } from './runtime/ExecutionDiagnostic.js';

// OCL Bridge
export { OclConditionEvaluator } from './ocl/OclConditionEvaluator.js';
