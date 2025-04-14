const { contextBridge, ipcRenderer } = require("electron");

// Expor APIs seguras para o renderer process
contextBridge.exposeInMainWorld("api", {
    // Funções de autenticação
    login: (email, password) => ipcRenderer.invoke("login", email, password),
    register: (email, password) =>
        ipcRenderer.invoke("register", email, password),
    logout: () => ipcRenderer.invoke("logout"),

    // Funções de tarefas
    saveTasks: (userId, tasks) =>
        ipcRenderer.invoke("save-tasks", userId, tasks),
    loadTasks: (userId) => ipcRenderer.invoke("load-tasks", userId),
    saveDarkMode: (userId, isDarkMode) =>
        ipcRenderer.invoke("save-dark-mode", userId, isDarkMode),
    loadDarkMode: (userId) => ipcRenderer.invoke("load-dark-mode", userId),

    // Eventos
    onSetUserId: (callback) => {
        ipcRenderer.on("set-user-id", (event, userId) => callback(userId));
    },
});
