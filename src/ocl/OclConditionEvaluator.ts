import { OclEvaluator, parseOclExpression } from '@emfts/ocl.langium';
import type { Expression } from '@emfts/ocl.langium';
import { BindingEnvironment } from '../runtime/BindingEnvironment.js';

/**
 * Bridge between QVT pattern matching and OCL evaluation.
 * Evaluates OCL expressions using bindings from the BindingEnvironment.
 */
export class OclConditionEvaluator {
  private readonly evaluator = new OclEvaluator();
  private readonly expressionCache = new Map<string, Expression | undefined>();

  /**
   * Evaluate an OCL expression string with bindings as variables.
   * Returns the evaluation result.
   */
  async evaluate(expression: string, env: BindingEnvironment, self?: unknown): Promise<unknown> {
    const expr = await this.parseExpression(expression);
    if (!expr) {
      throw new Error(`Failed to parse OCL expression: ${expression}`);
    }
    return this.evaluateExpression(expr, env, self);
  }

  /**
   * Evaluate a pre-parsed OCL expression with bindings.
   */
  evaluateExpression(expr: Expression, env: BindingEnvironment, self?: unknown): unknown {
    return this.evaluator.evaluateExpression(expr, self ?? null, {
      variables: env.toRecord(),
    });
  }

  /**
   * Evaluate an OCL condition (boolean expression).
   * Returns true if the expression evaluates to true.
   */
  async evaluateCondition(expression: string, env: BindingEnvironment, self?: unknown): Promise<boolean> {
    const result = await this.evaluate(expression, env, self);
    return result === true;
  }

  /**
   * Parse an OCL expression string and cache the result.
   */
  async parseExpression(expression: string): Promise<Expression | undefined> {
    if (this.expressionCache.has(expression)) {
      return this.expressionCache.get(expression);
    }
    const result = await parseOclExpression(expression);
    this.expressionCache.set(expression, result.expression);
    return result.expression;
  }
}
