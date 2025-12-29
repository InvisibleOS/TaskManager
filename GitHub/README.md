# TaskManager

A simple, locally-hosted Task Management application built with Node.js and SQLite.

## Features
- Add, edit, and delete tasks.
- Mark tasks as completed or important.
- Set due dates for tasks.
- Data persists locally in a SQLite database.

## Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.

## Installation

1.  Clone this repository or download the source code.
2.  Open a terminal in the project directory.
3.  Install dependencies:
    ```bash
    npm install
    ```

## Usage

To start the application:
```bash
npm start
```
The server will start at `http://localhost:3000`. Open this URL in your browser.

## Project Structure
- `server.js`: Main backend logic and API endpoints.
- `database.js`: SQLite database connection and schema setup.
- `public/`: Frontend assets (HTML, CSS, JS).
