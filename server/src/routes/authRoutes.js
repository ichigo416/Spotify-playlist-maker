import { Router } from "express";
import crypto from "crypto";
import User from "../models/User.js";
import {
  buildAuthorizeUrl,
  exchangeCodeForTokens,
  getCurrentSpotifyProfile,
} from "../services/spotifyService.js";
import { encrypt } from "../utils/encryption.js";

const router = Router();

// GET /api/auth/spotify — kicks off login by redirecting to Spotify's consent screen.
router.get("/spotify", (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  req.session.oauthState = state;
  res.redirect(buildAuthorizeUrl(state));
});

// GET /api/auth/spotify/callback — Spotify redirects here after the user approves.
router.get("/spotify/callback", async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=${error}`);
    }

    if (!state || state !== req.session.oauthState) {
      return res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=invalid_state`);
    }

    delete req.session.oauthState;

    const tokens = await exchangeCodeForTokens(code);
    const spotifyProfile = await getCurrentSpotifyProfile(tokens.access_token);

    const user = await User.findOneAndUpdate(
      { spotifyId: spotifyProfile.id },
      {
        spotifyId: spotifyProfile.id,
        displayName: spotifyProfile.display_name,
        email: spotifyProfile.email,
        profileImageUrl: spotifyProfile.images?.[0]?.url,
        accessToken: encrypt(tokens.access_token),
        refreshToken: encrypt(tokens.refresh_token),
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
      { upsert: true, new: true },
    );

    // Regenerate the session on login to prevent session fixation.
    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        return next(regenerateError);
      }

      req.session.userId = user._id;
      res.redirect(`${process.env.CLIENT_URL}/auth/callback`);
    });
  } catch (requestError) {
    next(requestError);
  }
});

// GET /api/auth/me — used by ProtectedRoute and CallbackPage on the client.
router.get("/me", async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.json({ user: null });
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.json({ user: null });
    }

    res.json({
      user: {
        id: user._id,
        displayName: user.displayName,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie("connect.sid");
    res.status(204).end();
  });
});

export default router; 