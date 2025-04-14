const sqlite3 = require("sqlite3");
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
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        process.exit(1); // Encerrar o aplicativo em caso de erro crítico
    } else {
        // Se banco de dados foi recém-criado, inicialize as tabelas
        initDatabase();
    }
});

// Função para inicializar o banco de dados
function initDatabase() {
    db.serialize(() => {
        // Tabela de usuários
        db.run(
            `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                dark_mode INTEGER DEFAULT 0
            )
        `,
            (err) => {
                // Se o banco de dados foi recém-criado, crie um usuário de teste
                if (!dbExists && !err) {
                    bcrypt.hash("teste123", 10, (err, hash) => {
                        if (!err) {
                            db.run(
                                "INSERT OR IGNORE INTO users (email, password) VALUES (?, ?)",
                                ["teste@teste.com", hash]
                            );
                        }
                    });
                }
            }
        );

        // Tabela de tarefas
        db.run(
            `
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
        `
        );
    });
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

        return new Promise((resolve, reject) => {
            db.run(
                "INSERT INTO users (email, password) VALUES (?, ?)",
                [email, hashedPassword],
                function (err) {
                    if (err) {
                        if (err.code === "SQLITE_CONSTRAINT") {
                            resolve({
                                success: false,
                                error: "Este email já está cadastrado.",
                            });
                        } else {
                            resolve({
                                success: false,
                                error: "Erro ao criar usuário.",
                            });
                        }
                    } else {
                        resolve({ success: true, userId: this.lastID });
                    }
                }
            );
        });
    } catch (err) {
        return { success: false, error: "Erro ao criar usuário." };
    }
}

async function findUserByEmail(email, password) {
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT * FROM users WHERE email = ?",
            [email],
            async (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!row) {
                    resolve({
                        success: false,
                        error: "Usuário não encontrado.",
                    });
                    return;
                }

                const match = await bcrypt.compare(password, row.password);

                if (!match) {
                    resolve({ success: false, error: "Senha incorreta." });
                    return;
                }

                resolve({ success: true, userId: row.id });
            }
        );
    });
}

// Funções para tarefas
async function saveTasks(userId, tasks) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            // Primeiro, deleta todas as tarefas do usuário
            db.run("DELETE FROM tasks WHERE user_id = ?", [userId], (err) => {
                if (err) {
                    db.run("ROLLBACK");
                    reject(err);
                    return;
                }

                // Depois, insere as novas tarefas
                const stmt = db.prepare(
                    `INSERT INTO tasks (user_id, column, text, completed, priority, timestamp, notified, permanently_notified, reminder_time)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
                );

                try {
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

                    stmt.finalize();
                    db.run("COMMIT", (err) => {
                        if (err) {
                            db.run("ROLLBACK");
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                } catch (error) {
                    stmt.finalize();
                    db.run("ROLLBACK");
                    reject(error);
                }
            });
        });
    });
}

async function loadTasks(userId) {
    return new Promise((resolve, reject) => {
        db.all(
            "SELECT * FROM tasks WHERE user_id = ? ORDER BY timestamp DESC",
            [userId],
            (err, rows) => {
                if (err) {
                    reject(err);
                } else {
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

                    resolve(tasks);
                }
            }
        );
    });
}

async function saveTask(userId, task) {
    return new Promise((resolve, reject) => {
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
            task.reminderTime || null,
            (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );

        stmt.finalize();
    });
}

// Funções para tema
async function updateUserDarkMode(userId, isDarkMode) {
    return new Promise((resolve, reject) => {
        db.run(
            "UPDATE users SET dark_mode = ? WHERE id = ?",
            [isDarkMode ? 1 : 0, userId],
            (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}

async function getUserDarkMode(userId) {
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT dark_mode FROM users WHERE id = ?",
            [userId],
            (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? row.dark_mode === 1 : false);
                }
            }
        );
    });
}

function closeDatabase() {
    db.close();
}

async function checkEmail(email) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(!!row); // Retorna true se o email existir, false caso contrário
            }
        });
    });
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
