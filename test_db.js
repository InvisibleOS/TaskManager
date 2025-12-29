const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'tasks.db');
const db = new sqlite3.Database(dbPath);

const id = 29; // ID of "Debug File Test"
const date = '2025-12-08';

db.run("UPDATE tasks SET due_date = ? WHERE id = ?", [date, id], function (err) {
    if (err) {
        console.error('Error updating:', err.message);
    } else {
        console.log(`Updated task ${id} with due_date ${date}. Changes: ${this.changes}`);

        db.get("SELECT * FROM tasks WHERE id = ?", [id], (err, row) => {
            console.log('Row after update:', row);
        });
    }
});
