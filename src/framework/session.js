const { promises: fs } = require('node:fs');
const path = require('node:path');

const dbRoot = path.join(__dirname, '../../db');
const sessionIdPath = path.join(dbRoot, 'session_id.json');

async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }

async function ensureDbRoot() {
  try { await fs.access(dbRoot); }
  catch { await ensureDir(dbRoot); }
}

async function readJson(file, fallback) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

async function loadSessionMap() {
  await ensureDbRoot();
  const data = await readJson(sessionIdPath, { users: {} });
  if (!data.users) data.users = {};
  return data;
}
async function saveSessionMap(db) { await writeJson(sessionIdPath, db); }

async function getSession(userId) {
  const db = await loadSessionMap();
  return db.users[userId] || '1';
}

async function setSession(userId, session) {
  const db = await loadSessionMap();
  db.users[userId] = String(session);
  await saveSessionMap(db);
  await ensureSessionFiles(String(session));
}

async function ensureSessionFiles(session) {
  const folder = path.join(dbRoot, String(session));
  await ensureDir(folder);
  for (const name of ['fiche.json', 'espece.json', 'banque.json']) {
    const file = path.join(folder, name);
    try { await fs.access(file); }
    catch { await writeJson(file, { users: {} }); }
  }
}

async function pathFiche(userId) {
  const s = await getSession(userId);
  await ensureSessionFiles(s);
  return path.join(dbRoot, String(s), 'fiche.json');
}
async function pathEspece(userId) {
  const s = await getSession(userId);
  await ensureSessionFiles(s);
  return path.join(dbRoot, String(s), 'espece.json');
}
async function pathBanque(userId) {
  const s = await getSession(userId);
  await ensureSessionFiles(s);
  return path.join(dbRoot, String(s), 'banque.json');
}

/* Installation de global.PATHS avec garde idempotente */
let installed = false;
async function installGlobalPaths() {
  if (installed && global.PATHS) return;
  global.PATHS = {
    fiche: (userId) => pathFiche(userId),
    espece: (userId) => pathEspece(userId),
    banque: (userId) => pathBanque(userId),
  };
  installed = true;
}

module.exports = {
  getSession, setSession, ensureSessionFiles, installGlobalPaths,
  pathFiche, pathEspece, pathBanque,
};
