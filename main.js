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

    console.log(
        "main.js: Carregando splashWindow com preload.js em",
        path.join(__dirname, "preload.js")
    );
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

    console.log(
        "main.js: Carregando loginWindow com preload.js em",
        path.join(__dirname, "preload.js")
    );
    loginWindow.loadFile("login.html");
    loginWindow.center();

    // Adicionar listener para verificar se o preload foi carregado
    loginWindow.webContents.on("did-finish-load", () => {
        loginWindow.webContents.executeJavaScript(`
            console.log('login.html: Verificando API:', window.api);
            if (!window.api) {
                console.error('login.html: API não está disponível!');
            }
        `);
    });
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

    console.log(
        "main.js: Carregando mainWindow com preload.js em",
        path.join(__dirname, "preload.js")
    );
    mainWindow.loadFile("index.html");

    mainWindow.webContents.on("did-finish-load", () => {
        console.log(
            "main.js: index.html carregado, enviando userId:",
            currentUserId
        );
        mainWindow.webContents.send("set-user-id", currentUserId);
    });

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

app.on("ready", () => {
    console.log("main.js: Aplicativo iniciado");
    createSplashWindow();

    setTimeout(() => {
        createLoginWindow();

        loginWindow.webContents.on("did-finish-load", () => {
            console.log("main.js: login.html carregado");
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
        console.log("main.js: Buscando usuário com email:", email);
        const user = await dbFunctions.findUserByEmail(email, password);
        console.log("main.js: Usuário encontrado:", email);
        console.log(
            "main.js: Comparação de senha para",
            email,
            ":",
            user.success
        );
        if (user.success) {
            currentUserId = user.userId;
            console.log("main.js: Login bem-sucedido, userId:", currentUserId);
            loginWindow.close();
            createMainWindow();
            return { success: true };
        } else {
            return { success: false, error: user.error };
        }
    } catch (err) {
        console.error("main.js: Erro ao fazer login:", err);
        return { success: false, error: err.message };
    }
});

ipcMain.handle("register", async (event, email, password) => {
    try {
        const result = await dbFunctions.createUser(email, password);
        if (result.success) {
            currentUserId = result.userId;
            console.log(
                "main.js: Registro bem-sucedido, userId:",
                currentUserId
            );
            loginWindow.close();
            createMainWindow();
        }
        return result;
    } catch (err) {
        console.error("main.js: Erro ao registrar usuário:", err);
        return { success: false, error: err.message };
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
        console.error("Erro ao salvar tarefas:", error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle("load-tasks", async (event, userId) => {
    try {
        console.log("main.js: Carregando tarefas para userId:", userId);
        const tasks = await dbFunctions.loadTasks(userId);
        console.log("main.js: Tarefas carregadas:", tasks);
        return tasks;
    } catch (error) {
        console.error("main.js: Erro ao carregar tarefas:", error);
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
        console.error("main.js: Erro ao salvar tarefa:", err);
        return { success: false, error: err.message };
    }
});

// Handlers para tema
ipcMain.handle("save-dark-mode", async (event, userId, isDarkMode) => {
    try {
        await dbFunctions.updateUserDarkMode(userId, isDarkMode);
        return { success: true };
    } catch (error) {
        console.error("Erro ao salvar tema:", error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle("load-dark-mode", async (event, userId) => {
    try {
        const isDarkMode = await dbFunctions.getUserDarkMode(userId);
        return isDarkMode;
    } catch (error) {
        console.error("Erro ao carregar tema:", error);
        return false;
    }
});

ipcMain.handle("check-email", async (event, email) => {
    try {
        return await dbFunctions.checkEmail(email);
    } catch (error) {
        console.error("Erro ao verificar email:", error);
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
