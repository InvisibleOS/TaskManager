const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Render Postgres
    }
});

// Initialize Database Table
const initDb = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            due_date TEXT,
            status TEXT DEFAULT 'pending',
            is_important INTEGER DEFAULT 0
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS notes (
            id SERIAL PRIMARY KEY,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            is_important INTEGER DEFAULT 0
        )`);
        console.log('Database initialized: tasks and notes tables ready.');
    } catch (err) {
        console.error('Error initializing database:', err.message);
    }
};

initDb();

module.exports = pool;
