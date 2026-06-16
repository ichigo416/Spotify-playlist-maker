import User from "../models/User.js";
import { refreshAccessToken } from "../services/spotifyService.js";
import { encrypt, decrypt } from "../utils/encryption.js";

export async function authenticate(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "You must be signed in." });
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(401).json({ message: "You must be signed in." });
    }

    // Spotify access tokens expire after an hour — refresh transparently if needed
    // so the rest of the app never has to think about it.
    if (user.tokenExpiresAt.getTime() <= Date.now()) {
      const refreshed = await refreshAccessToken(decrypt(user.refreshToken));

      user.accessToken = encrypt(refreshed.access_token);
      user.tokenExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

      if (refreshed.refresh_token) {
        user.refreshToken = encrypt(refreshed.refresh_token);
      }

      await user.save();
    }

    req.user = user;
    req.spotifyAccessToken = decrypt(user.accessToken);
    next();
  } catch (error) {
    next(error);
  }
} 