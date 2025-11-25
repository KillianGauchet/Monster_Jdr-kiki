import DiscordSDK from '@discord/embedded-app-sdk';

const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || process.env.CLIENT_ID;

DiscordSDK.ready(async () => {
  const { channel, guild } = await DiscordSDK.authorize({ clientId });
  document.getElementById('app').innerHTML = `
    <p>Bienvenue sur l'activité Discord !</p>
    <p>Salon : ${channel ? channel.name : "?"}</p>
  `;
});
