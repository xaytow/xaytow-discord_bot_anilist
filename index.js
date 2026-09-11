import "dotenv/config";
import http from "http";
import { Client, GatewayIntentBits, EmbedBuilder, Partials } from "discord.js";
import cron from "node-cron";
import { getUserLists } from "./anilist.js";
import { buildDigest } from "./digest.js";

const { DISCORD_TOKEN, DISCORD_USER_ID, ANILIST_USERNAME, CRON_SCHEDULE } = process.env;

if (!DISCORD_TOKEN || !DISCORD_USER_ID || !ANILIST_USERNAME) {
  console.error("❌ Il manque une variable dans le fichier .env");
  process.exit(1);
}

// 1. Mini serveur HTTP pour satisfaire Render et garder le bot éveillé
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot AniList actif !\n");
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🌍 Serveur HTTP actif sur le port ${PORT}`);
});

// 2. Configuration du client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

async function runDigestAndSendDM(user, { silent = false } = {}) {
  const lists = await getUserLists(ANILIST_USERNAME);
  const content = buildDigest(lists, 1);

  if (!content) {
    if (!silent) await user.send("Rien à signaler aujourd'hui 👍");
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`📅 Planning anime — ${ANILIST_USERNAME}`)
    .setDescription(content)
    .setColor(0x3db4f2)
    .setFooter({ text: "Source : AniList" })
    .setTimestamp(new Date());

  await user.send({ embeds: [embed] });
}

client.once("clientReady", async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  const targetUser = await client.users.fetch(DISCORD_USER_ID);
  console.log(`👤 Utilisateur cible : ${targetUser.tag}`);

  const schedule = CRON_SCHEDULE || "0 9 * * *";
  cron.schedule(schedule, async () => {
    try {
      await runDigestAndSendDM(targetUser, { silent: false });
    } catch (err) {
      console.error("Erreur digest planifié :", err);
    }
  });

  console.log(`🕒 Digest programmé (${schedule})`);
});

client.on("messageCreate", async (message) => {
  console.log(`📨 Message reçu de ${message.author.tag} : "${message.content}" (DM: ${!message.guild})`);

  if (message.author.bot) return;
  if (message.author.id !== DISCORD_USER_ID) return;
  if (message.content.trim().toLowerCase() !== "!anime") return;

  try {
    await message.channel.send("🔎 Vérification en cours...");
    await runDigestAndSendDM(message.author);
  } catch (err) {
    console.error(err);
    await message.channel.send(`❌ Erreur : ${err.message}`);
  }
});

client.login(DISCORD_TOKEN);
