const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'tasks.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');

        // Initialize Tasks Table
        db.run(`CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            is_important INTEGER DEFAULT 0
        )`, (err) => {
            if (err) {
                console.error('Error creating table: ' + err.message);
            } else {
                // Migration: Add due_date column if it doesn't exist
                db.run("ALTER TABLE tasks ADD COLUMN due_date TEXT", (err) => {
                    // Ignore error if column already exists (Duplicate column name)
                    if (err && !err.message.includes("duplicate column name")) {
                        console.error('Error adding due_date column: ' + err.message);
                    } else if (!err) {
                        console.log('Added due_date column to tasks table.');
                    }
                });
            }
        });
    }
});

// Initialize Notes Table
db.run(`CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            is_important INTEGER DEFAULT 0
        )`, (err) => {
    if (err) {
        console.error('Error creating notes table: ' + err.message);
    }
});
    }
});

module.exports = db;
