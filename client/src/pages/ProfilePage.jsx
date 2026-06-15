import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api";
import ProfileForm from "../components/ProfileForm";

export default function ProfilePage() {
  const [profile, setProfile] = useState(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    apiRequest("/profile")
      .then(({ profile: savedProfile }) => {
        setProfile(savedProfile);
      })
      .catch((requestError) => {
        setError(requestError.message);
      });
  }, []);

  async function saveProfile(profileData) {
    setIsSaving(true);
    setError("");

    try {
      await apiRequest("/profile", {
        method: "PUT",
        body: JSON.stringify(profileData),
      });

      navigate("/recommendations");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (profile === undefined && !error) {
    return <div className="loading">Loading your music profile...</div>;
  }

  return (
    <main className="page">
      <h1>Build your music profile</h1>

      <p className="page-description">
        Tell us about your music taste. We will combine these choices with
        your Spotify listening history to generate recommendations.
      </p>

      {error ? <p className="error-message">{error}</p> : null}

      <ProfileForm
        initialProfile={profile}
        onSubmit={saveProfile}
        isSaving={isSaving}
      />
    </main>
  );
} 