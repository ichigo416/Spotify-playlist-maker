import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../api";
import TrackCard from "../components/TrackCard";

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState(null);
  const [selectedTrackIds, setSelectedTrackIds] = useState(new Set());
  const [playlistName, setPlaylistName] = useState("My Personal Playlist");
  const [isPublic, setIsPublic] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createdPlaylist, setCreatedPlaylist] = useState(null);
  const [error, setError] = useState("");
  const hasGenerated = useRef(false);

  async function generateRecommendations() {
    setIsGenerating(true);
    setCreatedPlaylist(null);
    setError("");

    try {
      const result = await apiRequest("/recommendations/generate", {
        method: "POST",
        body: JSON.stringify({ limit: 30 }),
      });

      setRecommendations(result);
      setSelectedTrackIds(
        new Set(result.tracks.map((track) => track.spotifyId)),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsGenerating(false);
    }
  }

  useEffect(() => {
    if (hasGenerated.current) {
      return;
    }

    hasGenerated.current = true;
    generateRecommendations();
  }, []);

  function toggleTrack(trackId) {
    setSelectedTrackIds((currentTrackIds) => {
      const updatedTrackIds = new Set(currentTrackIds);

      if (updatedTrackIds.has(trackId)) {
        updatedTrackIds.delete(trackId);
      } else {
        updatedTrackIds.add(trackId);
      }

      return updatedTrackIds;
    });
  }

  async function createPlaylist(event) {
    event.preventDefault();

    if (!recommendations) {
      return;
    }

    const selectedTracks = recommendations.tracks.filter((track) =>
      selectedTrackIds.has(track.spotifyId),
    );

    if (selectedTracks.length === 0) {
      setError("Select at least one track.");
      return;
    }

    setIsCreating(true);
    setCreatedPlaylist(null);
    setError("");

    try {
      const result = await apiRequest("/playlists", {
        method: "POST",
        body: JSON.stringify({
          name: playlistName,
          description: "Created with Spotify Playlist Maker",
          isPublic,
          tracks: selectedTracks,
        }),
      });

      setCreatedPlaylist(result.playlist);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="page">
      <h1>Your recommendations</h1>

      <p className="page-description">
        Select the tracks you like, give your playlist a name, and save it
        directly to Spotify.
      </p>

      <button
        className="secondary-button"
        type="button"
        onClick={generateRecommendations}
        disabled={isGenerating}
      >
        {isGenerating ? "Generating..." : "Generate again"}
      </button>

      {error ? <p className="error-message">{error}</p> : null}

      {recommendations ? (
        <>
          <form className="profile-form" onSubmit={createPlaylist}>
            <label>
              Playlist name
              <input
                type="text"
                value={playlistName}
                maxLength="100"
                onChange={(event) => setPlaylistName(event.target.value)}
                required
              />
            </label>

            <label>
              <span>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(event) => setIsPublic(event.target.checked)}
                />{" "}
                Make this playlist public
              </span>
            </label>

            <button
              className="primary-button"
              type="submit"
              disabled={isCreating || selectedTrackIds.size === 0}
            >
              {isCreating
                ? "Creating playlist..."
                : `Create playlist with ${selectedTrackIds.size} tracks`}
            </button>
          </form>

          {createdPlaylist ? (
            <p className="success-message">
              Playlist created successfully.{" "}
              <a
                href={createdPlaylist.externalUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open it in Spotify
              </a>
            </p>
          ) : null}

          <section className="track-list">
            {recommendations.tracks.map((track) => (
              <TrackCard
                key={track.spotifyId}
                track={track}
                isSelected={selectedTrackIds.has(track.spotifyId)}
                onToggle={toggleTrack}
              />
            ))}
          </section>
        </>
      ) : null}
    </main>
  );
} 