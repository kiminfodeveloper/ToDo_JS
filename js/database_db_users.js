const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

// Inicializar o banco de dados (database.db está na mesma pasta que este arquivo)
const dbPath = path.join(__dirname, "database.db");
console.log("database_db_users.js: Caminho do banco de dados:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(
            "database_db_users.js: Erro ao conectar ao banco de dados:",
            err.message
        );
    } else {
        console.log(
            "database_db_users.js: Conectado ao banco de dados SQLite."
        );
    }
});

// Criar tabelas
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
            if (err) {
                console.error(
                    "database_db_users.js: Erro ao criar tabela users:",
                    err
                );
            } else {
                console.log(
                    "database_db_users.js: Tabela users criada/verificada com sucesso"
                );
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
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `,
        (err) => {
            if (err) {
                console.error(
                    "database_db_users.js: Erro ao criar tabela tasks:",
                    err
                );
            } else {
                console.log(
                    "database_db_users.js: Tabela tasks criada/verificada com sucesso"
                );
            }
        }
    );
});

// Funções de Usuários
async function createUser(email, password) {
    console.log(
        "database_db_users.js: Iniciando criação de usuário com email:",
        email
    );
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("database_db_users.js: Senha hash gerada com sucesso");

        return new Promise((resolve, reject) => {
            db.run(
                "INSERT INTO users (email, password) VALUES (?, ?)",
                [email, hashedPassword],
                function (err) {
                    if (err) {
                        console.error(
                            "database_db_users.js: Erro ao criar usuário:",
                            err.message,
                            "Código:",
                            err.code
                        );
                        reject(err);
                    } else {
                        console.log(
                            "database_db_users.js: Usuário criado com ID:",
                            this.lastID
                        );
                        resolve(this.lastID);
                    }
                }
            );
        });
    } catch (err) {
        console.error(
            "database_db_users.js: Erro ao gerar hash da senha:",
            err
        );
        throw err;
    }
}

async function findUserByEmail(email, password) {
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT * FROM users WHERE email = ?",
            [email],
            async (err, row) => {
                if (err) {
                    console.error(
                        "database_db_users.js: Erro ao buscar usuário:",
                        err
                    );
                    reject(err);
                    return;
                }

                if (!row) {
                    console.log(
                        "database_db_users.js: Usuário não encontrado para email:",
                        email
                    );
                    resolve({
                        success: false,
                        error: "Usuário não encontrado.",
                    });
                    return;
                }

                console.log("database_db_users.js: Usuário encontrado:", email);
                const match = await bcrypt.compare(password, row.password);
                console.log(
                    "database_db_users.js: Comparação de senha para",
                    email,
                    ":",
                    match
                );

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
                    `INSERT INTO tasks (user_id, column, text, completed, priority, timestamp, notified, permanently_notified)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
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
                                task.permanentlyNotified === "true" ? 1 : 0
                            );
                        }
                    }

                    stmt.finalize();
                    db.run("COMMIT", (err) => {
                        if (err) {
                            console.error("Erro ao fazer commit:", err);
                            db.run("ROLLBACK");
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                } catch (error) {
                    console.error("Erro ao salvar tarefas:", error);
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
                    console.error(
                        "database_db_users.js: Erro ao carregar tarefas:",
                        err.message
                    );
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
                        };
                        tasks[row.column].push(task);
                    });

                    console.log(
                        "database_db_users.js: Tarefas carregadas para userId:",
                        userId,
                        tasks
                    );
                    resolve(tasks);
                }
            }
        );
    });
}

async function saveTask(userId, task) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT INTO tasks (user_id, column, text, completed, priority, timestamp, notified, permanently_notified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
            (err) => {
                if (err) {
                    console.error("Erro ao salvar tarefa:", err);
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
    db.close((err) => {
        if (err) {
            console.error(
                "database_db_users.js: Erro ao fechar o banco de dados:",
                err.message
            );
        } else {
            console.log("database_db_users.js: Banco de dados fechado.");
        }
    });
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
