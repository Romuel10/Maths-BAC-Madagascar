export type Series = 'A'|'C'|'D'|'L'|'OSE'|'S';
export type Operation = 'calculate'|'equation'|'inequality'|'function'|'derivative'|'integral'|'limit'|'system'|'sequence'|'probability'|'statistics'|'complex'|'matrix'|'geometry'|'finance'|'arithmetic'|'ode';
export interface Request { operation:Operation; expression:string; params:Record<string,string>; }
export interface Step { title:string; text:string; latex?:string; }
export interface RemarkablePoint {x:number;y:number;kind:'zero'|'minimum'|'maximum'|'stationary'|'inflection';exact:boolean;latex:string;}
export interface Asymptote {kind:'vertical'|'horizontal'|'oblique';latex:string;direction:string;x?:number;slope?:number;intercept?:number;}
export interface Plot {expression:string;derivative:string;points:(number[]|null)[];xmin:number;xmax:number;breaks:number[];yRange:[number,number];markers:RemarkablePoint[];asymptotes:Asymptote[];}
export interface FunctionAnalysis {symmetry?:string;signs?:{headers:string[];rows:string[][];global:boolean};tangent?:{at:string;latex:string;normal:string};domain:string;derivativeDomain?:string;derivative:string;secondDerivative?:string;zeros:RemarkablePoint[];zeroIdentity:boolean;zerosComplete:boolean;stationaryIdentity:boolean;critical:RemarkablePoint[];inflections:RemarkablePoint[];asymptotes:Asymptote[];limits:{label:string;latex:string}[];variation:'global'|'window';curvature?:{headers:string[];rows:string[][];global:boolean};}
export interface ResultChart {kind:'bars'|'scatter'|'sequence';label:string;points:[number,number][];line?:[number,number];}
export interface ResultTable {headers:string[];rows:string[][];latexRows?:(string|undefined)[][];}
export interface Result { title:string; latex:string; exact?:string; families?:string[]; approximate?:string; method?:'exact'|'numeric'|'unchanged'|'analysis'; numericValues?:number[]; steps:Step[]; notes:string[]; table?:ResultTable; secondaryTables?:{title:string;headers:string[];rows:string[][]}[]; chart?:ResultChart; plot?:Plot; analysis?:FunctionAnalysis; }
export interface Reply { id:number; result?:Result; error?:string; }
export interface Field { key:string; label:string; initial:string; hint?:string; }
export interface Tool { id:Operation; name:string; description:string; expression:string; label:string; fields:Field[]; group:string; }
