import React from 'react';
import { MathExpression, MathText } from './MathNotation';
import { looksLikeMath, splitMathWorkLines } from '../lib/mathNotation';

interface Props {
 value: string | number;
 compact?: boolean;
 answer?: boolean;
}

export function MathSolutionWork({ value, compact = false, answer = false }: Props) {
 const source=String(value??'').trim();
 if(!source)return null;
 const lines=splitMathWorkLines(source);
 return <div className={`solution-math ${compact?'solution-math-compact':''} ${answer?'solution-math-answer':''}`}>
  {lines.map((line,index)=>{
   const math=looksLikeMath(line);
   return <React.Fragment key={index}>
    {index>0&&<div className="solution-math-arrow" aria-hidden="true">↓</div>}
    <div className={`solution-math-line ${math?'is-math':'is-text'}`}>
     {math?<MathExpression value={line} block/>:<MathText auto>{line}</MathText>}
    </div>
   </React.Fragment>;
  })}
 </div>;
}
