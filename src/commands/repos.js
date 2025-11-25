const { SlashCommandBuilder } = require('discord.js');
const { readDB, writeDB } = require('../framework/session');
const { ok } = require('../framework/replies');

async function getPlayerData(userId) {
  const db = await readDB();
  const sessionId = db.userSessions?.[userId] || '1';
  if (!db.sessions[sessionId]) db.sessions[sessionId] = { players: {} };
  if (!db.sessions[sessionId].players[userId]) {
    db.sessions[sessionId].players[userId] = {
      joueur: {
        force: 0, constitution: 0, agilite: 0, intelligence: 0, perception: 0,
        hp: 0, hpMax: 0, mana: 0, manaMax: 0, stam: 0, stamMax: 0,
      },
      money: {
        bank: { pc: 0, pa: 0, po: 0, pp: 0 },
        wallet: { pc: 0, pa: 0, po: 0, pp: 0 },
      },
    };
  }
  return { db, sessionId, player: db.sessions[sessionId].players[userId] };
}

const builders = [
  new SlashCommandBuilder().setName('repos_long').setDescription('Restaure HP, Mana et Stamina au maximum.'),
  new SlashCommandBuilder().setName('repos_court').setDescription('Restaure Mana et Stamina au maximum.'),
  new SlashCommandBuilder()
    .setName('repos_simple')
    .setDescription('Restaure une ressource (mana ou stam).')
    .addStringOption(o =>
      o.setName('cible')
        .setDescription('mana ou stam')
        .setRequired(true)
        .addChoices({ name: 'mana', value: 'mana' }, { name: 'stam', value: 'stam' })),
];

const handlers = {
  repos_long: async (interaction) => {
    const userId = interaction.user.id;
    const { db, player } = await getPlayerData(userId);
    const j = player.joueur;
    j.hp = j.hpMax;
    j.mana = j.manaMax;
    j.stam = j.stamMax;
    await writeDB(db);
    return ok(interaction, 'Repos long : tout restauré.');
  },

  repos_court: async (interaction) => {
    const userId = interaction.user.id;
    const { db, player } = await getPlayerData(userId);
    const j = player.joueur;
    j.mana = j.manaMax;
    j.stam = j.stamMax;
    await writeDB(db);
    return ok(interaction, 'Repos court : mana/stam restaurés.');
  },

  repos_simple: async (interaction) => {
    const userId = interaction.user.id;
    const cible = interaction.options.getString('cible');
    const { db, player } = await getPlayerData(userId);
    const j = player.joueur;
    if (cible === 'mana') j.mana = j.manaMax;
    else j.stam = j.stamMax;
    await writeDB(db);
    return ok(interaction, `Repos simple : ${cible} restauré.`);
  },
};

module.exports = { builders, handlers };
