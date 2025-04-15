const { contextBridge, ipcRenderer } = require("electron");

// Expor APIs seguras para o renderer process
contextBridge.exposeInMainWorld("api", {
    // API para mostrar popup de tarefas atrasadas
    showOverduePopup: (taskText) => {
        ipcRenderer.send("show-overdue-popup", taskText);
    },

    // Receber resposta do popup
    onPopupResponse: (callback) => {
        ipcRenderer.on("popup-response", (event, response) =>
            callback(response)
        );
    },
});
