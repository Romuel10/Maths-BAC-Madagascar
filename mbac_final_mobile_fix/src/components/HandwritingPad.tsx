import React, { useRef, useState, useCallback, useEffect } from 'react';
import { MathExpression } from './MathNotation';

interface Props {
 onRecognize: (expr: string) => void;
 onClose: () => void;
}

// Simple handwriting → math expression recognition
// Maps drawn stroke patterns to common math symbols
const SYMBOL_MAP: { name: string; insert: string; label: string }[] = [
 { name: 'x', insert: 'x', label: 'x' },
 { name: '0', insert: '0', label: '0' },
 { name: '1', insert: '1', label: '1' },
 { name: '2', insert: '2', label: '2' },
 { name: '3', insert: '3', label: '3' },
 { name: '4', insert: '4', label: '4' },
 { name: '5', insert: '5', label: '5' },
 { name: '6', insert: '6', label: '6' },
 { name: '7', insert: '7', label: '7' },
 { name: '8', insert: '8', label: '8' },
 { name: '9', insert: '9', label: '9' },
 { name: '+', insert: '+', label: '+' },
 { name: '−', insert: '-', label: '−' },
 { name: '×', insert: '*', label: '×' },
 { name: '÷', insert: '/', label: '÷' },
 { name: '(', insert: '(', label: '(' },
 { name: ')', insert: ')', label: ')' },
 { name: '²', insert: '^2', label: 'x²' },
 { name: '³', insert: '^3', label: 'x³' },
 { name: '^', insert: '^', label: '^' },
 { name: '√', insert: 'sqrt(', label: '√' },
 { name: 'sin', insert: 'sin(', label: 'sin' },
 { name: 'cos', insert: 'cos(', label: 'cos' },
 { name: 'ln', insert: 'log(', label: 'ln' },
 { name: 'e', insert: 'exp(', label: 'eˣ' },
 { name: 'π', insert: 'pi', label: 'π' },
 { name: '.', insert: '.', label: '.' },
];

