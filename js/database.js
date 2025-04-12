import sqlite3 from "sqlite3";
import { dirname } from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

// Obter o diretório atual
const __dirname = dirname(fileURLToPath(import.meta.url));

// Inicializar o banco de dados
const db = new sqlite3.Database(`${__dirname}/../database.db`, (err) => {
    if (err) {
        console.error(
            "database.js: Erro ao conectar ao banco de dados:",
            err.message
        );
    } else {
        console.log("database.js: Conectado ao banco de dados SQLite.");
    }
});

// Criar tabelas
db.serialize(() => {
    // Tabela de usuários
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    `);

    // Tabela de tarefas
    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            completed INTEGER NOT NULL,
            priority TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            notified INTEGER NOT NULL,
            permanentlyNotified INTEGER NOT NULL,
            column TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);
});

// Funções de Usuários
export async function createUser(email, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO users (email, password) VALUES (?, ?)",
            [email, hashedPassword],
            function (err) {
                if (err) {
                    console.error("database.js: Erro ao criar usuário:", err);
                    reject(err);
                } else {
                    console.log(
                        "database.js: Usuário criado com ID:",
                        this.lastID
                    );
                    resolve(this.lastID);
                }
            }
        );
    });
}

export async function findUserByEmail(email) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
            if (err) {
                console.error("database.js: Erro ao buscar usuário:", err);
                reject(err);
            } else if (!row) {
                console.log(
                    "database.js: Usuário não encontrado para email:",
                    email
                );
                resolve(null);
            } else {
                console.log("database.js: Usuário encontrado:", row.email);
                resolve({
                    id: row.id,
                    email: row.email,
                    password: row.password,
                    comparePassword: async (password) => {
                        const match = await bcrypt.compare(
                            password,
                            row.password
                        );
                        console.log(
                            "database.js: Comparação de senha para",
                            email,
                            ":",
                            match
                        );
                        return match;
                    },
                });
            }
        });
    });
}

// Funções de Tarefas
export async function saveTasks(userId, tasks) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM tasks WHERE user_id = ?", [userId], (err) => {
            if (err) {
                console.error("database.js: Erro ao deletar tarefas:", err);
                reject(err);
                return;
            }

            const stmt = db.prepare(`
                INSERT INTO tasks (user_id, text, completed, priority, timestamp, notified, permanentlyNotified, column)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            let completedCount = 0;
            const totalTasks = Object.values(tasks).flat().length;

            for (const columnId in tasks) {
                for (const task of tasks[columnId]) {
                    stmt.run(
                        [
                            userId,
                            task.text,
                            task.completed ? 1 : 0,
                            task.priority,
                            task.timestamp,
                            task.notified === "true" ? 1 : 0,
                            task.permanentlyNotified === "true" ? 1 : 0,
                            columnId,
                        ],
                        (err) => {
                            if (err) {
                                console.error(
                                    "database.js: Erro ao salvar tarefa:",
                                    err
                                );
                                reject(err);
                            } else {
                                completedCount++;
                                if (completedCount === totalTasks) {
                                    stmt.finalize();
                                    console.log(
                                        "database.js: Tarefas salvas para userId:",
                                        userId
                                    );
                                    resolve();
                                }
                            }
                        }
                    );
                }
            }

            if (totalTasks === 0) {
                stmt.finalize();
                console.log(
                    "database.js: Nenhuma tarefa para salvar para userId:",
                    userId
                );
                resolve();
            }
        });
    });
}

export async function loadTasks(userId) {
    return new Promise((resolve, reject) => {
        db.all(
            "SELECT * FROM tasks WHERE user_id = ?",
            [userId],
            (err, rows) => {
                if (err) {
                    console.error(
                        "database.js: Erro ao carregar tarefas:",
                        err
                    );
                    reject(err);
                    return;
                }

                const tasks = {
                    "todo-list": [],
                    "in-progress-list": [],
                    "done-list": [],
                };

                rows.forEach((row) => {
                    tasks[row.column].push({
                        text: row.text,
                        completed: row.completed === 1,
                        priority: row.priority,
                        timestamp: row.timestamp,
                        notified: row.notified === 1 ? "true" : "false",
                        permanentlyNotified:
                            row.permanentlyNotified === 1 ? "true" : "false",
                    });
                });

                console.log(
                    "database.js: Tarefas carregadas para userId:",
                    userId,
                    tasks
                );
                resolve(tasks);
            }
        );
    });
}

export function closeDatabase() {
    db.close((err) => {
        if (err) {
            console.error(
                "database.js: Erro ao fechar o banco de dados:",
                err.message
            );
        } else {
            console.log("database.js: Banco de dados fechado.");
        }
    });
}
