const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API Routes ---

// Get all tasks
app.get('/api/tasks', (req, res) => {
    const sql = "SELECT * FROM tasks ORDER BY is_important DESC, created_at DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// Create a new task
app.post('/api/tasks', (req, res) => {
    const { content, due_date } = req.body;
    const created_at = new Date().toISOString();
    const sql = 'INSERT INTO tasks (content, created_at, due_date) VALUES (?, ?, ?)';
    const params = [content, created_at, due_date || null];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        res.json({
            "message": "success",
            "data": {
                id: this.lastID,
                content,
                created_at,
                due_date: due_date || null,
                status: 'pending',
                is_important: 0
            }
        });
    });
});

// Update task (mark as done or important)
app.patch('/api/tasks/:id', (req, res) => {
    const { status, is_important } = req.body;
    const { id } = req.params;

    let sql = 'UPDATE tasks SET ';
    const params = [];
    const updates = [];

    if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
    }

    if (is_important !== undefined) {
        updates.push('is_important = ?');
        params.push(is_important);
    }

    if (req.body.content !== undefined) {
        updates.push('content = ?');
        params.push(req.body.content);
    }

    if (req.body.due_date !== undefined) {
        updates.push('due_date = ?');
        params.push(req.body.due_date);
    }

    if (updates.length === 0) {
        return res.status(400).json({ "error": "No fields to update" });
    }

    sql += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        res.json({
            "message": "success",
            "changes": this.changes
        });
    });
});

// Delete a task
app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM tasks WHERE id = ?', id, function (err) {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        res.json({ "message": "deleted", "changes": this.changes });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
