const ANILIST_API = "https://graphql.anilist.co";

/**
 * Envoie une requête GraphQL à AniList.
 */
async function anilistQuery(query, variables) {
  const res = await fetch(ANILIST_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur AniList (${res.status}): ${text}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`Erreur AniList: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

/**
 * Récupère la liste "En cours de visionnage" (CURRENT) et "Terminé" (COMPLETED)
 * d'un utilisateur AniList, avec les infos de diffusion et les relations
 * (suites/préquelles) de chaque anime.
 */
export async function getUserLists(username) {
  const query = `
    query ($username: String) {
      MediaListCollection(userName: $username, type: ANIME, status_in: [CURRENT, COMPLETED, PAUSED]) {
        lists {
          status
          entries {
            progress
            status
            media {
              id
              title {
                romaji
                english
              }
              status
              episodes
              nextAiringEpisode {
                airingAt
                episode
              }
              siteUrl
              relations {
                edges {
                  relationType
                  node {
                    id
                    title {
                      romaji
                      english
                    }
                    format
                    status
                    startDate {
                      year
                      month
                      day
                    }
                    nextAiringEpisode {
                      airingAt
                      episode
                    }
                    siteUrl
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await anilistQuery(query, { username });
  const lists = data.MediaListCollection.lists;

  const current = lists.find((l) => l.status === "CURRENT")?.entries ?? [];
  const completed = lists.find((l) => l.status === "COMPLETED")?.entries ?? [];
  const paused = lists.find((l) => l.status === "PAUSED")?.entries ?? [];

  return { current, completed, paused };
}
