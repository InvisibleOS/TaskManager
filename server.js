const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Helpers ---
const handleError = (res, err) => {
    console.error(err);
    res.status(400).json({ "error": err.message });
};

const buildUpdateQuery = (table, id, data, allowedFields) => {
    const updates = [];
    const params = [];
    let paramIndex = 1;

    allowedFields.forEach(field => {
        if (data[field] !== undefined) {
            updates.push(`${field} = $${paramIndex++}`);
            params.push(data[field]);
        }
    });

    if (updates.length === 0) return null;

    params.push(id);
    return {
        sql: `UPDATE ${table} SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        params
    };
};

// --- API Routes ---

const getAll = (table) => async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM ${table} ORDER BY is_important DESC, created_at DESC`);
        res.json({ "message": "success", "data": result.rows });
    } catch (err) { handleError(res, err); }
};

app.get('/api/notes', getAll('notes'));
app.get('/api/tasks', getAll('tasks'));

app.post('/api/notes', async (req, res) => {
    const { content } = req.body;
    const created_at = new Date().toISOString();
    try {
        const result = await db.query('INSERT INTO notes (content, created_at) VALUES ($1, $2) RETURNING id', [content, created_at]);
        res.json({ "message": "success", "data": { id: result.rows[0].id, content, created_at, is_important: 0 } });
    } catch (err) { handleError(res, err); }
});

app.post('/api/tasks', async (req, res) => {
    const { content, due_date } = req.body;
    const created_at = new Date().toISOString();
    try {
        const result = await db.query('INSERT INTO tasks (content, created_at, due_date) VALUES ($1, $2, $3) RETURNING id', [content, created_at, due_date || null]);
        res.json({ "message": "success", "data": { id: result.rows[0].id, content, created_at, due_date: due_date || null, status: 'pending', is_important: 0 } });
    } catch (err) { handleError(res, err); }
});

const handleUpdate = (table, allowedFields) => async (req, res) => {
    const query = buildUpdateQuery(table, req.params.id, req.body, allowedFields);
    if (!query) return res.status(400).json({ "error": "No fields to update" });

    try {
        const result = await db.query(query.sql, query.params);
        res.json({ "message": "success", "changes": result.rowCount });
    } catch (err) { handleError(res, err); }
};

app.patch('/api/notes/:id', handleUpdate('notes', ['content', 'is_important']));
app.patch('/api/tasks/:id', handleUpdate('tasks', ['content', 'is_important', 'status', 'due_date']));

const handleDelete = (table) => async (req, res) => {
    try {
        const result = await db.query(`DELETE FROM ${table} WHERE id = $1`, [req.params.id]);
        res.json({ "message": "deleted", "changes": result.rowCount });
    } catch (err) { handleError(res, err); }
};

app.delete('/api/notes/:id', handleDelete('notes'));
app.delete('/api/tasks/:id', handleDelete('tasks'));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
