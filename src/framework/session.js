const { promises: fs } = require('node:fs');
const path = require('node:path');

const dbRoot = path.join(__dirname, '../../db');
const sessionMapFile = path.join(dbRoot, 'session_id.json');
const ficheFile = path.join(dbRoot, 'fiche.json');
const especeFile = path.join(dbRoot, 'espece.json');
const banqueFile = path.join(dbRoot, 'banque.json');

async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }

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

/* Mapping user->session courante */
async function loadSessionMap() {
  await ensureDir(dbRoot);
  const db = await readJson(sessionMapFile, { users: {} });
  if (!db.users) db.users = {};
  return db;
}
async function saveSessionMap(db) { await writeJson(sessionMapFile, db); }

async function getSession(userId) {
  const db = await loadSessionMap();
  return db.users[userId] || '1';
}

/* Fichiers de bases */
function pathFiche()  { return ficheFile; }
function pathEspece() { return especeFile; }
function pathBanque() { return banqueFile; }

/* Helpers internes pour bases */
async function ensureBase(file) {
  await ensureDir(path.dirname(file));
  const base = await readJson(file, { sessions: {} });
  if (!base.sessions) base.sessions = {};
  return base;
}
async function saveBase(file, base) { await writeJson(file, base); }

/* Existence / création / suppression de session au niveau des 3 bases */
async function sessionExists(sessionId) {
  const [F, E, B] = await Promise.all([ensureBase(ficheFile), ensureBase(especeFile), ensureBase(banqueFile)]);
  return Boolean(F.sessions[sessionId] || E.sessions[sessionId] || B.sessions[sessionId]);
}

async function createSession(sessionId) {
  const [F, E, B] = await Promise.all([ensureBase(ficheFile), ensureBase(especeFile), ensureBase(banqueFile)]);
  if (!F.sessions[sessionId]) F.sessions[sessionId] = { users: {} };
  if (!E.sessions[sessionId]) E.sessions[sessionId] = { users: {} };
  if (!B.sessions[sessionId]) B.sessions[sessionId] = { users: {} };
  await Promise.all([saveBase(ficheFile, F), saveBase(especeFile, E), saveBase(banqueFile, B)]);
}

async function deleteSession(sessionId) {
  const [F, E, B] = await Promise.all([ensureBase(ficheFile), ensureBase(especeFile), ensureBase(banqueFile)]);
  if (F.sessions[sessionId]) delete F.sessions[sessionId];
  if (E.sessions[sessionId]) delete E.sessions[sessionId];
  if (B.sessions[sessionId]) delete B.sessions[sessionId];
  await Promise.all([saveBase(ficheFile, F), saveBase(especeFile, E), saveBase(banqueFile, B)]);

  // Nettoyer tous les users mappés sur cette session
  const map = await loadSessionMap();
  for (const [uid, sid] of Object.entries(map.users)) {
    if (sid === String(sessionId)) delete map.users[uid];
  }
  await saveSessionMap(map);
}

/* Accès lecture/écriture users pour une session donnée dans une base */
async function readSessionUsers(file, sessionId) {
  const base = await ensureBase(file);
  if (!base.sessions[sessionId]) base.sessions[sessionId] = { users: {} };
  if (!base.sessions[sessionId].users) base.sessions[sessionId].users = {};
  return base.sessions[sessionId].users;
}

async function writeSessionUsers(file, sessionId, usersObj) {
  const base = await ensureBase(file);
  base.sessions[sessionId] = base.sessions[sessionId] || { users: {} };
  base.sessions[sessionId].users = usersObj;
  await saveBase(file, base);
}

/* setSession: n’accepte que des sessions existantes */
async function setSession(userId, session) {
  const sid = String(session);
  const exists = await sessionExists(sid);
  if (!exists) throw new Error('Session inconnue');
  const db = await loadSessionMap();
  db.users[userId] = sid;
  await saveSessionMap(db);
}

/* Installer global.PATHS (compat) */
let installed = false;
async function installGlobalPaths() {
  if (installed && global.PATHS) return;
  global.PATHS = {
    fiche:  () => pathFiche(),
    espece: () => pathEspece(),
    banque: () => pathBanque(),
  };
  installed = true;
}

module.exports = {
  getSession, setSession, installGlobalPaths,
  pathFiche, pathEspece, pathBanque,
  readSessionUsers, writeSessionUsers,
  sessionExists, createSession, deleteSession,
};
