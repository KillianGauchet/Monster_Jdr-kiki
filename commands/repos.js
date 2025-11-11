const { SlashCommandBuilder } = require('discord.js');
const { readDB, writeDB, ensureUser } = require('../framework/ficheStore');
const { ok } = require('../framework/replies');

/* --- Builders --- */
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

/* --- Handlers --- */
const handlers = {
  repos_long: async (interaction) => {
    const userId = interaction.user.id;
    const db = await readDB(userId);
    const u = ensureUser(db, userId);

    u.hp = u.hpMax;
    u.mana = u.manaMax;
    u.stam = u.stamMax;

    await writeDB(userId, db);
    return ok(interaction, 'Repos long : tout restauré.');
  },

  repos_court: async (interaction) => {
    const userId = interaction.user.id;
    const db = await readDB(userId);
    const u = ensureUser(db, userId);

    u.mana = u.manaMax;
    u.stam = u.stamMax;

    await writeDB(userId, db);
    return ok(interaction, 'Repos court : mana/stam restaurés.');
  },

  repos_simple: async (interaction) => {
    const userId = interaction.user.id;
    const cible = interaction.options.getString('cible'); // 'mana' | 'stam'
    const db = await readDB(userId);
    const u = ensureUser(db, userId);

    if (cible === 'mana') u.mana = u.manaMax;
    else u.stam = u.stamMax;

    await writeDB(userId, db);
    return ok(interaction, `Repos simple : ${cible} restauré.`);
  },
};

module.exports = { builders, handlers };
