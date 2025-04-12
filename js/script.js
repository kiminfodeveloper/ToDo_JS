import {
    addTask,
    toggleComplete,
    removeTask,
    clearTasks,
    setSaveTasks as setTasksSaveTasks,
    setUpdateCounters as setTasksUpdateCounters,
    setUpdateTimeAgo as setTasksUpdateTimeAgo,
    setDragStart as setTasksDragStart,
    setDragEnd as setTasksDragEnd,
    setUserId as setTasksUserId,
} from "./tasks.js";

import {
    allowDrop,
    dragStart,
    dragEnd,
    drop,
    setSaveTasks as setDragDropSaveTasks,
    setUpdateCounters as setDragDropUpdateCounters,
    setUserId as setDragDropUserId,
} from "./dragDrop.js";

import {
    saveTasks,
    loadTasks,
    setToggleComplete,
    setDragStart as setPersistenceDragStart,
    setDragEnd as setPersistenceDragEnd,
    setUpdateTimeAgo as setPersistenceUpdateTimeAgo,
    setUserId as setPersistenceUserId,
} from "./persistence.js";

import {
    resetNotifications,
    checkOverdueTasks,
    sendNotification,
    setSaveTasks as setNotificationsSaveTasks,
    setUserId as setNotificationsUserId,
} from "./notifications.js";

import {
    updateCounters,
    toggleDarkMode,
    loadDarkModePreference,
    updateTimeAgo,
    setUserId as setUiUserId,
} from "./ui.js";

// Configurar dependências entre módulos
setTasksSaveTasks(saveTasks);
setTasksUpdateCounters(updateCounters);
setTasksUpdateTimeAgo(updateTimeAgo);
setTasksDragStart(dragStart);
setTasksDragEnd(dragEnd);

setDragDropSaveTasks(saveTasks);
setDragDropUpdateCounters(updateCounters);

setToggleComplete(toggleComplete);
setPersistenceDragStart(dragStart);
setPersistenceDragEnd(dragEnd);
setPersistenceUpdateTimeAgo(updateTimeAgo);

setNotificationsSaveTasks(saveTasks);

// Função para fazer logout
async function logout() {
    await window.api.logout();
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    // Event listeners para os botões
    document
        .getElementById("darkModeToggle")
        .addEventListener("click", toggleDarkMode);
    document.getElementById("logoutButton").addEventListener("click", logout);
    document.getElementById("addTaskButton").addEventListener("click", addTask);
    document
        .getElementById("clearTasksButton")
        .addEventListener("click", clearTasks);
    document
        .getElementById("resetNotificationsButton")
        .addEventListener("click", resetNotifications);

    // Event listeners para drag and drop
    const columns = document.querySelectorAll(".column");
    columns.forEach((column) => {
        column.addEventListener("drop", drop);
        column.addEventListener("dragover", allowDrop);
    });

    // Configurar userId e carregar dados
    window.api.onSetUserId(async (userId) => {
        setTasksUserId(userId);
        setDragDropUserId(userId);
        setPersistenceUserId(userId);
        setNotificationsUserId(userId);
        setUiUserId(userId);

        await loadTasks();
        updateCounters();
        await loadDarkModePreference();
        setInterval(updateTimeAgo, 1000);
        setInterval(checkOverdueTasks, 1000);

        if (typeof Notification !== "undefined") {
            if (Notification.permission !== "granted") {
                Notification.requestPermission();
            }
        }
    });
});

// Evento de Adicionar Tarefa com Enter
document.getElementById("taskInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        addTask();
    }
});

// Exportar funções para uso no HTML
window.addTask = addTask;
window.toggleComplete = toggleComplete;
window.removeTask = removeTask;
window.clearTasks = clearTasks;
window.resetNotifications = resetNotifications;
window.allowDrop = allowDrop;
window.dragStart = dragStart;
window.dragEnd = dragEnd;
window.toggleDarkMode = toggleDarkMode;
window.logout = logout;
