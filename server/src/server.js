import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const PORT = process.env.PORT || 5000;

connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  }); 