export const HandwritingPad: React.FC<Props> = ({ onRecognize, onClose }) => {
 const canvasRef = useRef<HTMLCanvasElement>(null);
 const containerRef = useRef<HTMLDivElement>(null);
 const [isDrawing, setIsDrawing] = useState(false);
 const [expression, setExpression] = useState('');
 const [dims, setDims] = useState({ w: 350, h: 200 });

 useEffect(() => {
  if (containerRef.current) {
   const w = containerRef.current.clientWidth;
   setDims({ w, h: Math.min(w * 0.55, 220) });
  }
 }, []);

 useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = dims.w * dpr;
  canvas.height = dims.h * dpr;
  const ctx = canvas.getContext('2d');
  if (ctx) {
   ctx.scale(dpr, dpr);
   ctx.fillStyle = '#0f172a';
   ctx.fillRect(0, 0, dims.w, dims.h);
   // Draw hint text
   ctx.fillStyle = '#334155';
   ctx.font = '16px system-ui';
   ctx.textAlign = 'center';
   ctx.fillText('Dessinez ici avec votre doigt', dims.w / 2, dims.h / 2 - 10);
   ctx.font = '12px system-ui';
   ctx.fillText('puis touchez un symbole ci-dessous', dims.w / 2, dims.h / 2 + 15);
  }
 }, [dims]);

 const getPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
  const canvas = canvasRef.current;
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  return { x: clientX - rect.left, y: clientY - rect.top };
 }, []);

 const startDraw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
  e.preventDefault();
  setIsDrawing(true);
  const pos = getPos(e);
  const ctx = canvasRef.current?.getContext('2d');
  if (ctx && pos) {
   ctx.beginPath();
   ctx.moveTo(pos.x, pos.y);
   ctx.strokeStyle = '#a78bfa';
   ctx.lineWidth = 3;
   ctx.lineCap = 'round';
   ctx.lineJoin = 'round';
  }
 }, [getPos]);

 const moveDraw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
  if (!isDrawing) return;
  e.preventDefault();
  const pos = getPos(e);
  const ctx = canvasRef.current?.getContext('2d');
  if (ctx && pos) {
   ctx.lineTo(pos.x, pos.y);
   ctx.stroke();
  }
 }, [isDrawing, getPos]);

 const endDraw = useCallback(() => {
  setIsDrawing(false);
 }, []);

 const clearCanvas = useCallback(() => {
  const ctx = canvasRef.current?.getContext('2d');
  if (ctx) {
   ctx.fillStyle = '#0f172a';
   ctx.fillRect(0, 0, dims.w, dims.h);
  }
 }, [dims]);

 const addSymbol = useCallback((insert: string) => {
  setExpression(prev => prev + insert);
  clearCanvas();
 }, [clearCanvas]);

 const removeLastChar = useCallback(() => {
  setExpression(prev => {
   // Remove multi-char tokens intelligently
   const tokens = ['sqrt(', 'sin(', 'cos(', 'tan(', 'log(', 'exp(', '^2', '^3', 'pi'];
   for (const tok of tokens) {
    if (prev.endsWith(tok)) return prev.slice(0, -tok.length);
   }
   return prev.slice(0, -1);
  });
 }, []);

 const handleSubmit = useCallback(() => {
  if (expression.trim()) {
   onRecognize(expression.trim());
  }
 }, [expression, onRecognize]);

 return (
  <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto">
   <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
    <div className="flex items-center justify-between mb-4">
     <h2 className="text-xl font-bold text-white"> Écriture manuscrite</h2>
     <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">×</button>
    </div>

    {/* Expression display */}
    <div className="bg-slate-900/80 border-2 border-indigo-500/30 rounded-xl px-4 py-3 mb-3 min-h-[50px] flex items-center">
     {expression ? (
      <span className="text-xl text-white tracking-wide math-answer flex items-center"><MathExpression value={expression} /><span className="animate-pulse text-indigo-400 ml-1">|</span></span>
     ) : (
      <span className="text-slate-600">Construisez votre expression...</span>
     )}
    </div>

    {/* Drawing canvas */}
    <div ref={containerRef} className="rounded-xl overflow-hidden border-2 border-slate-600/50 mb-3 touch-none">
     <canvas
      ref={canvasRef}
      style={{ width: dims.w, height: dims.h }}
      className="block"
      onTouchStart={startDraw}
      onTouchMove={moveDraw}
      onTouchEnd={endDraw}
      onMouseDown={startDraw}
      onMouseMove={moveDraw}
      onMouseUp={endDraw}
      onMouseLeave={endDraw}
     />
    </div>

    {/* Symbol buttons — tap to insert */}
    <div className="mb-3">
     <p className="text-xs text-slate-500 mb-2">Dessinez puis touchez le symbole reconnu :</p>
     <div className="grid grid-cols-9 gap-1">
      {SYMBOL_MAP.slice(0, 18).map((sym, i) => (
       <button
        key={i}
        onClick={() => addSymbol(sym.insert)}
        className="py-2.5 rounded-lg text-sm font-bold bg-slate-700/60 text-white border border-slate-600/50 active:bg-indigo-600 active:scale-90 transition-all"
       >
        {sym.label}
       </button>
      ))}
     </div>
     <div className="grid grid-cols-9 gap-1 mt-1">
      {SYMBOL_MAP.slice(18).map((sym, i) => (
       <button
        key={i}
        onClick={() => addSymbol(sym.insert)}
        className="py-2.5 rounded-lg text-sm font-bold bg-slate-700/60 text-white border border-slate-600/50 active:bg-indigo-600 active:scale-90 transition-all"
       >
        {sym.label}
       </button>
      ))}
     </div>
    </div>

    {/* Actions */}
    <div className="grid grid-cols-4 gap-2 mb-4">
     <button onClick={clearCanvas} className="py-2.5 rounded-xl text-sm font-bold bg-slate-700 text-slate-300 active:scale-95">
       Effacer
     </button>
     <button onClick={removeLastChar} className="py-2.5 rounded-xl text-sm font-bold bg-orange-600/20 text-orange-300 border border-orange-500/30 active:scale-95">
      ⌫
     </button>
     <button onClick={() => setExpression('')} className="py-2.5 rounded-xl text-sm font-bold bg-red-600/20 text-red-300 border border-red-500/30 active:scale-95">
      AC
     </button>
     <button
      onClick={handleSubmit}
      disabled={!expression.trim()}
      className="py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white disabled:bg-slate-700 disabled:text-slate-500 active:scale-95"
     >
       OK
     </button>
    </div>

    {/* Explanation */}
    <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
     <p className="text-sm font-bold text-blue-300 mb-2"> Comment utiliser</p>
     <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
      <li>Dessinez un symbole dans la zone de dessin pour vous rappeler</li>
      <li>Touchez le bouton correspondant pour l'ajouter à l'expression</li>
      <li>Construisez votre expression symbole par symbole</li>
      <li>Appuyez sur <strong className="text-indigo-300">OK</strong> pour analyser</li>
     </ol>
    </div>
   </div>
  </div>
 );
};
