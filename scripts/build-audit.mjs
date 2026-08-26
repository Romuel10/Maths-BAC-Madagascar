import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const distDirectory = path.resolve('dist');
const manifestPath = path.join(distDirectory, 'asset-manifest.json');
if (!fs.existsSync(manifestPath)) throw new Error('Build absent : exécuter npm run build.');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const entryKey = Object.keys(manifest).find(key => manifest[key]?.isEntry);
if (!entryKey) throw new Error('Entrée Vite introuvable dans le manifeste.');

const initialKeys = new Set();
function visit(key) {
  if (initialKeys.has(key)) return;
  const item = manifest[key];
  if (!item) throw new Error(`Dépendance initiale absente du manifeste : ${key}`);
  initialKeys.add(key);
  for (const imported of item.imports || []) visit(imported);
}
visit(entryKey);

const initialFiles = [...initialKeys].map(key => manifest[key].file);
const initialCss = [...new Set([...initialKeys].flatMap(key => manifest[key].css || []))];
const initialAssets = [...initialFiles, ...initialCss];
const initialGzipBytes = initialAssets.reduce((total, relativePath) => {
  const bytes = fs.readFileSync(path.join(distDirectory, relativePath));
  return total + gzipSync(bytes).length;
}, 0);

const failures = [];
if (initialAssets.some(file => file.toLowerCase().includes('mathjs'))) failures.push('MathJS est revenu dans le chargement initial.');
if (initialGzipBytes > 260 * 1024) failures.push(`Chargement initial trop lourd : ${Math.round(initialGzipBytes / 1024)} Kio gzip.`);
if (!Object.values(manifest).some(item => item?.file?.includes('mathjs-'))) failures.push('Le paquet MathJS séparé est introuvable.');
if (!fs.readdirSync(path.join(distDirectory, 'assets')).some(file => file.startsWith('analysis.worker-') && file.endsWith('.js'))) failures.push('Le Web Worker d’analyse est introuvable.');
if (!Object.keys(manifest).includes('src/components/BacGuidedSolver.tsx') || !Object.keys(manifest).includes('src/components/BacExamSession.tsx')) failures.push('Les sessions BAC doivent rester chargées à la demande.');

console.log(`Build audit: ${initialAssets.length} ressources initiales, ${Math.round(initialGzipBytes / 1024)} Kio gzip, ${failures.length} erreur(s)`);
for (const failure of failures) console.error('FAIL', failure);
if (failures.length) process.exit(1);
