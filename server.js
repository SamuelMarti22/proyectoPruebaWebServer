require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const DB_FILE = path.join(__dirname, 'database.txt');
const CLIENT_DIR = path.join(__dirname, 'client');

// ─── Utilidades de Base de Datos ───────────────────────────────────────────

function readMovies() {
  const content = fs.readFileSync(DB_FILE, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split('|');
  return lines.slice(1).map(line => {
    const values = line.split('|');
    return headers.reduce((obj, h, i) => {
      obj[h.trim()] = values[i] ? values[i].trim() : '';
      return obj;
    }, {});
  });
}

function writeMovie(movie) {
  const movies = readMovies();
  const newId = movies.length > 0 ? Math.max(...movies.map(m => parseInt(m.id))) + 1 : 1;
  const line = `\n${newId}|${movie.title}|${movie.year}|${movie.genre}|${movie.director}|${movie.rating}|${movie.description}|${movie.poster}|${movie.duration}|${movie.cast}`;
  fs.appendFileSync(DB_FILE, line, 'utf-8');
  return { ...movie, id: newId };
}

// ─── MIME Types ─────────────────────────────────────────────────────────────

const MIME_TYPES = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.gif':  'image/gif',
  '.txt':  'text/plain',
  '.ico':  'image/x-icon',
};

function getMime(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

// ─── Helpers de respuesta ───────────────────────────────────────────────────

function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 - Archivo no encontrado');
      return;
    }
    res.writeHead(200, { 'Content-Type': getMime(filePath) });
    res.end(data);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

// ─── Servidor Principal ─────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname  = parsedUrl.pathname;
  const method    = req.method.toUpperCase();
  const origin    = req.headers.origin || '-';
  const remote    = req.socket.remoteAddress || '-';

  // CORS preflight
  if (method === 'OPTIONS') {
    console.log(`[${new Date().toISOString()}] OPTIONS ${pathname} origin=${origin} remote=${remote}`);
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  console.log(`[${new Date().toISOString()}] ${method} ${pathname} origin=${origin} remote=${remote}`);

  // ── API Routes ─────────────────────────────────────────────────────────

  // GET /api/movies — Listar todas las películas
  if (pathname === '/api/movies' && method === 'GET') {
    try {
      const movies = readMovies();
      console.log(`[api/movies] GET -> ${movies.length} registros`);
      sendJSON(res, 200, { success: true, count: movies.length, data: movies });
    } catch (e) {
      console.error('[api/movies] GET failed:', e);
      sendJSON(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // GET /api/movies/:id — Obtener una película
  const movieMatch = pathname.match(/^\/api\/movies\/(\d+)$/);
  if (movieMatch && method === 'GET') {
    try {
      const movies = readMovies();
      const movie = movies.find(m => m.id === movieMatch[1]);
      console.log(`[api/movies/${movieMatch[1]}] GET -> ${movie ? 'found' : 'not found'}`);
      if (!movie) return sendJSON(res, 404, { success: false, error: 'Película no encontrada' });
      sendJSON(res, 200, { success: true, data: movie });
    } catch (e) {
      console.error(`[api/movies/${movieMatch?.[1]}] GET failed:`, e);
      sendJSON(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // POST /api/movies — Agregar película
  if (pathname === '/api/movies' && method === 'POST') {
    try {
      const body = await readBody(req);
      console.log('[api/movies] POST body raw:', body);
      const movie = JSON.parse(body);
      console.log('[api/movies] POST parsed:', movie);

      // Validación básica
      const required = ['title', 'year', 'genre', 'director', 'rating', 'description'];
      for (const field of required) {
        if (!movie[field]) {
          console.warn('[api/movies] POST validation failed:', field);
          return sendJSON(res, 400, { success: false, error: `Campo requerido: ${field}` });
        }
      }
      movie.poster   = movie.poster   || 'https://via.placeholder.com/300x450?text=Sin+Imagen';
      movie.duration = movie.duration || '0';
      movie.cast     = movie.cast     || 'N/A';

      const saved = writeMovie(movie);
      console.log('[api/movies] POST saved:', saved);
      sendJSON(res, 201, { success: true, data: saved });
    } catch (e) {
      console.error('[api/movies] POST failed:', e);
      sendJSON(res, 400, { success: false, error: 'JSON inválido: ' + e.message });
    }
    return;
  }

  // GET /api/db — Ver el archivo TXT crudo
  if (pathname === '/api/db' && method === 'GET') {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      console.log(`[api/db] GET -> ${content.length} bytes`);
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(content);
    } catch (e) {
      console.error('[api/db] GET failed:', e);
      sendJSON(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // ── Archivos estáticos del cliente ──────────────────────────────────────

  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(CLIENT_DIR, filePath);

  // Seguridad: evitar path traversal
  if (!filePath.startsWith(CLIENT_DIR)) {
    console.warn('[static] blocked path traversal attempt:', pathname, 'resolved=', filePath);
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 - Prohibido');
    return;
  }

  console.log('[static] serving:', filePath);
  sendFile(res, filePath);
});

server.listen(PORT, HOST, () => {
  console.log(`\n🎬 CineLog Server corriendo en http://${HOST}:${PORT}`);
  console.log(`   API Movies  → http://${HOST}:${PORT}/api/movies`);
  console.log(`   Database    → http://${HOST}:${PORT}/api/db\n`);
});
