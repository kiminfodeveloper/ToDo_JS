import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const db = new sqlite3.Database(`${__dirname}/database.db`, (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco de dados:", err.message);
        process.exit(1);
    }
    console.log("Conectado ao banco de dados SQLite.");
});

async function createDefaultUser() {
    const email = "admin@admin.com";
    const password = "admin123";
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
        "INSERT OR IGNORE INTO users (email, password) VALUES (?, ?)",
        [email, hashedPassword],
        (err) => {
            if (err) {
                console.error("Erro ao criar usuário padrão:", err.message);
            } else {
                console.log(
                    `Usuário padrão criado com sucesso!\nEmail: ${email}\nSenha: ${password}`
                );
            }
            db.close();
        }
    );
}

db.serialize(() => {
    db.run(
        `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    `,
        (err) => {
            if (err) {
                console.error("Erro ao criar tabela users:", err.message);
                db.close();
                process.exit(1);
            }
            createDefaultUser();
        }
    );
});
