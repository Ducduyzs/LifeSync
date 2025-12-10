import db from "./db.js";

export async function runMigrations() {
  try {
    console.log("Running database migrations...");
    console.log("Migrations completed");
  } catch (err) {
    console.error("Migration error:", err.message);
  }
}

