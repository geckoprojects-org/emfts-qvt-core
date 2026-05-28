import type { EObject, EStructuralFeature } from '@emfts/core';
import { BasicEFactory } from '@emfts/core';
import type { ObjectTemplateExp, TemplateValue } from '../template/TemplateExp.js';
import type { Key } from '../model/Key.js';
import { BindingEnvironment } from './BindingEnvironment.js';
import type { TraceModel } from '../trace/TraceModel.js';

/**
 * Creates or updates EObject trees from bindings — the "enforce" half
 * of a QVTr relation domain.
 *
 * Uses Keys for object identity: if a matching object already exists
 * in the trace, it is updated rather than re-created.
 */
export class PatternEnforcer {
  private readonly factory = new BasicEFactory();

  /**
   * Enforce a template: create/update the target object using bindings.
   */
  enforce(
    template: ObjectTemplateExp,
    env: BindingEnvironment,
    trace: TraceModel,
    keys: Key[],
  ): EObject {
    // Check if the variable is already bound (from trace lookup via key)
    if (template.bindVariable && env.has(template.bindVariable)) {
      const existing = env.get(template.bindVariable) as EObject;
      this.applyBindings(template, existing, env, trace, keys);
      return existing;
    }

    // Try key-based lookup
    const keyMatch = this.findByKey(template, env, keys, trace);
    if (keyMatch) {
      this.applyBindings(template, keyMatch, env, trace, keys);
      return keyMatch;
    }

    // Create new object
    const target = this.factory.create(template.referredClass);
    this.applyBindings(template, target, env, trace, keys);
    return target;
  }

  /**
   * Apply all property bindings from the template to the target object.
   */
  private applyBindings(
    template: ObjectTemplateExp,
    target: EObject,
    env: BindingEnvironment,
    trace: TraceModel,
    keys: Key[],
  ): void {
    for (const part of template.parts) {
      const value = this.resolveValue(part.value, env, trace, keys);
      if (value !== undefined) {
        if (part.referredProperty.isMany()) {
          const list = target.eGet(part.referredProperty);
          if (Array.isArray(value)) {
            for (const item of value) {
              if (Array.isArray(list)) {
                list.push(item);
              } else if (list && typeof list === 'object' && 'add' in list) {
                (list as { add(v: unknown): void }).add(item);
              }
            }
          } else {
            if (Array.isArray(list)) {
              list.push(value);
            } else if (list && typeof list === 'object' && 'add' in list) {
              (list as { add(v: unknown): void }).add(value);
            }
          }
        } else {
          target.eSet(part.referredProperty, value);
        }
      }
    }
  }

  /**
   * Resolve a TemplateValue to a concrete value using the environment.
   */
  private resolveValue(
    templateValue: TemplateValue,
    env: BindingEnvironment,
    trace: TraceModel,
    keys: Key[],
  ): unknown {
    switch (templateValue.kind) {
      case 'variable':
        return env.get(templateValue.name);

      case 'literal':
        return templateValue.value;

      case 'template':
        return this.enforce(templateValue.template, env, trace, keys);

      case 'collection': {
        const result: unknown[] = [];
        for (const member of templateValue.template.members) {
          result.push(this.resolveValue(member, env, trace, keys));
        }
        return result;
      }

      case 'ocl':
        // OCL expressions must be evaluated externally
        return undefined;
    }
  }

  /**
   * Try to find an existing object by key properties.
   */
  private findByKey(
    template: ObjectTemplateExp,
    env: BindingEnvironment,
    keys: Key[],
    trace: TraceModel,
  ): EObject | null {
    const key = keys.find(k => k.identifies === template.referredClass);
    if (!key) return null;

    // Build key values from the template
    const keyValues = new Map<EStructuralFeature, unknown>();
    for (const part of template.parts) {
      if (key.parts.includes(part.referredProperty)) {
        const value = this.resolveSimpleValue(part.value, env);
        if (value !== undefined) {
          keyValues.set(part.referredProperty, value);
        }
      }
    }

    // All key parts must be resolvable
    if (keyValues.size !== key.parts.length) return null;

    // Search trace for matching target objects
    return trace.findByKey(template.referredClass, keyValues);
  }

  private resolveSimpleValue(templateValue: TemplateValue, env: BindingEnvironment): unknown {
    switch (templateValue.kind) {
      case 'variable':
        return env.get(templateValue.name);
      case 'literal':
        return templateValue.value;
      default:
        return undefined;
    }
  }
}
