let userId;

export function setUserId(id) {
    userId = id;
}

export function updateCounters() {
    const columns = ["todo-list", "in-progress-list", "done-list"];
    columns.forEach((columnId) => {
        const count = document
            .getElementById(columnId)
            .getElementsByClassName("task").length;
        const column = document.getElementById(columnId).parentElement;
        column.querySelector("h2").textContent = `${
            columnId === "todo-list"
                ? "A Fazer"
                : columnId === "in-progress-list"
                ? "Em Progresso"
                : "Concluído"
        } (${count})`;
    });
}

export function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    const isDarkMode = document.body.classList.contains("dark-mode");

    try {
        localStorage.setItem("darkMode", isDarkMode.toString());
        updateDarkModeUI(isDarkMode);
    } catch (error) {}
}

export function loadDarkModePreference() {
    try {
        const storedPreference = localStorage.getItem("darkMode");
        const isDarkMode = storedPreference === "true";

        if (isDarkMode) {
            document.body.classList.add("dark-mode");
        } else {
            document.body.classList.remove("dark-mode");
        }
        updateDarkModeUI(isDarkMode);
    } catch (error) {}
}

function updateDarkModeUI(isDarkMode) {
    const darkModeButton = document.querySelector(".dark-mode-toggle");
    const darkModeText = darkModeButton.querySelector(".dark-mode-text");
    const sunIcon = darkModeButton.querySelector(".sun-icon");
    const moonIcon = darkModeButton.querySelector(".moon-icon");
    darkModeText.textContent = isDarkMode
        ? "Desligar Modo Escuro"
        : "Ligar Modo Escuro";
    sunIcon.style.display = isDarkMode ? "none" : "inline";
    moonIcon.style.display = isDarkMode ? "inline" : "none";
}

export function updateTimeAgo() {
    const tasks = document.querySelectorAll(".task");
    tasks.forEach((task) => {
        const timestamp = parseInt(task.dataset.timestamp);
        const timeAgoElement = task.querySelector(".time-ago");
        if (timestamp && timeAgoElement) {
            const diff = Date.now() - timestamp;
            timeAgoElement.textContent = getRelativeTime(diff);
        }
    });
}

function getRelativeTime(diff) {
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds} seg atrás`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min atrás`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? "hora" : "horas"} atrás`;

    const days = Math.floor(hours / 24);
    return `${days} ${days === 1 ? "dia" : "dias"} atrás`;
}
