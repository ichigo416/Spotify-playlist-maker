import {
  getTopItems,
  searchTracks,
  searchArtist,
  getArtistTopTracks,
} from "./spotifyService.js";

// "Formative years" — the reminiscence-bump age range research points to for
// lifelong music taste, applied to the user's birth year.
const FORMATIVE_AGE_START = 13;
const FORMATIVE_AGE_END = 19;

const MAX_FAVORITE_ARTISTS = 5;
const MAX_GENRES_FOR_SEARCH = 4;
const MAX_MOODS_FOR_SEARCH = 3;

// Since audio-features (valence/energy) isn't available to new apps anymore,
// moods are approximated with search keywords instead of numeric filtering.
const MOOD_KEYWORDS = {
  happy: "feel good happy",
  calm: "chill calm acoustic",
  energetic: "energetic workout",
  focused: "focus instrumental",
  nostalgic: "throwback classic",
  romantic: "love songs romantic",
  sad: "sad heartbreak",
};

// Explicit favorite artists are the strongest signal, era/genre relevance is
// medium, mood keywords are the weakest (loosest match) — used to rank ties.
const SCORE_WEIGHTS = {
  favoriteArtist: 3,
  era: 2,
  mood: 1,
};

function getFormativeYearRange(birthYear) {
  const currentYear = new Date().getFullYear();
  const start = birthYear + FORMATIVE_AGE_START;
  const end = Math.min(birthYear + FORMATIVE_AGE_END, currentYear);

  return { start: Math.min(start, end), end };
}

function formatTrack(track, reason) {
  return {
    spotifyId: track.id,
    name: track.name,
    artistNames: track.artists?.map((artist) => artist.name) ?? [],
    albumName: track.album?.name ?? "",
    imageUrl: track.album?.images?.[0]?.url ?? null,
    releaseYear: track.album?.release_date
      ? Number(track.album.release_date.slice(0, 4))
      : null,
    reason,
  };
}

function addCandidate(candidates, track, reason, weight) {
  if (!track?.id) {
    return;
  }

  const existing = candidates.get(track.id);

  if (existing) {
    existing.score += weight;
    return;
  }

  candidates.set(track.id, { track: formatTrack(track, reason), score: weight });
}

// Pulls genres from the user's actual top artists on Spotify — this is the
// "what the user might like" signal coming from real behavior, not just the
// genres they typed into the profile form.
async function getInferredGenres(accessToken) {
  try {
    const topArtists = await getTopItems(accessToken, "artists", {
      timeRange: "medium_term",
      limit: 10,
    });

    const genreCounts = new Map();

    for (const artist of topArtists) {
      for (const genre of artist.genres ?? []) {
        genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
      }
    }

    return [...genreCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);
  } catch {
    // Brand-new accounts with no listening history yet will fail this —
    // that's fine, we just fall back to the genres they typed in manually.
    return [];
  }
}

async function addFavoriteArtistTracks(accessToken, profile, candidates) {
  const artists = profile.favoriteArtists.slice(0, MAX_FAVORITE_ARTISTS);

  for (const artistName of artists) {
    try {
      const artist = await searchArtist(accessToken, artistName);

      if (!artist) {
        continue;
      }

      const tracks = await getArtistTopTracks(accessToken, artist.id);

      for (const track of tracks) {
        addCandidate(
          candidates,
          track,
          `Because you like ${artist.name}`,
          SCORE_WEIGHTS.favoriteArtist,
        );
      }
    } catch {
      // Couldn't find that artist or load their tracks — skip, not fatal.
      continue;
    }
  }
}

async function addEraAndGenreTracks(accessToken, profile, genres, candidates) {
  const { start, end } = getFormativeYearRange(profile.birthYear);
  const searchGenres = genres.slice(0, MAX_GENRES_FOR_SEARCH);
  const genresToUse = searchGenres.length > 0 ? searchGenres : [null];

  for (const genre of genresToUse) {
    const query = genre ? `genre:"${genre}" year:${start}-${end}` : `year:${start}-${end}`;

    try {
      const tracks = await searchTracks(accessToken, query, 10);

      for (const track of tracks) {
        addCandidate(
          candidates,
          track,
          genre
            ? `Popular ${genre} from ${start}–${end}, your formative years`
            : `Popular from ${start}–${end}, your formative years`,
          SCORE_WEIGHTS.era,
        );
      }
    } catch {
      continue;
    }
  }
}

async function addMoodTracks(accessToken, profile, genres, candidates) {
  const moods = profile.moods.slice(0, MAX_MOODS_FOR_SEARCH);
  const primaryGenre = genres[0];

  for (const mood of moods) {
    const keywords = MOOD_KEYWORDS[mood];

    if (!keywords) {
      continue;
    }

    const query = primaryGenre ? `${keywords} genre:"${primaryGenre}"` : keywords;

    try {
      const tracks = await searchTracks(accessToken, query, 8);

      for (const track of tracks) {
        addCandidate(candidates, track, `Matches your ${mood} mood`, SCORE_WEIGHTS.mood);
      }
    } catch {
      continue;
    }
  }
}

export async function generateRecommendations(accessToken, profile, limit = 30) {
  const candidates = new Map();

  const inferredGenres = await getInferredGenres(accessToken);
  const combinedGenres = [...new Set([...profile.genres, ...inferredGenres])];

  await addFavoriteArtistTracks(accessToken, profile, candidates);
  await addEraAndGenreTracks(accessToken, profile, combinedGenres, candidates);
  await addMoodTracks(accessToken, profile, combinedGenres, candidates);

  return [...candidates.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.track);
} 