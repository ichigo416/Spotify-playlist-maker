import axios from "axios";

const SPOTIFY_ACCOUNTS_URL = "https://accounts.spotify.com";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";

// user-top-read lets us pull listening history for the recommendation engine later.
// playlist-modify-* lets us create the playlist on the user's account.
const SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-top-read",
  "playlist-modify-public",
  "playlist-modify-private",
].join(" ");

function basicAuthHeader() {
  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");

  return `Basic ${credentials}`;
}

export function buildAuthorizeUrl(state) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: SCOPES,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    state,
  });

  return `${SPOTIFY_ACCOUNTS_URL}/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code) {
  const response = await axios.post(
    `${SPOTIFY_ACCOUNTS_URL}/api/token`,
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: basicAuthHeader(),
      },
    },
  );

  return response.data; // { access_token, refresh_token, expires_in, ... }
}

export async function refreshAccessToken(refreshToken) {
  const response = await axios.post(
    `${SPOTIFY_ACCOUNTS_URL}/api/token`,
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: basicAuthHeader(),
      },
    },
  );

  return response.data; // { access_token, expires_in, ... } — refresh_token sometimes omitted
}

export async function getCurrentSpotifyProfile(accessToken) {
  const response = await axios.get(`${SPOTIFY_API_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return response.data;
}

export async function getTopItems(
  accessToken,
  type,
  { timeRange = "medium_term", limit = 10 } = {},
) {
  const response = await axios.get(`${SPOTIFY_API_URL}/me/top/${type}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { time_range: timeRange, limit },
  });

  return response.data.items;
}

export async function searchTracks(accessToken, query, limit = 10) {
  const response = await axios.get(`${SPOTIFY_API_URL}/search`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { q: query, type: "track", limit },
  });

  return response.data.tracks.items;
}

export async function searchArtist(accessToken, name) {
  const response = await axios.get(`${SPOTIFY_API_URL}/search`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { q: `artist:"${name}"`, type: "artist", limit: 1 },
  });

  return response.data.artists.items[0] ?? null;
}

export async function getArtistTopTracks(accessToken, artistId, market = "US") {
  const response = await axios.get(`${SPOTIFY_API_URL}/artists/${artistId}/top-tracks`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { market },
  });

  return response.data.tracks;
}