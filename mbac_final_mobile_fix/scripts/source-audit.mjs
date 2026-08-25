import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const files = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(name)) files.push(p);
  }
}
walk(root);

let checks = 0;
const errors = [];
const localRe = /(?:from\s+|import\s*\()(['"])(\.{1,2}\/[^'"]+)\1/g;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = localRe.exec(text))) {
    checks++;
    const spec = m[2];
    const base = path.resolve(path.dirname(file), spec);
    const candidates = [];
    const ext = path.extname(base);
    if (ext) {
      candidates.push(base);
      if (ext === '.js') candidates.push(base.slice(0, -3) + '.ts', base.slice(0, -3) + '.tsx');
    } else {
      candidates.push(base + '.ts', base + '.tsx', base + '.js', base + '.jsx', path.join(base, 'index.ts'), path.join(base, 'index.tsx'));
    }
    if (!candidates.some(p => fs.existsSync(p))) errors.push(`${path.relative('.', file)} -> ${spec}`);
  }

  if (file.includes(`${path.sep}components${path.sep}`)) {
    checks++;
    if (/from\s+['"]mathjs['"]/.test(text)) errors.push(`${path.relative('.', file)} importe MathJS directement`);
  }
}

console.log(`Source audit: ${files.length} fichiers TS/TSX, ${checks} contrôles, ${errors.length} erreur(s)`);
for (const e of errors) console.error('FAIL', e);
if (errors.length) process.exit(1);
