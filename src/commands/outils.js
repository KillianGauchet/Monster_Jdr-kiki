const { SlashCommandBuilder } = require('discord.js');
const { getSession, setSession, installGlobalPaths } = require('../framework/session');
const { ok, fail } = require('../framework/replies');

const builders = [
  new SlashCommandBuilder()
    .setName('session')
    .setDescription('Définit ou affiche la session')
    .addIntegerOption(o => o.setName('numero').setDescription('Numéro session').setRequired(false)),
];

const handlers = {
  session: async (interaction) => {
    // S’assure que global.PATHS est prêt pour les autres modules
    if (!global.PATHS) await installGlobalPaths();

    const userId = interaction.user.id;
    const num = interaction.options.getInteger('numero');

    if (num !== null && num !== undefined) {
      if (num < 1) return fail(interaction, 'Le numéro de session doit être ≥ 1.');
      await setSession(userId, num);
      return ok(interaction, `Session changée : ${num}`);
    } else {
      const current = await getSession(userId);
      return ok(interaction, `Session actuelle : ${current}`);
    }
  },
};

module.exports = { builders, handlers };
