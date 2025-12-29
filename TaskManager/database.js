const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'tasks.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Ensure table exists matching server.js usage
        db.run(`CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            created_at TEXT,
            due_date TEXT,
            status TEXT DEFAULT 'pending',
            is_important INTEGER DEFAULT 0
        )`, (err) => {
            if (err) {
                console.error("Error creating table:", err.message);
            }
        });
    }
});

module.exports = db;
