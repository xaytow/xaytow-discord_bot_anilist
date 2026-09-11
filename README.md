# Bot Discord AniList — planning d'épisodes et de nouvelles saisons

Ce bot regarde ta liste AniList et t'envoie chaque jour **en message privé** :
- les épisodes qui sortent aujourd'hui pour les animes que tu es en train de regarder,
- les suites/nouvelles saisons annoncées ou déjà diffusées pour les animes que tu as terminés (ou mis en pause).

Tu peux aussi envoyer `!anime` en MP au bot pour déclencher une vérification à la demande.

## 1. Créer l'application Discord (le "bot")

1. Va sur https://discord.com/developers/applications et clique sur **New Application**. Donne-lui un nom (ex: "AniList Tracker").
2. Dans le menu de gauche, clique sur **Bot**, puis **Reset Token** (ou **Add Bot** si demandé) et copie le token. **Garde-le secret**, ne le partage jamais.
3. Toujours dans l'onglet Bot, dans "Privileged Gateway Intents", active **Message Content Intent** (nécessaire pour lire la commande `!anime`).
4. Va dans **OAuth2 > URL Generator** :
   - Coche `bot` dans "Scopes".
   - Coche `Send Messages` dans "Bot Permissions".
   - Copie l'URL générée en bas, colle-la dans ton navigateur, et invite le bot **sur un serveur Discord dont tu fais partie** (même un petit serveur perso créé juste pour ça — c'est nécessaire pour que le bot et toi soyez "en contact" et qu'il puisse t'écrire en MP).

## 2. Récupérer ton ID Discord

1. Dans Discord, va dans **Réglages utilisateur > Avancés** et active **Mode développeur**.
2. Clic droit sur **ton propre profil/pseudo** > **Copier l'identifiant utilisateur**.

## 3. Installer et configurer le bot

Prérequis : [Node.js](https://nodejs.org/) (version 18 ou plus).

```bash
cd anilist-discord-bot
npm install
cp .env.example .env
```

Ouvre le fichier `.env` et remplis :
- `DISCORD_TOKEN` : le token copié à l'étape 1.
- `DISCORD_USER_ID` : l'ID copié à l'étape 2.
- `ANILIST_USERNAME` : ton pseudo AniList.

## 4. Lancer le bot

```bash
npm start
```

Si tout est bon, tu verras `✅ Connecté en tant que ...` dans le terminal, et le bot t'enverra un premier message en MP au démarrage du planning. Il t'écrira automatiquement chaque jour à 9h (modifiable via `CRON_SCHEDULE` dans `.env`), et tu peux lui envoyer `!anime` en MP pour tester tout de suite.

**Important** : Discord n'autorise un bot à t'écrire en MP que si vous êtes sur un serveur en commun (voir étape 1) et si tu n'as pas désactivé les MP venant des membres de ce serveur (Réglages du serveur > Confidentialité).

## 5. Le faire tourner en continu (hébergement)

Le bot doit rester allumé pour fonctionner. Plusieurs options, du plus simple au plus robuste :

- **Ton PC** : simple pour tester, mais le bot s'arrête si tu éteins ta machine ou fermes le terminal.
- **Un hébergeur gratuit/petit prix** (le plus simple pour ne pas y penser) : [Railway](https://railway.app) ou [Render](https://render.com) permettent de déployer un petit bot Node.js gratuitement ou pour quelques euros/mois. Tu connectes ton dépôt GitHub, tu ajoutes les mêmes variables que dans `.env` dans leur interface, et c'est lancé.
- **Un Raspberry Pi ou vieux PC toujours allumé à la maison**, avec `pm2` pour redémarrer le bot automatiquement en cas de crash (`npm install -g pm2` puis `pm2 start index.js`).

Si tu veux, je peux te détailler pas à pas le déploiement sur Railway (c'est l'option la plus simple pour un premier bot).

## Notes

- L'API AniList est gratuite et ne nécessite pas de clé.
- Ta liste doit être publique sur AniList pour que le bot puisse la lire (c'est le cas par défaut).
- Le digest ne poste rien si aucun épisode ne sort dans les 24h et qu'aucune suite n'est à signaler.
