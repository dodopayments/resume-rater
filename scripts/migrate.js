const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        resume TEXT NOT NULL,
        job_description TEXT NOT NULL,
        analysis JSONB,
        paid BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("Migration complete: sessions table ready");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
