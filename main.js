const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        title: "ToDo List App",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        icon: path.join(__dirname, 'public', 'icon.png')
    });

    // Load the local server URL
    mainWindow.loadURL('http://localhost:3000');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

function startServer() {
    // Fork the existing server.js
    serverProcess = fork(path.join(__dirname, 'server.js'), [], {
        silent: false, // Pipe stdout/stderr to parent
        cwd: __dirname
    });

    console.log(`Server started with PID: ${serverProcess.pid}`);

    serverProcess.on('error', (err) => {
        console.error('Failed to start server process:', err);
    });
}

app.whenReady().then(() => {
    startServer();

    // Give server a moment to start listening
    setTimeout(createWindow, 2000);

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
    if (serverProcess) {
        console.log('Killing server process...');
        serverProcess.kill();
    }
});
