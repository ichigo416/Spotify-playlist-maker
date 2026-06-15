const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "The request could not be completed.");
  }

  return data;
}

export function getSpotifyLoginUrl() {
  return `${API_URL}/auth/spotify`;
} 