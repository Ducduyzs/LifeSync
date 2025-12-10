import db from "./db.js";

export async function runMigrations() {
  try {
    console.log("Running database migrations...");

    // Add columns to users table if they don't exist
    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS height_cm numeric,
      ADD COLUMN IF NOT EXISTS weight_kg numeric,
      ADD COLUMN IF NOT EXISTS medical_conditions text;
    `);
    console.log("Users table columns added/verified");

    // Check if user_health_profile_history table exists
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_health_profile_history'
      );
    `);

    if (!tableExists[0].exists) {
      // Get user_id type from users table
      const userIdType = await db.query(`
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'user_id'
      `);

      const idType = userIdType[0]?.data_type || 'uuid';
      console.log(`user_id type in users table: ${idType}`);

      // Create user_health_profile_history table with correct type
      await db.query(`
        CREATE TABLE user_health_profile_history (
          id SERIAL PRIMARY KEY,
          user_id ${idType} NOT NULL,
          height_cm numeric,
          weight_kg numeric,
          medical_conditions text,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("user_health_profile_history table created");
    } else {
      console.log("user_health_profile_history table already exists");
    }

    // Create indexes
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_user_health_profile_history_user_id 
      ON user_health_profile_history(user_id);
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_user_health_profile_history_created_at 
      ON user_health_profile_history(created_at DESC);
    `);
    console.log("Indexes created/verified");

    console.log("All migrations completed successfully");
  } catch (err) {
    console.error("Migration error:", err.message);
    // Don't stop the server, just log the warning
  }
}
