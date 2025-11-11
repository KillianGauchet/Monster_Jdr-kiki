// src/commands/rolls.js
const { SlashCommandBuilder } = require('discord.js');
const { readDB, writeDB, ensureUser } = require('../framework/ficheStore');
const { d, xdy, adv, parseXdy } = require('../framework/random');
const { ok, fail } = require('../framework/replies');

/* --- Builders --- */
const builders = [
  new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Dé 100, min/max, ou xdy.')
    .addIntegerOption(o => o.setName('min').setDescription('Valeur min').setRequired(false))
    .addIntegerOption(o => o.setName('max').setDescription('Valeur max').setRequired(false))
    .addStringOption(o => o.setName('de').setDescription('Forme xdy').setRequired(false)),

  new SlashCommandBuilder()
    .setName('roll_force')
    .setDescription('Roll force (consomme stam).')
    .addStringOption(o => o.setName('type').setDescription('a/m').setRequired(false)
      .addChoices({ name: 'avantage', value: 'a' }, { name: 'malus', value: 'm' }))
    .addIntegerOption(o => o.setName('modificateur').setDescription('Modificateur').setRequired(false)),

  new SlashCommandBuilder()
    .setName('roll_agilite')
    .setDescription('Roll agilité (consomme stam).')
    .addStringOption(o => o.setName('type').setDescription('a/m').setRequired(false)
      .addChoices({ name: 'avantage', value: 'a' }, { name: 'malus', value: 'm' }))
    .addIntegerOption(o => o.setName('modificateur').setDescription('Modificateur').setRequired(false)),

  new SlashCommandBuilder()
    .setName('roll_constitution')
    .setDescription('Roll constitution.')
    .addStringOption(o => o.setName('type').setDescription('a/m').setRequired(false)
      .addChoices({ name: 'avantage', value: 'a' }, { name: 'malus', value: 'm' }))
    .addIntegerOption(o => o.setName('modificateur').setDescription('Modificateur').setRequired(false)),

  new SlashCommandBuilder()
    .setName('roll_intelligence')
    .setDescription('Roll intelligence simple.')
    .addStringOption(o => o.setName('type').setDescription('a/m').setRequired(false)
      .addChoices({ name: 'avantage', value: 'a' }, { name: 'malus', value: 'm' }))
    .addIntegerOption(o => o.setName('modificateur').setDescription('Modificateur').setRequired(false)),

  new SlashCommandBuilder()
    .setName('roll_perception')
    .setDescription('Roll perception.')
    .addStringOption(o => o.setName('type').setDescription('a/m').setRequired(false)
      .addChoices({ name: 'avantage', value: 'a' }, { name: 'malus', value: 'm' }))
    .addIntegerOption(o => o.setName('modificateur').setDescription('Modificateur').setRequired(false)),

  new SlashCommandBuilder()
    .setName('roll_sort')
    .setDescription('Roll sort, mana consommée, effets et modificateurs.')
    .addStringOption(o => o.setName('type').setDescription('a/m').setRequired(false)
      .addChoices({ name: 'avantage', value: 'a' }, { name: 'malus', value: 'm' }))
    .addIntegerOption(o => o.setName('modificateur_int').setDescription('Modif intelligence post-dé').setRequired(false))
    .addIntegerOption(o => o.setName('modificateur_effet').setDescription('Modif global effets').setRequired(false))
    .addIntegerOption(o => o.setName('effet1').setDescription('Effet 1').setRequired(false))
    .addIntegerOption(o => o.setName('effet2').setDescription('Effet 2').setRequired(false))
    .addIntegerOption(o => o.setName('effet3').setDescription('Effet 3').setRequired(false))
    .addIntegerOption(o => o.setName('effet4').setDescription('Effet 4').setRequired(false))
    .addIntegerOption(o => o.setName('effet5').setDescription('Effet 5').setRequired(false))
    .addIntegerOption(o => o.setName('effet6').setDescription('Effet 6').setRequired(false))
    .addIntegerOption(o => o.setName('effet7').setDescription('Effet 7').setRequired(false))
    .addIntegerOption(o => o.setName('effet8').setDescription('Effet 8').setRequired(false))
    .addIntegerOption(o => o.setName('effet9').setDescription('Effet 9').setRequired(false)),
];

/* --- Helpers métier --- */
function formatRoll(title, stat, roll, type, mod, final) {
  const modStr = `${mod >= 0 ? '+' : ''}${mod}`;
  return `**${title}** (${stat})\n🎲 [${roll.list.join(', ')}]${type ? ` (${type})` : ''} → ${roll.chosen}\nModif: ${modStr}\nRésultat: ${final}`;
}

function getEffets(interaction) {
  const effets = [];
  for (let i = 1; i <= 9; i++) {
    const v = interaction.options.getInteger('effet' + i);
    if (v) effets.push({ index: i, valeur: v });
  }
  return effets;
}

