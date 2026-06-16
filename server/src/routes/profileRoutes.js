import { Router } from "express";
import MusicProfile, { ALLOWED_MOODS } from "../models/MusicProfile.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

const MIN_BIRTH_YEAR = 1940;
const MAX_BIRTH_YEAR = new Date().getFullYear() - 13;

function sanitizeStringList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 25); // keep it sane — no one needs 500 favorite artists saved
}

router.use(authenticate);

// GET /api/profile — returns the signed-in user's saved profile, or null if not set yet.
router.get("/", async (req, res, next) => {
  try {
    const profile = await MusicProfile.findOne({ user: req.user._id });

    res.json({ profile: profile ?? null });
  } catch (error) {
    next(error);
  }
});

// PUT /api/profile — creates or updates the signed-in user's profile.
router.put("/", async (req, res, next) => {
  try {
    const { birthYear, genres, favoriteArtists, moods } = req.body;

    const parsedBirthYear = Number(birthYear);

    if (
      !Number.isInteger(parsedBirthYear) ||
      parsedBirthYear < MIN_BIRTH_YEAR ||
      parsedBirthYear > MAX_BIRTH_YEAR
    ) {
      return res.status(400).json({
        message: `Birth year must be between ${MIN_BIRTH_YEAR} and ${MAX_BIRTH_YEAR}.`,
      });
    }

    const sanitizedMoods = Array.isArray(moods)
      ? moods.filter((mood) => ALLOWED_MOODS.includes(mood))
      : [];

    const profile = await MusicProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        birthYear: parsedBirthYear,
        genres: sanitizeStringList(genres),
        favoriteArtists: sanitizeStringList(favoriteArtists),
        moods: sanitizedMoods,
      },
      { upsert: true, new: true, runValidators: true },
    );

    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

export default router;