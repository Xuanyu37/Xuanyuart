import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PORT = Number(process.env.PORT || 8080);
const TYPES = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.webp':'image/webp', '.avif':'image/avif',
  '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.gif':'image/gif',
  '.mp4':'video/mp4', '.webm':'video/webm', '.mp3':'audio/mpeg', '.m4a':'audio/mp4', '.wav':'audio/wav',
  '.ogg':'audio/ogg', '.pdf':'application/pdf'
};

http.createServer((req,res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); }
  catch { pathname = '/'; }

  let file = path.join(ROOT, pathname);
  if (pathname.endsWith('/')) file = path.join(file,'index.html');
  else if (!path.extname(file) && fs.existsSync(path.join(file,'index.html'))) file = path.join(file,'index.html');

  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(ROOT,'404.html');
    res.statusCode = 404;
  }

  res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-cache');
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Preview: http://localhost:${PORT}`));
