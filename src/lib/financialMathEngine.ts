export interface FinanceCheck { label:string; ok:boolean; detail:string }
export interface FinanceResult {
 title:string;
 formula:string;
 result:number;
 unit?:string;
 steps:string[];
 checks:FinanceCheck[];
}

const fmt=(n:number)=>{
 if(!Number.isFinite(n))return String(n);
 const r=Math.abs(n)<1e-12?0:Math.round(n*1e10)/1e10;
 return Number.isInteger(r)?String(r):String(r);
};
const valid=(...v:number[])=>v.every(Number.isFinite);
const near=(a:number,b:number)=>Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a),Math.abs(b));

export function simpleInterest(capital:number,rate:number,time:number):FinanceResult{
 if(!valid(capital,rate,time)||capital<0||rate<0||time<0)throw new Error('Capital, taux et durée doivent être des nombres positifs ou nuls.');
 const interest=capital*rate*time;
 const acquired=capital+interest;
 return{
  title:'Intérêt simple',formula:'I=C×i×t',result:interest,
  steps:[`I=${fmt(capital)}×${fmt(rate)}×${fmt(time)}=${fmt(interest)}`,`Valeur acquise A=C+I=${fmt(acquired)}`],
  checks:[{label:'Contrôle de la valeur acquise',ok:near(acquired,capital*(1+rate*time)),detail:`A=${fmt(acquired)}`}],
 };
}

export function commercialDiscount(nominal:number,discountRate:number,time:number):FinanceResult{
 if(!valid(nominal,discountRate,time)||nominal<0||discountRate<0||time<0)throw new Error('Valeur nominale, taux et durée doivent être positifs ou nuls.');
 const discount=nominal*discountRate*time;
 const current=nominal-discount;
 return{
  title:'Escompte commercial',formula:'D=N×d×t',result:discount,
  steps:[`D=${fmt(nominal)}×${fmt(discountRate)}×${fmt(time)}=${fmt(discount)}`,`Valeur actuelle VA=N−D=${fmt(current)}`],
  checks:[{label:'Contrôle valeur actuelle + escompte',ok:near(current+discount,nominal),detail:`${fmt(current)}+${fmt(discount)}=${fmt(nominal)}`}],
 };
}

export function compoundFutureValue(capital:number,rate:number,periods:number):FinanceResult{
 if(!valid(capital,rate,periods)||capital<0||rate<=-1||!Number.isSafeInteger(periods)||periods<0)throw new Error('Capital valide, taux > −100 % et nombre entier de périodes requis.');
 const future=capital*Math.pow(1+rate,periods);
 const present=future/Math.pow(1+rate,periods);
 return{
  title:'Capitalisation composée',formula:'A=C(1+i)^n',result:future,
  steps:[`A=${fmt(capital)}×(1+${fmt(rate)})^${periods}`,`A=${fmt(future)}`],
  checks:[{label:'Retour à la valeur actuelle',ok:near(present,capital),detail:`A/(1+i)^n=${fmt(present)}`}],
 };
}

export function presentValue(future:number,rate:number,periods:number):FinanceResult{
 if(!valid(future,rate,periods)||future<0||rate<=-1||!Number.isSafeInteger(periods)||periods<0)throw new Error('Valeur future valide, taux > −100 % et nombre entier de périodes requis.');
 const current=future/Math.pow(1+rate,periods);
 const rebuilt=current*Math.pow(1+rate,periods);
 return{
  title:'Actualisation',formula:'VA=VF/(1+i)^n',result:current,
  steps:[`VA=${fmt(future)}/(1+${fmt(rate)})^${periods}`,`VA=${fmt(current)}`],
  checks:[{label:'Reconstitution de la valeur future',ok:near(rebuilt,future),detail:`VA(1+i)^n=${fmt(rebuilt)}`}],
 };
}

export function annuityPresentValue(payment:number,rate:number,periods:number):FinanceResult{
 if(!valid(payment,rate,periods)||payment<0||rate<=-1||!Number.isSafeInteger(periods)||periods<1)throw new Error('Annuité positive, taux > −100 % et nombre entier de périodes ≥ 1 requis.');
 const factor=Math.abs(rate)<1e-14?periods:(1-Math.pow(1+rate,-periods))/rate;
 const value=payment*factor;
 const checkRate=Math.abs(rate)<1e-14?payment*periods:value*rate/(1-Math.pow(1+rate,-periods));
 return{
  title:'Valeur actuelle d’annuités constantes',formula:'VA=R[1−(1+i)^(-n)]/i',result:value,
  steps:[Math.abs(rate)<1e-14?`i=0 : VA=R×n=${fmt(payment)}×${periods}`:`VA=${fmt(payment)}×[1−(1+${fmt(rate)})^(−${periods})]/${fmt(rate)}`,`VA=${fmt(value)}`],
  checks:[{label:'Contrôle de l’annuité',ok:near(checkRate,payment),detail:`R recalculée=${fmt(checkRate)}`}],
 };
}

export function annuityFutureValue(payment:number,rate:number,periods:number):FinanceResult{
 if(!valid(payment,rate,periods)||payment<0||rate<=-1||!Number.isSafeInteger(periods)||periods<1)throw new Error('Annuité positive, taux > −100 % et nombre entier de périodes ≥ 1 requis.');
 const factor=Math.abs(rate)<1e-14?periods:(Math.pow(1+rate,periods)-1)/rate;
 const value=payment*factor;
 const checkRate=Math.abs(rate)<1e-14?payment*periods:value*rate/(Math.pow(1+rate,periods)-1);
 return{
  title:'Valeur acquise d’annuités constantes',formula:'VF=R[(1+i)^n−1]/i',result:value,
  steps:[Math.abs(rate)<1e-14?`i=0 : VF=R×n=${fmt(payment)}×${periods}`:`VF=${fmt(payment)}×[(1+${fmt(rate)})^${periods}−1]/${fmt(rate)}`,`VF=${fmt(value)}`],
  checks:[{label:'Contrôle de l’annuité',ok:near(checkRate,payment),detail:`R recalculée=${fmt(checkRate)}`}],
 };
}
