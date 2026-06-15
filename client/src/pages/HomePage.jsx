import { getSpotifyLoginUrl } from "../api";

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="hero">
        <h1>Create a playlist made for your life.</h1>

        <p>
          We combine your birth year, favorite genres, artists, mood, and
          Spotify listening history to recommend songs you may love.
        </p>

        <a className="primary-button" href={getSpotifyLoginUrl()}>
          Connect with Spotify
        </a>
      </section>
    </main>
  );
} 