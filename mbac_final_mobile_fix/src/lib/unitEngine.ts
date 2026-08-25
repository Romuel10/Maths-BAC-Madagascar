export type UnitCategoryId = 'length' | 'mass' | 'area' | 'volume' | 'temperature' | 'angle' | 'speed' | 'time' | 'data';
export interface UnitDefinition { id:string; name:string; factor?:number }
export interface UnitCategory { id:UnitCategoryId; symbol:string; label:string; units:UnitDefinition[] }
export interface UnitCheck { label:string; ok:boolean; detail:string }
export interface UnitConversionResult { value:number; from:UnitDefinition; to:UnitDefinition; factorText?:string; steps:string[]; checks:UnitCheck[]; warning?:string }

export const UNIT_CATEGORIES: UnitCategory[] = [
 { id:'length',symbol:'m',label:'Longueur',units:[{id:'km',name:'Kilomètre',factor:1000},{id:'m',name:'Mètre',factor:1},{id:'dm',name:'Décimètre',factor:.1},{id:'cm',name:'Centimètre',factor:.01},{id:'mm',name:'Millimètre',factor:.001},{id:'um',name:'Micromètre',factor:1e-6},{id:'nm',name:'Nanomètre',factor:1e-9},{id:'mi',name:'Mile',factor:1609.344},{id:'ft',name:'Pied',factor:.3048},{id:'in',name:'Pouce',factor:.0254}]},
 { id:'mass',symbol:'kg',label:'Masse',units:[{id:'t',name:'Tonne',factor:1000},{id:'kg',name:'Kilogramme',factor:1},{id:'g',name:'Gramme',factor:.001},{id:'mg',name:'Milligramme',factor:1e-6},{id:'lb',name:'Livre',factor:.45359237},{id:'oz',name:'Once',factor:.028349523125}]},
 { id:'area',symbol:'m²',label:'Surface',units:[{id:'km2',name:'km²',factor:1e6},{id:'ha',name:'Hectare',factor:10000},{id:'m2',name:'m²',factor:1},{id:'dm2',name:'dm²',factor:.01},{id:'cm2',name:'cm²',factor:1e-4},{id:'mm2',name:'mm²',factor:1e-6}]},
 { id:'volume',symbol:'L',label:'Volume',units:[{id:'m3',name:'m³',factor:1000},{id:'L',name:'Litre',factor:1},{id:'dL',name:'Décilitre',factor:.1},{id:'cL',name:'Centilitre',factor:.01},{id:'mL',name:'Millilitre',factor:.001},{id:'gal',name:'Gallon US',factor:3.785411784}]},
 { id:'temperature',symbol:'°C',label:'Température',units:[{id:'C',name:'°Celsius'},{id:'F',name:'°Fahrenheit'},{id:'K',name:'Kelvin'}]},
 { id:'angle',symbol:'°',label:'Angle',units:[{id:'deg',name:'Degré (°)',factor:1},{id:'rad',name:'Radian',factor:180/Math.PI},{id:'grad',name:'Grade',factor:.9},{id:'turn',name:'Tour',factor:360}]},
 { id:'speed',symbol:'v',label:'Vitesse',units:[{id:'ms',name:'m/s',factor:1},{id:'kmh',name:'km/h',factor:1/3.6},{id:'mph',name:'mi/h',factor:.44704},{id:'kn',name:'Nœud',factor:1852/3600},{id:'c',name:'c (lumière)',factor:299792458}]},
 { id:'time',symbol:'t',label:'Temps',units:[{id:'y',name:'Année (365 j, convention)',factor:31536000},{id:'mo',name:'Mois (30 j, convention)',factor:2592000},{id:'w',name:'Semaine',factor:604800},{id:'d',name:'Jour',factor:86400},{id:'h',name:'Heure',factor:3600},{id:'min',name:'Minute',factor:60},{id:'s',name:'Seconde',factor:1},{id:'ms',name:'Milliseconde',factor:.001}]},
 { id:'data',symbol:'B',label:'Données',units:[{id:'TB',name:'Téraoctet',factor:1e12},{id:'GB',name:'Gigaoctet',factor:1e9},{id:'MB',name:'Mégaoctet',factor:1e6},{id:'KB',name:'Kilooctet',factor:1e3},{id:'B',name:'Octet',factor:1},{id:'bit',name:'Bit',factor:.125}]},
];

