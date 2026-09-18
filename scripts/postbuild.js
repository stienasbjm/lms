import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const docsDir = path.join(rootDir, 'docs');
const rootAssetsDir = path.join(rootDir, 'assets');
const docsSubDocsDir = path.join(docsDir, 'docs');

console.log('Running robust post-build optimizations for GitHub Pages...');

// Safe, loop-free 404 redirect template for GitHub Pages
const root404Content = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Memuat LMS STIE Nasional...</title>
    <script>
      (function() {
        var hostname = window.location.hostname;
        var pathname = window.location.pathname;
        var search = window.location.search || '';
        var hash = window.location.hash || '';

        if (hostname.endsWith('github.io')) {
          var parts = pathname.split('/').filter(Boolean);
          var repo = parts.length > 0 ? parts[0] : 'lms';
          var targetPath = '/' + repo + '/docs/';

          // Jika URL saat ini bukan target /docs/, alihkan langsung ke portal LMS
          // Cek pathname !== targetPath menjamin tidak akan terjadi reload berulang kali
          if (pathname !== targetPath) {
            window.location.replace(targetPath + search + hash);
          }
        } else {
          if (pathname !== '/' && pathname !== '/docs/' && pathname !== '/docs') {
            window.location.replace('/' + search + hash);
          }
        }
      })();
    </script>
  </head>
  <body style="font-family: 'Inter', system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #f8fafc; color: #1e293b;">
    <div style="text-align: center; padding: 2rem; max-width: 480px; background: white; border-radius: 1rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">LMS STIE Nasional Banjarmasin</h2>
      <p style="font-size: 0.875rem; color: #64748b; margin-bottom: 1.5rem;">Halaman tidak ditemukan. Mengalihkan Anda kembali ke portal pembelajaran digital...</p>
      <a href="/lms/docs/" style="display: inline-block; padding: 0.625rem 1.25rem; background-color: #1e3a8a; color: white; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 600; text-decoration: none;">Klik di sini jika tidak beralih otomatis</a>
    </div>
  </body>
</html>
`;

// 1. Read dist/index.html, clean redirect script, and inject trailing slash resolver
const distIndex = path.join(distDir, 'index.html');
if (fs.existsSync(distIndex)) {
  let content = fs.readFileSync(distIndex, 'utf8');
  
  // Remove any root redirect script if copied into dist
  content = content.replace(/<script>\s*\/\/ Jika diakses via GitHub Pages[\s\S]*?<\/script>/, '');

  // Inject trailing slash fix & relative asset safety script
  const safetyScript = `
    <script>
      // 1. Enforce trailing slash on /docs to guarantee relative assets (./assets/...) resolve accurately
      if (window.location.hostname.endsWith('github.io') && window.location.pathname.endsWith('/docs')) {
        window.location.replace(window.location.pathname + '/' + window.location.search + window.location.hash);
      }
    </script>`;
  
  if (!content.includes('Enforce trailing slash on /docs')) {
    content = content.replace('<head>', '<head>' + safetyScript);
  }

  fs.writeFileSync(distIndex, content, 'utf8');
  console.log('✓ Injected trailing slash & relative asset safety into dist/index.html');

  // 2. Create dist/404.html with safe redirect back to /docs/
  const dist404 = path.join(distDir, '404.html');
  fs.writeFileSync(dist404, root404Content, 'utf8');
  console.log('✓ Created dist/404.html with safe redirect for GitHub Pages SPA routing');
}

// 3. Add .nojekyll to dist
fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf8');
console.log('✓ Created dist/.nojekyll');

// 4. Synchronize dist into docs/
if (fs.existsSync(docsDir)) {
  fs.rmSync(docsDir, { recursive: true, force: true });
}
fs.cpSync(distDir, docsDir, { recursive: true });
console.log('✓ Synchronized dist/ bundle into docs/ folder');

// 5. Mirror dist into docs/docs/
// Reason: If GitHub Pages publishing source is configured to /docs, accessing /lms/docs/ will look for docs/docs/
if (!fs.existsSync(docsSubDocsDir)) {
  fs.mkdirSync(docsSubDocsDir, { recursive: true });
}
fs.cpSync(distDir, docsSubDocsDir, { recursive: true });
console.log('✓ Mirrored bundle into docs/docs/ (guarantees zero-404 regardless of GitHub Pages /docs vs root setting)');

// 6. Synchronize assets to root /assets
// Reason: If a user visits /lms/docs (without trailing slash), relative ./assets/... resolves to /lms/assets/
if (fs.existsSync(rootAssetsDir)) {
  fs.rmSync(rootAssetsDir, { recursive: true, force: true });
}
const distAssets = path.join(distDir, 'assets');
if (fs.existsSync(distAssets)) {
  fs.cpSync(distAssets, rootAssetsDir, { recursive: true });
  console.log('✓ Mirrored assets into root /assets directory (fixes non-trailing slash asset resolution)');
}

// 7. Add root .nojekyll & root 404.html
fs.writeFileSync(path.join(rootDir, '.nojekyll'), '', 'utf8');
console.log('✓ Created root /.nojekyll (disables Jekyll processing at repository root)');

fs.writeFileSync(path.join(rootDir, '404.html'), root404Content, 'utf8');
console.log('✓ Created root /404.html (handles SPA route redirection for GitHub Pages)');

console.log('All post-build optimizations completed successfully!');
