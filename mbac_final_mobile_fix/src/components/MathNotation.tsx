import React, { useMemo } from 'react';
import katex from 'katex';
import { looksLikeMath, mathToLatex, plainMathFallback } from '../lib/mathNotation';

interface MathExpressionProps {
 value: string | number;
 block?: boolean;
 className?: string;
 ariaLabel?: string;
}

export function MathExpression({ value, block = false, className = '', ariaLabel }: MathExpressionProps) {
 const source = String(value ?? '').trim();
 const html = useMemo(() => {
  if (!source) return '';
  try {
   return katex.renderToString(mathToLatex(source), {
    throwOnError: false,
    strict: 'ignore',
    displayMode: block,
    output: 'htmlAndMathml',
   });
  } catch {
   return '';
  }
 }, [source, block]);

 if (!source) return null;
 if (!html) return <span className={className}>{plainMathFallback(source)}</span>;

 const Tag = block ? 'div' : 'span';
 return (
  <Tag
   className={`math-typeset ${block ? 'math-typeset-block' : 'math-typeset-inline'} ${className}`}
   aria-label={ariaLabel || source}
   dangerouslySetInnerHTML={{ __html: html }}
  />
 );
}

interface MathTextProps {
 children: string;
 className?: string;
 auto?: boolean;
}

/**
 * Render mixed prose/math. Put formulas between $...$ for exact control.
 * When auto=true, a whole formula-looking string is typeset automatically.
 */
export function MathText({ children, className = '', auto = false }: MathTextProps) {
 const text = String(children ?? '');

 if (auto && !text.includes('$') && looksLikeMath(text)) {
  return <MathExpression value={text} className={className} />;
 }

 if (!text.includes('$')) {
  return <span className={className}>{plainMathFallback(text)}</span>;
 }

 const parts = text.split('$');
 return (
  <span className={className}>
   {parts.map((part, index) => index % 2 === 1
    ? <MathExpression key={index} value={part} />
    : <React.Fragment key={index}>{plainMathFallback(part)}</React.Fragment>
   )}
  </span>
 );
}
