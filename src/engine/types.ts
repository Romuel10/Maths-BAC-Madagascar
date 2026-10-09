export type Series = 'A'|'C'|'D'|'L'|'OSE'|'S';
export type Operation = 'calculate'|'equation'|'inequality'|'function'|'derivative'|'integral'|'limit'|'system'|'sequence'|'probability'|'statistics'|'complex'|'matrix'|'geometry'|'finance'|'arithmetic'|'ode';
export interface Request { operation:Operation; expression:string; params:Record<string,string>; }
export interface Step { title:string; text:string; latex?:string; }
export interface Result { title:string; latex:string; exact?:string; families?:string[]; approximate?:string; method?:'exact'|'numeric'|'unchanged'|'analysis'; numericValues?:number[]; steps:Step[]; notes:string[]; table?:{headers:string[];rows:string[][]}; plot?:{points:(number[]|null)[];xmin:number;xmax:number}; }
export interface Reply { id:number; result?:Result; error?:string; }
export interface Field { key:string; label:string; initial:string; hint?:string; }
export interface Tool { id:Operation; name:string; description:string; expression:string; label:string; fields:Field[]; group:string; }
