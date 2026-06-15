import { Link, NavLink } from "react-router-dom";

export default function Header() {
  return (
    <header className="header">
      <Link className="logo" to="/">
        Spotify Playlist Maker
      </Link>

      <nav className="navigation">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/profile">Profile</NavLink>
        <NavLink to="/recommendations">Recommendations</NavLink>
      </nav>
    </header>
  );
} 