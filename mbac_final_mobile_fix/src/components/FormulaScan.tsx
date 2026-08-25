import React, { useState, useRef, useCallback } from 'react';
import { MathExpression } from './MathNotation';

interface Props {
 onRecognize: (expr: string) => void;
 onClose: () => void;
}

// Pattern-based recognition from typed math text in images
// This works by analyzing text extracted from user's description
const COMMON_PATTERNS: { pattern: RegExp; replacement: string }[] = [
 { pattern: /√\s*\(([^)]+)\)/g, replacement: 'sqrt($1)' },
 { pattern: /√(\w+)/g, replacement: 'sqrt($1)' },
 { pattern: /(\w)\s*²/g, replacement: '$1^2' },
 { pattern: /(\w)\s*³/g, replacement: '$1^3' },
 { pattern: /×/g, replacement: '*' },
 { pattern: /÷/g, replacement: '/' },
 { pattern: /π/g, replacement: 'pi' },
 { pattern: /ln\s*\(/g, replacement: 'log(' },
 { pattern: /−/g, replacement: '-' },
];

function convertToMathjs(input: string): string {
 let result = input.trim();
 for (const { pattern, replacement } of COMMON_PATTERNS) {
  result = result.replace(pattern, replacement);
 }
 // Implicit multiplication: 2x → 2*x
 result = result.replace(/(\d)([a-zA-Z])/g, '$1*$2');
 result = result.replace(/(\d)\(/g, '$1*(');
 result = result.replace(/\)\(/g, ')*(');
 return result;
}

const QUICK_TEMPLATES = [
 { label: 'ax² + bx + c', expr: 'a*x^2 + b*x + c', desc: 'Trinôme du second degré' },
 { label: 'a/(x + b)', expr: 'a/(x + b)', desc: 'Fonction homographique' },
 { label: '√(ax + b)', expr: 'sqrt(a*x + b)', desc: 'Racine affine' },
 { label: 'a·eˣ + b', expr: 'a*exp(x) + b', desc: 'Exponentielle' },
 { label: 'a·ln(x) + b', expr: 'a*log(x) + b', desc: 'Logarithme' },
 { label: 'a·sin(bx)', expr: 'a*sin(b*x)', desc: 'Sinusoïde' },
 { label: '(ax+b)/(cx+d)', expr: '(a*x+b)/(c*x+d)', desc: 'Rationnelle' },
 { label: 'axⁿ', expr: 'a*x^n', desc: 'Puissance' },
];

export const FormulaScan: React.FC<Props> = ({ onRecognize, onClose }) => {
 const [inputText, setInputText] = useState('');
 const [convertedExpr, setConvertedExpr] = useState('');
 const [params, setParams] = useState<Record<string, string>>({});
 const [selectedTemplate, setSelectedTemplate] = useState<typeof QUICK_TEMPLATES[0] | null>(null);
 const [mode, setMode] = useState<'type' | 'template'>('type');
 const fileRef = useRef<HTMLInputElement>(null);
 const [imagePreview, setImagePreview] = useState<string | null>(null);

 const handleConvert = useCallback(() => {
  const converted = convertToMathjs(inputText);
  setConvertedExpr(converted);
 }, [inputText]);

 const handleSubmitConverted = useCallback(() => {
  if (convertedExpr.trim()) onRecognize(convertedExpr.trim());
 }, [convertedExpr, onRecognize]);

 const handleSelectTemplate = useCallback((tmpl: typeof QUICK_TEMPLATES[0]) => {
  setSelectedTemplate(tmpl);
  // Extract params
  const paramNames = (tmpl.expr.match(/[a-d]/g) || []).filter((v, i, a) => a.indexOf(v) === i && v !== 'x');
  const initialParams: Record<string, string> = {};
  paramNames.forEach(p => initialParams[p] = p === 'a' ? '1' : p === 'n' ? '2' : '0');
  setParams(initialParams);
 }, []);

 const handleSubmitTemplate = useCallback(() => {
  if (!selectedTemplate) return;
  let expr = selectedTemplate.expr;
  Object.entries(params).forEach(([key, value]) => {
   expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), `(${value})`);
  });
  onRecognize(expr);
 }, [selectedTemplate, params, onRecognize]);

 const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
   setImagePreview(ev.target?.result as string);
  };
  reader.readAsDataURL(file);
 }, []);

 return (
  <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto">
   <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
    <div className="flex items-center justify-between mb-4">
     <h2 className="text-xl font-bold text-white"> Scan de formule</h2>
     <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">×</button>
    </div>

    {/* Mode selector */}
    <div className="flex gap-2 mb-4">
     <button onClick={() => setMode('type')} className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${mode === 'type' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
      Recopier la formule
     </button>
     <button onClick={() => setMode('template')} className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${mode === 'template' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
       Modèle rapide
     </button>
    </div>

    {/* MODE: Type the formula */}
    {mode === 'type' && (
     <div className="space-y-4">
      {/* Camera / Photo */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30 text-center">
       <p className="text-sm text-slate-300 mb-3"> Prenez une photo de la formule, puis recopiez-la ci-dessous</p>
       <button
        onClick={() => fileRef.current?.click()}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl active:scale-95"
       >
         Prendre une photo
       </button>
       <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
      </div>

      {/* Image preview */}
      {imagePreview && (
       <div className="rounded-xl overflow-hidden border border-slate-700/50">
        <img src={imagePreview} alt="Formule" className="w-full max-h-48 object-contain bg-slate-900" />
       </div>
      )}

      {/* Text input */}
      <div>
       <label className="block text-xs text-indigo-400 font-semibold mb-1">Recopiez la formule telle que vous la voyez :</label>
       <textarea
        value={inputText}
        onChange={e => setInputText(e.target.value)}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white text-lg font-mono resize-none h-24 focus:border-indigo-500 focus:outline-none"
        placeholder="Ex: x² + 3x − 5 ou √(2x+1) ou sin(x) ÷ x"
       />
       <p className="text-xs text-slate-500 mt-1">
        Vous pouvez utiliser : √, ², ³, π, ×, ÷, ln, sin, cos, tan
       </p>
      </div>

      {/* Convert */}
      <button onClick={handleConvert} disabled={!inputText.trim()} className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white font-bold rounded-xl active:scale-[0.98]">
        Convertir
      </button>

      {/* Result */}
      {convertedExpr && (
       <div className="space-y-3">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
         <p className="text-xs text-emerald-400 mb-1">Expression convertie :</p>
         <div className="text-xl text-white text-center math-answer"><MathExpression value={convertedExpr} /></div>
        </div>
        <button onClick={handleSubmitConverted} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]">
          Analyser cette fonction
        </button>
       </div>
      )}
     </div>
    )}

    {/* MODE: Template */}
    {mode === 'template' && (
     <div className="space-y-4">
      <p className="text-sm text-slate-400">Choisissez un type de fonction et remplissez les paramètres :</p>
      
      <div className="grid grid-cols-2 gap-2">
       {QUICK_TEMPLATES.map((tmpl, i) => (
        <button
         key={i}
         onClick={() => handleSelectTemplate(tmpl)}
         className={`text-left p-3 rounded-xl border transition-all active:scale-95 ${
          selectedTemplate?.label === tmpl.label
           ? 'bg-indigo-600/20 border-indigo-500/50'
           : 'bg-slate-800/50 border-slate-700/30 hover:border-indigo-500/30'
         }`}
        >
         <div className="text-white text-sm"><MathExpression value={tmpl.expr} /></div>
         <p className="text-xs text-slate-500 mt-0.5">{tmpl.desc}</p>
        </button>
       ))}
      </div>

      {/* Parameters */}
      {selectedTemplate && (
       <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30 space-y-3">
        <p className="text-sm font-bold text-purple-300">Remplissez les paramètres :</p>
        <div className="text-xs text-slate-400"><MathExpression value={selectedTemplate.expr} /></div>
        <div className="grid grid-cols-2 gap-2">
         {Object.entries(params).map(([key, value]) => (
          <div key={key}>
           <label className="block text-xs text-indigo-400 mb-1">{key} =</label>
           <input
            type="number"
            value={value}
            onChange={e => setParams(prev => ({ ...prev, [key]: e.target.value }))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
            step="0.5"
           />
          </div>
         ))}
        </div>

        {/* Preview */}
        <div className="bg-slate-900/50 rounded-lg p-3">
         <p className="text-xs text-slate-400 mb-1">Aperçu :</p>
         <p className="font-mono text-white text-center">
          f(x) = {(() => {
           let e = selectedTemplate.expr;
           Object.entries(params).forEach(([k, v]) => { e = e.replace(new RegExp(`\\b${k}\\b`, 'g'), v || '0'); });
           return e;
          })()}
         </p>
        </div>

        <button onClick={handleSubmitTemplate} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98]">
          Analyser cette fonction
        </button>
       </div>
      )}
     </div>
    )}
   </div>
  </div>
 );
};
