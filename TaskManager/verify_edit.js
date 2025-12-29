
const http = require('http');

function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTest() {
    try {
        console.log('1. Creating Task...');
        const createRes = await request('POST', '/api/tasks', { content: 'Test Task' });
        if (createRes.message !== 'success') throw new Error('Create failed');
        const taskId = createRes.data.id;
        console.log('Task Created. ID:', taskId);

        console.log('2. Updating Task Content and Due Date...');
        const updateRes = await request('PATCH', `/api/tasks/${taskId}`, {
            content: 'Updated Task',
            due_date: '2024-12-25'
        });
        if (updateRes.message !== 'success') throw new Error('Update failed');
        console.log('Task Updated.');

        console.log('3. Verifying Update...');
        const listRes = await request('GET', '/api/tasks');
        const task = listRes.data.find(t => t.id === taskId);

        if (task.content !== 'Updated Task') throw new Error(`Content mismatch: expected "Updated Task", got "${task.content}"`);
        if (task.due_date !== '2024-12-25') throw new Error(`Due date mismatch: expected "2024-12-25", got "${task.due_date}"`);
        console.log('Verification Success: Content and Due Date match.');

        console.log('4. Cleaning up...');
        await request('DELETE', `/api/tasks/${taskId}`);
        console.log('Test Passed!');

    } catch (err) {
        console.error('Test Failed:', err);
        process.exit(1);
    }
}

runTest();
