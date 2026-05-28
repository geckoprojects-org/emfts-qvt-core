import type { EObject } from 'emfts';
import type { ObjectTemplateExp, TemplateValue } from '../template/TemplateExp.js';
import { BindingEnvironment } from './BindingEnvironment.js';
import { ModelExtent } from './ModelExtent.js';

/**
 * Matches EObjects against ObjectTemplateExps, yielding all valid
 * BindingEnvironments. Generator-based for lazy evaluation.
 *
 * Eclipse equivalent: pattern matching in QVTr relation execution.
 */
export class PatternMatcher {
  /**
   * Find all matches for a template within a model extent.
   * Yields one BindingEnvironment per valid match.
   */
  *findMatches(
    template: ObjectTemplateExp,
    extent: ModelExtent,
    env: BindingEnvironment,
  ): Generator<BindingEnvironment> {
    // If the bind variable is already bound, only check that object
    if (template.bindVariable && env.has(template.bindVariable)) {
      const bound = env.get(template.bindVariable) as EObject;
      const result = this.matchObject(template, bound, env);
      if (result) yield result;
      return;
    }

    // Otherwise iterate candidates of compatible type
    const candidates = extent.objectsOfType(template.referredClass);
    for (const candidate of candidates) {
      const result = this.matchObject(template, candidate, env);
      if (result) yield result;
    }
  }

  /**
   * Try to match a single EObject against a template.
   * Returns the extended environment on success, null on failure.
   */
  matchObject(
    template: ObjectTemplateExp,
    candidate: EObject,
    env: BindingEnvironment,
  ): BindingEnvironment | null {
    // Type check
    const candidateClass = candidate.eClass();
    if (candidateClass !== template.referredClass &&
        !template.referredClass.isSuperTypeOf(candidateClass)) {
      return null;
    }

    let currentEnv = env;

    // Bind the root variable
    if (template.bindVariable) {
      const bound = currentEnv.tryBind(template.bindVariable, candidate);
      if (!bound) return null;
      currentEnv = bound;
    }

    // Match each property binding
    for (const part of template.parts) {
      const featureValue = candidate.eGet(part.referredProperty);
      const matched = this.matchValue(part.value, featureValue, currentEnv);
      if (!matched) return null;
      currentEnv = matched;
    }

    return currentEnv;
  }

  /**
   * Match a template value against an actual value.
   */
  private matchValue(
    templateValue: TemplateValue,
    actualValue: unknown,
    env: BindingEnvironment,
  ): BindingEnvironment | null {
    switch (templateValue.kind) {
      case 'variable':
        return env.tryBind(templateValue.name, actualValue);

      case 'literal':
        return actualValue === templateValue.value ? env : null;

      case 'template': {
        // Nested object template — actualValue must be an EObject
        if (!actualValue || typeof actualValue !== 'object' || !('eClass' in actualValue)) {
          return null;
        }
        return this.matchObject(templateValue.template, actualValue as EObject, env);
      }

      case 'collection': {
        // Collection matching — actualValue must be array-like
        const items = this.toArray(actualValue);
        return this.matchCollection(templateValue.template.members, items, templateValue.template.rest, env);
      }

      case 'ocl':
        // OCL expressions are evaluated separately (by OclConditionEvaluator)
        // During matching, treat as always-matching (guard checked later)
        return env;
    }
  }

  /**
   * Match collection members against actual items.
   */
  private matchCollection(
    members: TemplateValue[],
    items: unknown[],
    rest: string | undefined,
    env: BindingEnvironment,
  ): BindingEnvironment | null {
    let currentEnv = env;

    // Match named members
    const matched: unknown[] = [];
    for (const member of members) {
      let found = false;
      for (const item of items) {
        if (matched.includes(item)) continue;
        const result = this.matchValue(member, item, currentEnv);
        if (result) {
          currentEnv = result;
          matched.push(item);
          found = true;
          break;
        }
      }
      if (!found) return null;
    }

    // Bind rest variable to remaining elements
    if (rest) {
      const remaining = items.filter(i => !matched.includes(i));
      const bound = currentEnv.tryBind(rest, remaining);
      if (!bound) return null;
      currentEnv = bound;
    }

    return currentEnv;
  }

  private toArray(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined) return [];
    if (value && typeof value === 'object' && 'size' in value && 'get' in value) {
      const list = value as { size(): number; get(i: number): unknown };
      const result: unknown[] = [];
      for (let i = 0; i < list.size(); i++) {
        result.push(list.get(i));
      }
      return result;
    }
    return [value];
  }
}
