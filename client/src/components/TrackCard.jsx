export default function TrackCard({ track, isSelected, onToggle }) {
  return (
    <article className="track-card">
      {track.imageUrl ? (
        <img src={track.imageUrl} alt={`${track.albumName} cover`} />
      ) : (
        <div className="album-placeholder" />
      )}

      <div className="track-information">
        <h2>{track.name}</h2>

        <p>
          {track.artistNames.join(", ")}
          {track.releaseYear ? ` · ${track.releaseYear}` : ""}
        </p>

        {track.reason ? <small>{track.reason}</small> : null}
      </div>

      <button
        className={isSelected ? "primary-button" : "secondary-button"}
        type="button"
        onClick={() => onToggle(track.spotifyId)}
      >
        {isSelected ? "Selected" : "Add"}
      </button>
    </article>
  );
} 