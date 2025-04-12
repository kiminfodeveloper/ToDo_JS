-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    dark_mode INTEGER DEFAULT 0
);

-- Tabela de tarefas
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    column_id TEXT NOT NULL,
    text TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    priority TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    notified INTEGER DEFAULT 0,
    permanently_notified INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
); 