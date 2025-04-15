const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");

<<<<<<< Updated upstream
function createWindow() {
    const win = new BrowserWindow({
=======
// Desabilitar integração com Node.js no renderer process
app.enableSandbox();

let mainWindow;

function createMainWindow() {
    mainWindow = new BrowserWindow({
>>>>>>> Stashed changes
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
<<<<<<< Updated upstream
    win.loadFile("index.html");
}

// Escutar evento do renderer para exibir o popup
ipcMain.on("show-overdue-popup", (event, taskText) => {
    dialog
        .showMessageBox({
            type: "warning",
            title: "Tarefa Atrasada",
            message: `A tarefa "${taskText}" está incompleta há mais de 30 minutos!`,
            buttons: ["OK", "Ignorar"],
            defaultId: 0, // Botão "OK" é o padrão
        })
        .then((response) => {
            // Enviar a resposta de volta ao renderer
            event.reply("popup-response", {
                taskText,
                ignored: response.response === 1, // true se "Ignorar" foi clicado
            });
        });
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
=======

    mainWindow.loadFile("index.html");

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

app.on("ready", () => {
    createMainWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (mainWindow === null) {
        createMainWindow();
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
>>>>>>> Stashed changes
});
