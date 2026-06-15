import { useState } from "react";

const moodOptions = [
  "happy",
  "calm",
  "energetic",
  "focused",
  "nostalgic",
  "romantic",
  "sad",
];

function parseList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ProfileForm({
  initialProfile,
  onSubmit,
  isSaving,
}) {
  const [birthYear, setBirthYear] = useState(
    initialProfile?.birthYear ?? 2000,
  );

  const [genres, setGenres] = useState(
    initialProfile?.genres?.join(", ") ?? "",
  );

  const [favoriteArtists, setFavoriteArtists] = useState(
    initialProfile?.favoriteArtists?.join(", ") ?? "",
  );

  const [moods, setMoods] = useState(
    initialProfile?.moods ?? ["nostalgic"],
  );

  function toggleMood(mood) {
    setMoods((currentMoods) =>
      currentMoods.includes(mood)
        ? currentMoods.filter((item) => item !== mood)
        : [...currentMoods, mood],
    );
  }

  function handleSubmit(event) {
    event.preventDefault();

    onSubmit({
      birthYear: Number(birthYear),
      genres: parseList(genres),
      favoriteArtists: parseList(favoriteArtists),
      moods,
    });
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <label>
        Birth year
        <input
          type="number"
          min="1940"
          max={new Date().getFullYear() - 13}
          value={birthYear}
          onChange={(event) => setBirthYear(event.target.value)}
          required
        />
        <span className="field-help">
          This helps us identify your formative music years.
        </span>
      </label>

      <label>
        Favorite genres
        <input
          type="text"
          value={genres}
          onChange={(event) => setGenres(event.target.value)}
          placeholder="Pop, rock, hip-hop"
        />
        <span className="field-help">
          Separate each genre with a comma.
        </span>
      </label>

      <label>
        Favorite artists
        <input
          type="text"
          value={favoriteArtists}
          onChange={(event) => setFavoriteArtists(event.target.value)}
          placeholder="Taylor Swift, Coldplay, A.R. Rahman"
        />
        <span className="field-help">
          Separate each artist with a comma.
        </span>
      </label>

      <div>
        <p>Choose your moods</p>

        <div className="mood-list">
          {moodOptions.map((mood) => (
            <button
              key={mood}
              className={`mood-button ${
                moods.includes(mood) ? "selected" : ""
              }`}
              type="button"
              onClick={() => toggleMood(mood)}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      <button
        className="primary-button"
        type="submit"
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
} 