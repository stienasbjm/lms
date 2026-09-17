import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const docsDir = path.join(rootDir, 'docs');

console.log('Running post-build optimizations for GitHub Pages...');

// 1. Read dist/index.html and clean any root redirect script
const distIndex = path.join(distDir, 'index.html');
if (fs.existsSync(distIndex)) {
  let content = fs.readFileSync(distIndex, 'utf8');
  // Remove the redirect script if copied into dist
  content = content.replace(/<script>\s*\/\/ Jika diakses via GitHub Pages[\s\S]*?<\/script>/, '');
  fs.writeFileSync(distIndex, content, 'utf8');
  console.log('✓ Cleaned redirect script from dist/index.html');

  // 2. Create dist/404.html for SPA routing
  const dist404 = path.join(distDir, '404.html');
  fs.writeFileSync(dist404, content, 'utf8');
  console.log('✓ Created dist/404.html for GitHub Pages SPA routing');
}

// 3. Add .nojekyll to dist
fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf8');
console.log('✓ Created dist/.nojekyll');

// 4. Copy dist into docs/
if (fs.existsSync(docsDir)) {
  fs.rmSync(docsDir, { recursive: true, force: true });
}
fs.cpSync(distDir, docsDir, { recursive: true });
console.log('✓ Synchronized dist/ bundle into docs/ folder');

console.log('Post-build finished successfully!');
