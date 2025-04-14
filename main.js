const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const dbFunctions = require("./js/database_db_users.js");

// Desabilitar integração com Node.js no renderer process
app.enableSandbox();

let mainWindow;
let splashWindow;
let loginWindow;
let currentUserId;

function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: path.join(__dirname, "preload.js"),
            webSecurity: true,
        },
    });

    splashWindow.loadFile("splash.html");
    splashWindow.center();
}

function createLoginWindow() {
    loginWindow = new BrowserWindow({
        width: 500,
        height: 400,
        frame: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: path.join(__dirname, "preload.js"),
            webSecurity: true,
        },
    });

    loginWindow.loadFile("login.html");
    loginWindow.center();
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: path.join(__dirname, "preload.js"),
            webSecurity: true,
        },
    });

    mainWindow.loadFile("index.html");

    mainWindow.webContents.on("did-finish-load", () => {
        mainWindow.webContents.send("set-user-id", currentUserId);
    });

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

app.on("ready", () => {
    createSplashWindow();

    setTimeout(() => {
        createLoginWindow();

        loginWindow.webContents.on("did-finish-load", () => {
            if (splashWindow) {
                splashWindow.close();
                splashWindow = null;
            }
            loginWindow.show();
        });
    }, 3000);
});

// Handlers para funções de usuário
ipcMain.handle("login", async (event, email, password) => {
    try {
        const user = await dbFunctions.findUserByEmail(email, password);
        if (user.success) {
            currentUserId = user.userId;
            loginWindow.close();
            createMainWindow();
            return { success: true };
        } else {
            return { success: false, error: user.error };
        }
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle("register", async (event, email, password) => {
    try {
        // Verificar se o email já existe
        const emailExists = await dbFunctions.checkEmail(email);
        if (emailExists) {
            return {
                success: false,
                error: "Este email já está cadastrado.",
            };
        }

        const result = await dbFunctions.createUser(email, password);
        if (result.success) {
            currentUserId = result.userId;
            loginWindow.close();
            createMainWindow();
            return {
                success: true,
                message: "Conta criada com sucesso!",
            };
        } else {
            return result; // Retorna o erro da função createUser
        }
    } catch (err) {
        return {
            success: false,
            error: err.message || "Erro ao registrar usuário.",
        };
    }
});

ipcMain.handle("logout", () => {
    currentUserId = null;
    if (mainWindow) {
        mainWindow.close();
    }
    createLoginWindow();
    return { success: true };
});

// Handlers para tarefas
ipcMain.handle("save-tasks", async (event, userId, tasks) => {
    try {
        await dbFunctions.saveTasks(userId, tasks);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle("load-tasks", async (event, userId) => {
    try {
        const tasks = await dbFunctions.loadTasks(userId);
        return tasks;
    } catch (error) {
        return {
            "todo-list": [],
            "in-progress-list": [],
            "done-list": [],
        };
    }
});

ipcMain.handle("save-task", async (event, userId, task) => {
    try {
        await dbFunctions.saveTask(userId, task);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Handlers para tema
ipcMain.handle("save-dark-mode", async (event, userId, isDarkMode) => {
    try {
        await dbFunctions.updateUserDarkMode(userId, isDarkMode);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle("load-dark-mode", async (event, userId) => {
    try {
        const isDarkMode = await dbFunctions.getUserDarkMode(userId);
        return isDarkMode;
    } catch (error) {
        return false;
    }
});

ipcMain.handle("check-email", async (event, email) => {
    try {
        return await dbFunctions.checkEmail(email);
    } catch (error) {
        return false;
    }
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        dbFunctions.closeDatabase();
        app.quit();
    }
});

app.on("activate", () => {
    if (mainWindow === null && loginWindow === null) {
        createLoginWindow();
    }
});

ipcMain.on("show-overdue-popup", (event, taskText) => {
    const options = {
        type: "info",
        title: "Tarefa Atrasada",
        message: `A tarefa "${taskText}" está incompleta há mais de 30 minutos!`,
        buttons: ["OK", "Ignorar"],
    };

    dialog.showMessageBox(mainWindow, options).then((response) => {
        const ignored = response.response === 1;
        event.sender.send("popup-response", { taskText, ignored });
    });
});
