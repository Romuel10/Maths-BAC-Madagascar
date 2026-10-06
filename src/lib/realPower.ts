/** Real rational powers: an odd denominator permits a negative base. */
export function rationalExponent(value:number):{numerator:number;denominator:number}|null{
 if(!Number.isFinite(value))return null;
 for(let denominator=1;denominator<=99;denominator++){
  const numerator=Math.round(value*denominator);
  if(Math.abs(value-numerator/denominator)<=1e-10)return{numerator,denominator};
 }
 return null;
}
export function realPower(base:number,exponent:number):number{
 if(base>=0||Number.isInteger(exponent))return Math.pow(base,exponent);
 const fraction=rationalExponent(exponent);
 if(!fraction||fraction.denominator%2===0)return NaN;
 return (Math.abs(fraction.numerator)%2===1?-1:1)*Math.pow(-base,exponent);
}
