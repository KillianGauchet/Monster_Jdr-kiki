const { promises: fs } = require('node:fs');
const path = require('node:path');
const { ok, fail } = require('./replies');
const { getSession, pathEspece, pathBanque, readSessionUsers, writeSessionUsers } = require('./session');

const COIN_VALUE = { pc: 1, pa: 10, po: 100, pp: 1000 };
const COIN_LABEL = { pc: 'Cuivre (PC)', pa: 'Argent (PA)', po: 'Or (PO)', pp: 'Platine (PP)' };
const COIN_NAME  = { pc: 'Cuivre', pa: 'Argent', po: 'Or', pp: 'Platine' };

async function ensureFile(file) {
  try { await fs.access(file); }
  catch {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify({ sessions: {} }, null, 2), 'utf8');
  }
}

function fileFor(cible) {
  return cible === 'espece' ? pathEspece() : pathBanque();
}

async function readDB(userId, cible) {
  const file = fileFor(cible);
  await ensureFile(file);
  const sessionId = await getSession(userId);
  const users = await readSessionUsers(file, sessionId);
  return { users: { ...users } };
}

async function writeDB(userId, cible, db) {
  const file = fileFor(cible);
  await ensureFile(file);
  const sessionId = await getSession(userId);
  await writeSessionUsers(file, sessionId, db.users || {});
}

function ensureUser(db, userId) {
  db.users[userId] ??= { pc: 0, pa: 0, po: 0, pp: 0 };
  return db.users[userId];
}

function validateTarget(v) {
  if (v !== 'espece' && v !== 'banque') throw new Error('cible invalide');
  return v;
}
function validatePiece(p) {
  if (!COIN_VALUE[p]) throw new Error('pièce invalide');
  return p;
}

/* Opérations métier (inchangées) */
async function add(userId, cible, piece, montant) {
  const db = await readDB(userId, cible); const u = ensureUser(db, userId);
  u[piece] += montant; await writeDB(userId, cible, db); return u[piece];
}
async function remove(userId, cible, piece, montant) {
  const db = await readDB(userId, cible); const u = ensureUser(db, userId);
  u[piece] = Math.max(0, u[piece] - montant); await writeDB(userId, cible, db); return u[piece];
}
async function transfer(userId, from, to, piece, qty) {
  if (from === to) return { ok: false, reason: 'same_target' };
  const dbFrom = await readDB(userId, from); const uf = ensureUser(dbFrom, userId);
  const dbTo   = await readDB(userId, to);   const ut = ensureUser(dbTo, userId);
  if ((uf[piece] ?? 0) < qty) return { ok: false, reason: 'insufficient', dispo: uf[piece] ?? 0 };
  uf[piece] -= qty; ut[piece] += qty;
  // Écritures séparées par cible
  await Promise.all([writeDB(userId, from, dbFrom), writeDB(userId, to, dbTo)]);
  return { ok: true, fromLeft: uf[piece], toNow: ut[piece] };
}
function convertMath(from, to, qty) {
  const vf = COIN_VALUE[from], vt = COIN_VALUE[to];
  const totalPc = qty * vf;
  const nbTo = Math.floor(totalPc / vt);
  const restePc = totalPc - nbTo * vt;
  const resteFrom = Math.floor(restePc / vf);
  const pertePc = restePc - resteFrom * vf;
  return { nbTo, resteFrom, pertePc, totalPc };
}
async function exchange(userId, cible, from, to, qty) {
  if (from === to) return { ok: false, reason: 'same_piece' };
  const db = await readDB(userId, cible); const u = ensureUser(db, userId);
  const dispo = u[from] ?? 0;
  if (dispo < qty) return { ok: false, reason: 'insufficient', dispo };
  const { nbTo, resteFrom, pertePc, totalPc } = convertMath(from, to, qty);
  if (nbTo <= 0) return { ok: false, reason: 'too_small', totalPc, need: COIN_VALUE[to] };
  u[from] -= qty;
  u[to] += nbTo;
  if (resteFrom > 0) u[from] += resteFrom;
  await writeDB(userId, cible, db);
  return { ok: true, nbTo, resteFrom, pertePc };
}

/* Helpers UI + replies (identiques) */
function formatWalletLine(k, v) { return `${COIN_NAME[k]}: ${v}`; }
function walletToText(userObj) { return Object.entries(userObj).map(([k,v]) => formatWalletLine(k, v)).join('\n'); }

async function replyAdd(interaction, cible, piece, montant) {
  const userId = interaction.user.id; await add(userId, cible, piece, montant);
  return ok(interaction, `Ajouté ${montant} ${COIN_NAME[piece]} à ta ${cible}.`);
}
async function replyRemove(interaction, cible, piece, montant) {
  const userId = interaction.user.id; await remove(userId, cible, piece, montant);
  return ok(interaction, `Retiré ${montant} ${COIN_NAME[piece]} de ta ${cible}.`);
}
async function replyTransfer(interaction, from, to, piece, qty) {
  const userId = interaction.user.id; const res = await transfer(userId, from, to, piece, qty);
  if (!res.ok) {
    if (res.reason === 'same_target') return fail(interaction, 'La source et la destination doivent être différentes.');
    if (res.reason === 'insufficient') return fail(interaction, `Solde insuffisant: ${res.dispo} ${piece.toUpperCase()} côté ${from}.`);
    return;
  }
  return ok(interaction, `Transféré ${qty} ${COIN_NAME[piece]} de ${from} vers ${to}. Nouveau solde: ${from}=${res.fromLeft} | ${to}=${res.toNow}.`);
}
async function replyExchange(interaction, cible, from, to, qty) {
  const userId = interaction.user.id; const res = await exchange(userId, cible, from, to, qty);
  if (!res.ok) {
    if (res.reason === 'same_piece') return fail(interaction, 'La pièce source et la pièce cible doivent être différentes.');
    if (res.reason === 'insufficient') return fail(interaction, `Solde insuffisant en ${from.toUpperCase()}.`);
    if (res.reason === 'too_small') return fail(interaction, `Valeur insuffisante pour obtenir 1 ${to.toUpperCase()}.`);
    return;
  }
  const parts = [`Échange: ${qty} ${from.toUpperCase()} -> ${res.nbTo} ${to.toUpperCase()}`];
  if (res.resteFrom > 0) parts.push(`reste ${res.resteFrom} ${from.toUpperCase()}`);
  if (res.pertePc > 0) parts.push(`perte ${res.pertePc} pc`);
  return ok(interaction, parts.join(', '));
}

module.exports = {
  COIN_VALUE, COIN_LABEL, COIN_NAME,
  readDB, writeDB, ensureUser, validateTarget, validatePiece,
  add, remove, transfer, exchange, convertMath, walletToText,
  replyAdd, replyRemove, replyTransfer, replyExchange,
};
