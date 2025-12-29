const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API Routes ---

// Get all tasks
app.get('/api/tasks', async (req, res) => {
    const sql = "SELECT * FROM tasks ORDER BY is_important DESC, created_at DESC";
    try {
        const result = await db.query(sql);
        res.json({
            "message": "success",
            "data": result.rows
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Create a new task
app.post('/api/tasks', async (req, res) => {
    const { content, due_date } = req.body;
    const created_at = new Date().toISOString();
    const sql = 'INSERT INTO tasks (content, created_at, due_date) VALUES ($1, $2, $3) RETURNING id';
    const params = [content, created_at, due_date || null];

    try {
        const result = await db.query(sql, params);
        res.json({
            "message": "success",
            "data": {
                id: result.rows[0].id,
                content,
                created_at,
                due_date: due_date || null,
                status: 'pending',
                is_important: 0
            }
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Update task (mark as done or important)
app.patch('/api/tasks/:id', async (req, res) => {
    const { status, is_important } = req.body;
    const { id } = req.params;

    let sql = 'UPDATE tasks SET ';
    const params = [];
    const updates = [];
    let paramIndex = 1;

    if (status !== undefined) {
        updates.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
    }

    if (is_important !== undefined) {
        updates.push(`is_important = $${paramIndex}`);
        params.push(is_important);
        paramIndex++;
    }

    if (req.body.content !== undefined) {
        updates.push(`content = $${paramIndex}`);
        params.push(req.body.content);
        paramIndex++;
    }

    if (req.body.due_date !== undefined) {
        updates.push(`due_date = $${paramIndex}`);
        params.push(req.body.due_date);
        paramIndex++;
    }

    if (updates.length === 0) {
        return res.status(400).json({ "error": "No fields to update" });
    }

    sql += updates.join(', ') + ` WHERE id = $${paramIndex}`;
    params.push(id);

    try {
        const result = await db.query(sql, params);
        res.json({
            "message": "success",
            "changes": result.rowCount
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM tasks WHERE id = $1', [id]);
        res.json({ "message": "deleted", "changes": result.rowCount });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