/* --- Handlers --- */
const handlers = {
  roll: async (interaction) => {
    const min = interaction.options.getInteger('min');
    const max = interaction.options.getInteger('max');
    const de = interaction.options.getString('de');

    let out;
    const parsed = parseXdy(de);
    if (parsed) {
      const r = xdy(parsed.x, parsed.y);
      out = `Roll ${parsed.x}d${parsed.y}: [${r.vals.join(', ')}] = ${r.sum}`;
    } else if (de) {
      return fail(interaction, 'Format de dé non reconnu (ex: 2d20).');
    } else if (min !== null || max !== null) {
      let a = min ?? 1; let b = max ?? 100;
      if (a > b) [a, b] = [b, a];
      // utilise d() pour uniformiser
      out = `Roll ${a}-${b}: ${a + (d(b - a + 1) - 1)}`;
    } else {
      out = `Roll 1-100: ${d(100)}`;
    }
    return ok(interaction, out);
  },

  roll_force: async (interaction) => {
    const userId = interaction.user.id;
    const db = await readDB(userId); const u = ensureUser(db, userId);
    const type = interaction.options.getString('type') || null;
    const mod = interaction.options.getInteger('modificateur') || 0;

    const roll = adv(u.force, type);
    const final = roll.chosen + mod;
    u.stam = Math.max(0, u.stam - roll.chosen);
    await writeDB(userId, db);

    return ok(interaction, `${formatRoll('Force', u.force, roll, type, mod, final)}\nStam consommée: ${roll.chosen} → Stam: ${u.stam}`);
  },

  roll_agilite: async (interaction) => {
    const userId = interaction.user.id;
    const db = await readDB(userId); const u = ensureUser(db, userId);
    const type = interaction.options.getString('type') || null;
    const mod = interaction.options.getInteger('modificateur') || 0;

    const roll = adv(u.agilite, type);
    const final = roll.chosen + mod;
    u.stam = Math.max(0, u.stam - roll.chosen);
    await writeDB(userId, db);

    return ok(interaction, `${formatRoll('Agilité', u.agilite, roll, type, mod, final)}\nStam consommée: ${roll.chosen} → Stam: ${u.stam}`);
  },

  roll_constitution: async (interaction) => {
    const userId = interaction.user.id;
    const db = await readDB(userId); const u = ensureUser(db, userId);
    const type = interaction.options.getString('type') || null;
    const mod = interaction.options.getInteger('modificateur') || 0;

    const roll = adv(u.constitution, type);
    const final = roll.chosen + mod;
    await writeDB(userId, db);

    return ok(interaction, formatRoll('Constitution', u.constitution, roll, type, mod, final));
  },

  roll_intelligence: async (interaction) => {
    const userId = interaction.user.id;
    const db = await readDB(userId); const u = ensureUser(db, userId);
    const type = interaction.options.getString('type') || null;
    const mod = interaction.options.getInteger('modificateur') || 0;

    const roll = adv(u.intelligence, type);
    const final = roll.chosen + mod;
    await writeDB(userId, db);

    return ok(interaction, formatRoll('Intelligence', u.intelligence, roll, type, mod, final));
  },

  roll_perception: async (interaction) => {
    const userId = interaction.user.id;
    const db = await readDB(userId); const u = ensureUser(db, userId);
    const type = interaction.options.getString('type') || null;
    const mod = interaction.options.getInteger('modificateur') || 0;

    const roll = adv(u.perception, type);
    const final = roll.chosen + mod;
    await writeDB(userId, db);

    return ok(interaction, formatRoll('Perception', u.perception, roll, type, mod, final));
  },

  roll_sort: async (interaction) => {
    const userId = interaction.user.id;
    const db = await readDB(userId); const u = ensureUser(db, userId);

    const type = interaction.options.getString('type') || null;
    const modInt = interaction.options.getInteger('modificateur_int') || 0;
    const modEffet = interaction.options.getInteger('modificateur_effet') || 0;
    const effets = getEffets(interaction);

    const totalEffet = effets.reduce((s, e) => s + e.valeur, 0);
    const intelDispo = u.intelligence - totalEffet;
    if (intelDispo < 0) return fail(interaction, "Erreur : trop d'effets (total > stat intelligence)");

    const rollBase = adv(intelDispo, type);
    const intFinal = rollBase.chosen + modInt;
    u.mana = Math.max(0, u.mana - rollBase.chosen);

    const out = [
      `**Roll Sort** (${intelDispo}/${u.intelligence})`,
      `🎲 [${rollBase.list.join(', ')}]${type ? ` (${type})` : ''} → ${rollBase.chosen}`,
      `Modif int: ${modInt >= 0 ? '+' : ''}${modInt}`,
      `Résultat sort: ${intFinal}`,
    ];

    const effetsResults = [];
    for (const e of effets) {
      const r = adv(e.valeur, type);
      effetsResults.push(r.chosen + modEffet);
      out.push(`Effet${e.index} (${e.valeur}): [${r.list.join(', ')}]${type ? ` (${type})` : ''} → ${r.chosen}`);
    }
    if (effets.length && modEffet) {
      out.push(`Modificateur effet: ${modEffet >= 0 ? '+' : ''}${modEffet}`);
      out.push(`Effets finaux: [${effetsResults.join(', ')}]`);
    }

    out.push(`Mana consommée: ${rollBase.chosen} → Mana: ${u.mana}`);

    await writeDB(userId, db);
    return ok(interaction, out.join('\n'));
  },
};

module.exports = { builders, handlers };
