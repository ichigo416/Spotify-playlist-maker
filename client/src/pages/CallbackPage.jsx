import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest } from "../api";

export default function CallbackPage() {
  const [message, setMessage] = useState("Completing Spotify sign in...");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const spotifyError = searchParams.get("error");

    if (spotifyError) {
      setMessage(`Spotify sign in failed: ${spotifyError}`);
      return;
    }

    apiRequest("/auth/me")
      .then(({ user }) => {
        if (!user) {
          setMessage("Spotify sign in could not be completed.");
          return;
        }

        navigate("/profile", { replace: true });
      })
      .catch(() => {
        setMessage("Spotify sign in could not be completed.");
      });
  }, [navigate, searchParams]);

  return (
    <main className="loading">
      <p>{message}</p>
    </main>
  );
} 