export function formatUnitNumber(n:number):string {
 if (!Number.isFinite(n)) return String(n);
 if (Math.abs(n)<1e-4 && n!==0 || Math.abs(n)>=1e9) return n.toExponential(6).replace(/0+e/,'e');
 const r=Math.round(n*1e10)/1e10; return Number.isInteger(r)?String(r):String(r);
}
function find(category:UnitCategoryId,id:string):UnitDefinition|null { return UNIT_CATEGORIES.find(c=>c.id===category)?.units.find(u=>u.id===id)??null; }
function toCelsius(v:number,id:string):number { if(id==='C')return v;if(id==='F')return(v-32)*5/9;if(id==='K')return v-273.15;throw new Error('Unité de température invalide.'); }
function fromCelsius(c:number,id:string):number { if(id==='C')return c;if(id==='F')return c*9/5+32;if(id==='K')return c+273.15;throw new Error('Unité de température invalide.'); }

export function convertUnit(category:UnitCategoryId,value:number,fromId:string,toId:string):UnitConversionResult {
 if(!Number.isFinite(value)) throw new Error('La valeur doit être un nombre réel fini.');
 const from=find(category,fromId),to=find(category,toId); if(!from||!to)throw new Error('Unité inconnue.');
 if(category==='temperature'){
  const c=toCelsius(value,fromId), result=fromCelsius(c,toId), kelvin=c+273.15;
  const physical=kelvin>=-1e-10;
  const reverse=toCelsius(result,toId);
  return{value:result,from,to,steps:[`${formatUnitNumber(value)} ${from.name}`,fromId==='C'?`Température de référence : ${formatUnitNumber(c)} °C`:`Conversion en Celsius : ${formatUnitNumber(c)} °C`,`Conversion vers ${to.name} : ${formatUnitNumber(result)} ${to.name}`],checks:[{label:'Conversion inverse',ok:Math.abs(reverse-c)<=1e-10*Math.max(1,Math.abs(c)),detail:`La conversion inverse redonne ${formatUnitNumber(reverse)} °C.`},{label:'Température physique',ok:physical,detail:physical?'La température est supérieure ou égale au zéro absolu.':'Une température thermodynamique inférieure à 0 K n’est pas physiquement valide.'}],warning:physical?undefined:'Résultat mathématique calculé, mais la température saisie est sous le zéro absolu.'};
 }
 const ff=from.factor,tf=to.factor;if(!ff||!tf)throw new Error('Facteur de conversion manquant.');
 const base=value*ff,result=base/tf,direct=ff/tf,reverse=result*tf/ff;
 const ok=Math.abs(reverse-value)<=2e-12*Math.max(1,Math.abs(value));
 const convention=category==='time'&&(fromId==='y'||fromId==='mo'||toId==='y'||toId==='mo');
 return{value:result,from,to,factorText:`1 ${from.name} = ${formatUnitNumber(direct)} ${to.name}`,steps:[`${formatUnitNumber(value)} ${from.name}`,`Facteur direct : × ${formatUnitNumber(direct)}`,`${formatUnitNumber(value)} × ${formatUnitNumber(direct)} = ${formatUnitNumber(result)} ${to.name}`],checks:[{label:'Conversion inverse',ok,detail:`Le retour vers l’unité de départ donne ${formatUnitNumber(reverse)}.`},{label:'Facteurs cohérents',ok:Number.isFinite(base)&&Number.isFinite(result),detail:`Passage par l’unité de référence : ${formatUnitNumber(base)}.`}],warning:convention?'Année = 365 jours et mois = 30 jours sont des conventions de conversion, pas des durées calendaires exactes.':undefined};
}
