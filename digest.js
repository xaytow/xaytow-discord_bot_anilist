const DAY_MS = 24 * 60 * 60 * 1000;

function titleOf(media) {
  return media.title.english || media.title.romaji;
}

/**
 * Parmi les animes "en cours" (CURRENT), renvoie ceux dont le prochain épisode
 * sort dans les `windowDays` prochains jours.
 */
function upcomingEpisodes(currentEntries, windowDays) {
  const now = Date.now();
  const limit = now + windowDays * DAY_MS;

  return currentEntries
    .map((entry) => entry.media)
    .filter((media) => media.nextAiringEpisode)
    .filter((media) => {
      const airingAt = media.nextAiringEpisode.airingAt * 1000;
      return airingAt >= now && airingAt <= limit;
    })
    .map((media) => ({
      title: titleOf(media),
      episode: media.nextAiringEpisode.episode,
      airingAt: media.nextAiringEpisode.airingAt * 1000,
      url: media.siteUrl,
    }))
    .sort((a, b) => a.airingAt - b.airingAt);
}

/**
 * Parmi les animes "terminés" ou "en pause" par l'utilisateur, cherche les suites
 * (SEQUEL) qui sont annoncées, pas encore sorties, ou déjà en diffusion.
 */
function upcomingSequels(completedEntries, pausedEntries) {
  const seen = new Set();
  const results = [];

  for (const entry of [...completedEntries, ...pausedEntries]) {
    const media = entry.media;
    const edges = media.relations?.edges ?? [];
    for (const edge of edges) {
      if (edge.relationType !== "SEQUEL") continue;
      const seq = edge.node;
      if (seq.format && !["TV", "TV_SHORT", "MOVIE", "ONA"].includes(seq.format)) continue;
      if (seen.has(seq.id)) continue;

      // On ne remonte que les suites pas encore terminées par l'utilisateur :
      // annoncées (NOT_YET_RELEASED) ou en cours de diffusion (RELEASING).
      if (seq.status !== "NOT_YET_RELEASED" && seq.status !== "RELEASING") continue;

      seen.add(seq.id);
      results.push({
        fromTitle: titleOf(media),
        title: titleOf(seq),
        status: seq.status,
        startDate: seq.startDate,
        nextEpisode: seq.nextAiringEpisode
          ? {
              episode: seq.nextAiringEpisode.episode,
              airingAt: seq.nextAiringEpisode.airingAt * 1000,
            }
          : null,
        url: seq.siteUrl,
      });
    }
  }

  return results;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatStartDate(startDate) {
  if (!startDate || !startDate.year) return "date inconnue";
  const parts = [startDate.day, startDate.month, startDate.year].filter(Boolean);
  if (parts.length < 3) return `${startDate.year}`;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(startDate.year, startDate.month - 1, startDate.day)
  );
}

/**
 * Construit le texte du digest à poster sur Discord.
 */
export function buildDigest({ current, completed, paused }, windowDays = 1) {
  const episodes = upcomingEpisodes(current, windowDays);
  const sequels = upcomingSequels(completed, paused);

  const lines = [];

  if (episodes.length === 0 && sequels.length === 0) {
    return null; // rien à signaler
  }

  if (episodes.length > 0) {
    lines.push("**📺 Épisodes à venir**");
    for (const ep of episodes) {
      const date = formatDate(new Date(ep.airingAt));
      lines.push(`• **${ep.title}** — épisode ${ep.episode} (${date})`);
    }
  }

  if (sequels.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("**🆕 Nouvelles saisons / suites**");
    for (const s of sequels) {
      if (s.status === "NOT_YET_RELEASED") {
        lines.push(`• **${s.title}** (suite de *${s.fromTitle}*) — annoncée pour ${formatStartDate(s.startDate)}`);
      } else if (s.nextEpisode) {
        const date = formatDate(new Date(s.nextEpisode.airingAt));
        lines.push(
          `• **${s.title}** (suite de *${s.fromTitle}*) — déjà en diffusion, épisode ${s.nextEpisode.episode} le ${date}`
        );
      } else {
        lines.push(`• **${s.title}** (suite de *${s.fromTitle}*) — en cours de diffusion`);
      }
    }
  }

  return lines.join("\n");
}
