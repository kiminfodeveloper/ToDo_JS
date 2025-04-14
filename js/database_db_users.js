const Database = require("better-sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const fs = require("fs");

// Inicializar o banco de dados
const dbPath = path.join(__dirname, "database.db");

// Verificar se o diretório existe
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Registrar estado do banco de dados
const dbExists = fs.existsSync(dbPath);

// Conectar ao banco de dados (criar se não existir)
let db;
try {
    db = new Database(dbPath);

    // Se banco de dados foi recém-criado, inicialize as tabelas
    initDatabase();
} catch (err) {
    process.exit(1); // Encerrar o aplicativo em caso de erro crítico
}

// Função para inicializar o banco de dados
function initDatabase() {
    // Tabela de usuários
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            dark_mode INTEGER DEFAULT 0
        )
    `);

    // Se o banco de dados foi recém-criado, crie um usuário de teste
    if (!dbExists) {
        const hash = bcrypt.hashSync("teste123", 10);
        try {
            db.prepare(
                "INSERT OR IGNORE INTO users (email, password) VALUES (?, ?)"
            ).run("teste@teste.com", hash);
        } catch (e) {
            // Ignora erro se já existir
        }
    }

    // Tabela de tarefas
    db.exec(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            column TEXT NOT NULL,
            text TEXT NOT NULL,
            completed INTEGER DEFAULT 0,
            priority TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            notified INTEGER DEFAULT 0,
            permanently_notified INTEGER DEFAULT 0,
            reminder_time INTEGER DEFAULT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);
}

// Funções de Usuários
async function createUser(email, password) {
    // Primeiro, verificar se o email já existe
    try {
        const emailExists = await checkEmail(email);
        if (emailExists) {
            return { success: false, error: "Este email já está cadastrado." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const stmt = db.prepare(
                "INSERT INTO users (email, password) VALUES (?, ?)"
            );
            const info = stmt.run(email, hashedPassword);
            return { success: true, userId: info.lastInsertRowid };
        } catch (err) {
            if (err.code === "SQLITE_CONSTRAINT") {
                return {
                    success: false,
                    error: "Este email já está cadastrado.",
                };
            } else {
                return {
                    success: false,
                    error: "Erro ao criar usuário.",
                };
            }
        }
    } catch (err) {
        return { success: false, error: "Erro ao criar usuário." };
    }
}

async function findUserByEmail(email, password) {
    try {
        const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
        const row = stmt.get(email);

        if (!row) {
            return {
                success: false,
                error: "Usuário não encontrado.",
            };
        }

        const match = await bcrypt.compare(password, row.password);

        if (!match) {
            return { success: false, error: "Senha incorreta." };
        }

        return { success: true, userId: row.id };
    } catch (err) {
        return { success: false, error: "Erro ao fazer login." };
    }
}

// Funções para tarefas
async function saveTasks(userId, tasks) {
    try {
        // Iniciar transação
        db.exec("BEGIN TRANSACTION");

        // Primeiro, deleta todas as tarefas do usuário
        db.prepare("DELETE FROM tasks WHERE user_id = ?").run(userId);

        // Depois, insere as novas tarefas
        const stmt = db.prepare(
            `INSERT INTO tasks (user_id, column, text, completed, priority, timestamp, notified, permanently_notified, reminder_time)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );

        for (const column in tasks) {
            for (const task of tasks[column]) {
                stmt.run(
                    userId,
                    column,
                    task.text,
                    task.completed ? 1 : 0,
                    task.priority,
                    task.timestamp,
                    task.notified === "true" ? 1 : 0,
                    task.permanentlyNotified === "true" ? 1 : 0,
                    task.reminderTime || null
                );
            }
        }

        // Finalizar transação
        db.exec("COMMIT");
        return true;
    } catch (error) {
        // Em caso de erro, desfaz todas as alterações
        db.exec("ROLLBACK");
        throw error;
    }
}

async function loadTasks(userId) {
    try {
        const stmt = db.prepare(
            "SELECT * FROM tasks WHERE user_id = ? ORDER BY timestamp DESC"
        );
        const rows = stmt.all(userId);

        const tasks = {
            "todo-list": [],
            "in-progress-list": [],
            "done-list": [],
        };

        rows.forEach((row) => {
            const task = {
                text: row.text,
                timestamp: row.timestamp,
                completed: row.completed === 1,
                priority: row.priority,
                notified: row.notified === 1,
                permanentlyNotified: row.permanently_notified === 1,
                reminderTime: row.reminder_time,
            };
            tasks[row.column].push(task);
        });

        return tasks;
    } catch (err) {
        throw err;
    }
}

async function saveTask(userId, task) {
    try {
        const stmt = db.prepare(`
            INSERT INTO tasks (user_id, column, text, completed, priority, timestamp, notified, permanently_notified, reminder_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            userId,
            task.column,
            task.text,
            task.completed ? 1 : 0,
            task.priority,
            task.timestamp,
            task.notified === "true" ? 1 : 0,
            task.permanentlyNotified === "true" ? 1 : 0,
            task.reminderTime || null
        );

        return true;
    } catch (err) {
        throw err;
    }
}

// Funções para tema
async function updateUserDarkMode(userId, isDarkMode) {
    try {
        const stmt = db.prepare("UPDATE users SET dark_mode = ? WHERE id = ?");
        stmt.run(isDarkMode ? 1 : 0, userId);
        return true;
    } catch (err) {
        throw err;
    }
}

async function getUserDarkMode(userId) {
    try {
        const stmt = db.prepare("SELECT dark_mode FROM users WHERE id = ?");
        const row = stmt.get(userId);
        return row ? row.dark_mode === 1 : false;
    } catch (err) {
        throw err;
    }
}

function closeDatabase() {
    if (db) {
        db.close();
    }
}

async function checkEmail(email) {
    try {
        const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
        const row = stmt.get(email);
        return !!row; // Retorna true se o email existir, false caso contrário
    } catch (err) {
        throw err;
    }
}

module.exports = {
    createUser,
    findUserByEmail,
    saveTasks,
    loadTasks,
    saveTask,
    updateUserDarkMode,
    getUserDarkMode,
    closeDatabase,
    checkEmail,
};
