const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('node:path');
const { ok } = require('../framework/replies');
const {
  COIN_LABEL, COIN_NAME, validateTarget, validatePiece,
  readDB, ensureUser, walletToText,
  replyAdd, replyRemove, replyTransfer, replyExchange,
} = require('../framework/economie');

const builders = [
  new SlashCommandBuilder()
    .setName('add_money')
    .setDescription("Ajoute de l'argent à espèce ou banque")
    .addStringOption(o => o.setName('cible').setDescription('espece ou banque').setRequired(true)
      .addChoices({ name: 'espece', value: 'espece' }, { name: 'banque', value: 'banque' }))
    .addStringOption(o => o.setName('piece').setDescription('Type de pièce').setRequired(true)
      .addChoices({ name: 'cuivre', value: 'pc' }, { name: 'argent', value: 'pa' }, { name: 'or', value: 'po' }, { name: 'platine', value: 'pp' }))
    .addIntegerOption(o => o.setName('montant').setDescription('Quantité à ajouter').setRequired(true).setMinValue(1)),

  new SlashCommandBuilder()
    .setName('remove_money')
    .setDescription("Retire de l'argent d'espèce ou banque")
    .addStringOption(o => o.setName('cible').setDescription('espece ou banque').setRequired(true)
      .addChoices({ name: 'espece', value: 'espece' }, { name: 'banque', value: 'banque' }))
    .addStringOption(o => o.setName('piece').setDescription('Type de pièce').setRequired(true)
      .addChoices({ name: 'cuivre', value: 'pc' }, { name: 'argent', value: 'pa' }, { name: 'or', value: 'po' }, { name: 'platine', value: 'pp' }))
    .addIntegerOption(o => o.setName('montant').setDescription('Quantité à retirer').setRequired(true).setMinValue(1)),

  new SlashCommandBuilder().setName('money').setDescription('Affiche tes espèces et banque'),

  new SlashCommandBuilder().setName('money_valeur').setDescription("Affiche le tableau des taux d'échange des pièces"),

  new SlashCommandBuilder()
    .setName('money_transfer')
    .setDescription('Transférer des pièces entre espèce et banque')
    .addStringOption(o => o.setName('from').setDescription('Depuis').setRequired(true)
      .addChoices({ name: 'espece', value: 'espece' }, { name: 'banque', value: 'banque' }))
    .addStringOption(o => o.setName('to').setDescription('Vers').setRequired(true)
      .addChoices({ name: 'espece', value: 'espece' }, { name: 'banque', value: 'banque' }))
    .addStringOption(o => o.setName('piece').setDescription('Type de pièce').setRequired(true)
      .addChoices({ name: 'cuivre', value: 'pc' }, { name: 'argent', value: 'pa' }, { name: 'or', value: 'po' }, { name: 'platine', value: 'pp' }))
    .addIntegerOption(o => o.setName('quantite').setDescription('Quantité à transférer').setRequired(true).setMinValue(1)),

  new SlashCommandBuilder()
    .setName('money_exchange')
    .setDescription('Convertit des pièces (espèce/banque)')
    .addStringOption(o => o.setName('cible').setDescription('Où faire l’échange').setRequired(true)
      .addChoices({ name: 'espece', value: 'espece' }, { name: 'banque', value: 'banque' }))
    .addStringOption(o => o.setName('from').setDescription('Pièce source').setRequired(true)
      .addChoices({ name: 'pc', value: 'pc' }, { name: 'pa', value: 'pa' }, { name: 'po', value: 'po' }, { name: 'pp', value: 'pp' }))
    .addIntegerOption(o => o.setName('quantite').setDescription('Quantité à convertir').setRequired(true).setMinValue(1))
    .addStringOption(o => o.setName('to').setDescription('Pièce cible').setRequired(true)
      .addChoices({ name: 'pc', value: 'pc' }, { name: 'pa', value: 'pa' }, { name: 'po', value: 'po' }, { name: 'pp', value: 'pp' })),
];

const handlers = {
  add_money: async (interaction) => {
    const cible = validateTarget(interaction.options.getString('cible'));
    const piece = validatePiece(interaction.options.getString('piece'));
    const montant = interaction.options.getInteger('montant');
    return replyAdd(interaction, cible, piece, montant);
  },

  remove_money: async (interaction) => {
    const cible = validateTarget(interaction.options.getString('cible'));
    const piece = validatePiece(interaction.options.getString('piece'));
    const montant = interaction.options.getInteger('montant');
    return replyRemove(interaction, cible, piece, montant);
  },

  money: async (interaction) => {
    const userId = interaction.user.id;
    const dbEsp = await readDB(userId, 'espece'); const uEsp = ensureUser(dbEsp, userId);
    const dbBan = await readDB(userId, 'banque'); const uBan = ensureUser(dbBan, userId);

    const embed = new EmbedBuilder()
      .setTitle('Argent')
      .addFields(
        { name: 'Espèce', value: walletToText(uEsp), inline: true },
        { name: 'Banque', value: walletToText(uBan), inline: true },
      )
      .setColor(0xFFD700);

    return ok(interaction, '', { embeds: [embed] });
  },

  money_valeur: async (interaction) => {
    const filePath = path.join(__dirname, '..', 'image', 'tableau.png');
    const embed = new EmbedBuilder()
      .setTitle("Tableau des taux d'échange")
      .setImage('attachment://money_valeur.png')
      .setColor(0xFFD700);

    return ok(interaction, '', {
      embeds: [embed],
      files: [{ attachment: filePath, name: 'money_valeur.png' }],
    });
  },

  money_transfer: async (interaction) => {
    const from = validateTarget(interaction.options.getString('from'));
    const to = validateTarget(interaction.options.getString('to'));
    const piece = validatePiece(interaction.options.getString('piece'));
    const qty = interaction.options.getInteger('quantite');
    return replyTransfer(interaction, from, to, piece, qty);
  },

  money_exchange: async (interaction) => {
    const cible = validateTarget(interaction.options.getString('cible'));
    const from = validatePiece(interaction.options.getString('from'));
    const to = validatePiece(interaction.options.getString('to'));
    const qty = interaction.options.getInteger('quantite');
    return replyExchange(interaction, cible, from, to, qty);
  },
};

module.exports = { builders, handlers, COIN_LABEL };
