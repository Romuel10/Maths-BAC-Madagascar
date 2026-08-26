import { parseDerivativeExpression, type DNode } from './derivativeEngine.js';

export type ExpressionScope = Record<string, number>;

export function parseExpressionCore(input: string): DNode {
  return parseDerivativeExpression(input);
}

export function evaluateExpressionAst(node: DNode, scope: ExpressionScope = {}): number {
  switch (node.kind) {
    case 'num': return node.value;
    case 'sym': {
      if (node.name === 'pi') return Math.PI;
      if (node.name === 'e') return Math.E;
      const v = scope[node.name];
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      throw new Error(`Valeur manquante pour ${node.name}`);
    }
    case 'neg': return -evaluateExpressionAst(node.value, scope);
    case 'bin': {
      const a = evaluateExpressionAst(node.left, scope);
      const b = evaluateExpressionAst(node.right, scope);
      if (node.op === '+') return a + b;
      if (node.op === '-') return a - b;
      if (node.op === '*') return a * b;
      if (node.op === '/') return a / b;
      return Math.pow(a, b);
    }
    case 'func': {
      const u = evaluateExpressionAst(node.arg, scope);
      if (node.name === 'sin') return Math.sin(u);
      if (node.name === 'cos') return Math.cos(u);
      if (node.name === 'tan') return Math.tan(u);
      if (node.name === 'exp') return Math.exp(u);
      if (node.name === 'log') return Math.log(u);
      if (node.name === 'sqrt') return Math.sqrt(u);
      return Math.abs(u);
    }
  }
}

export function safeEvaluateExpression(input: string, scope: ExpressionScope = {}): number | null {
  try {
    const v = evaluateExpressionAst(parseExpressionCore(input), scope);
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

export function evaluateConstantNode(node: DNode): number | null {
  try {
    const v = evaluateExpressionAst(node, {});
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}
