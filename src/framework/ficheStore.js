const { promises: fs } = require('node:fs');
const path = require('node:path');
const { getSession, pathFiche, readSessionUsers, writeSessionUsers } = require('./session');

async function ensureFile(file) {
  try { await fs.access(file); }
  catch {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify({ sessions: {} }, null, 2), 'utf8');
  }
}

async function readDB(userId) {
  const file = pathFiche();
  await ensureFile(file);
  const sessionId = await getSession(userId);
  const users = await readSessionUsers(file, sessionId);
  // Retour compat: { users: { ... } }
  return { users: { ...users } };
}

async function writeDB(userId, db) {
  const file = pathFiche();
  await ensureFile(file);
  const sessionId = await getSession(userId);
  await writeSessionUsers(file, sessionId, db.users || {});
}

function ensureUser(db, userId) {
  db.users[userId] ??= {
    hp: 0, hpMax: 0, mana: 0, manaMax: 0, stam: 0, stamMax: 0,
    force: 0, constitution: 0, agilite: 0, intelligence: 0, perception: 0,
  };
  return db.users[userId];
}

function updateDerived(u) {
  u.hpMax = Math.max(0, u.constitution * 4);
  u.manaMax = Math.max(0, u.intelligence * 20);
  u.stamMax = Math.max(0, (u.force + u.agilite) * 10);
  u.hp = Math.min(u.hp, u.hpMax);
  u.mana = Math.min(u.mana, u.manaMax);
  u.stam = Math.min(u.stam, u.stamMax);
}

module.exports = { readDB, writeDB, ensureUser, updateDerived };
