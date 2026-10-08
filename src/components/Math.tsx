import katex from 'katex';
import {useMemo} from 'react';
export function MathView({tex,block=true}:{tex:string;block?:boolean}){
 const html=useMemo(()=>{try{return katex.renderToString(tex,{displayMode:block,throwOnError:false,strict:'ignore',trust:false,output:'htmlAndMathml',maxSize:20,maxExpand:300});}catch{return ''; }},[tex,block]);
 return <span className={'math '+(block?'math-block':'')} dangerouslySetInnerHTML={{__html:html}}/>;
}
