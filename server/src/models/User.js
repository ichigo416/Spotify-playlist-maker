import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    spotifyId: { type: String, required: true, unique: true },
    displayName: { type: String },
    email: { type: String },
    profileImageUrl: { type: String },
    // Encrypted with utils/encryption.js before being saved — never store raw tokens.
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    tokenExpiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema); 