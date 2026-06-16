import mongoose from "mongoose";

const ALLOWED_MOODS = [
  "happy",
  "calm",
  "energetic",
  "focused",
  "nostalgic",
  "romantic",
  "sad",
];

const musicProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    birthYear: { type: Number, required: true },
    genres: { type: [String], default: [] },
    favoriteArtists: { type: [String], default: [] },
    moods: {
      type: [String],
      default: [],
      validate: {
        validator: (values) => values.every((value) => ALLOWED_MOODS.includes(value)),
        message: "moods can only contain: " + ALLOWED_MOODS.join(", "),
      },
    },
  },
  { timestamps: true },
);

export { ALLOWED_MOODS };
export default mongoose.model("MusicProfile", musicProfileSchema);