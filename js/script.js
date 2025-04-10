// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    loadTasks();
    updateCounters();
    loadDarkModePreference();
    setInterval(updateTimeAgo, 1000); // Atualiza o tempo a cada segundo
    setInterval(checkOverdueTasks, 1000); // Verifica tarefas atrasadas a cada segundo

    // Verificar permissão para notificações
    if (typeof Notification !== "undefined") {
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }
});

// Funções de Tarefa
function addTask() {
    const taskInput = document.getElementById("taskInput");
    const taskText = taskInput.value.trim();
    const priority = document.getElementById("priority").value;

    if (taskText === "") {
        alert("Por favor, insira uma tarefa!");
        return;
    }

    const timestamp = Date.now(); // Timestamp da criação
    const task = document.createElement("div");
    task.className = `task ${priority}`;
    task.draggable = true;
    task.dataset.timestamp = timestamp; // Armazena o timestamp no elemento
    task.dataset.notified = "false"; // Flag para controlar notificações
    task.dataset.permanentlyNotified = "false"; // Novo flag para notificações permanentes
    task.innerHTML = `
        <input type="checkbox" onchange="toggleComplete(this)">
        <span>${taskText} <small class="time-ago"></small></span>
        <button onclick="removeTask(this)">Remover</button>
    `;

    task.addEventListener("dragstart", dragStart);
    task.addEventListener("dragend", dragEnd);

    document.getElementById("todo-list").appendChild(task);
    taskInput.value = "";
    saveTasks();
    updateCounters();
    updateTimeAgo(); // Atualiza o tempo imediatamente
}

function toggleComplete(checkbox) {
    const task = checkbox.parentElement;
    task.classList.toggle("completed");
    saveTasks();
    updateCounters();
}

function removeTask(element) {
    const task = element.parentElement;
    task.remove();
    saveTasks();
    updateCounters();
}

function clearTasks() {
    if (confirm("Tem certeza que deseja limpar todas as tarefas?")) {
        document.getElementById("todo-list").innerHTML = "";
        document.getElementById("in-progress-list").innerHTML = "";
        document.getElementById("done-list").innerHTML = "";
        localStorage.removeItem("tasks");
        updateCounters();
    }
}

// Função para Resetar Notificações
function resetNotifications() {
    const tasks = document.querySelectorAll(".task");
    tasks.forEach((task) => {
        // Só reseta notified se permanentlyNotified for false
        if (task.dataset.permanentlyNotified !== "true") {
            task.dataset.notified = "false";
        }
    });
    saveTasks(); // Salva o novo estado no localStorage
}

// Funções de Drag and Drop
function allowDrop(event) {
    event.preventDefault();
}

function dragStart(event) {
    event.target.classList.add("dragging");
    event.dataTransfer.setData("text/plain", event.target.id);
}

function dragEnd(event) {
    event.target.classList.remove("dragging");
    saveTasks();
    updateCounters();
}

function drop(event) {
    event.preventDefault();
    const task = document.querySelector(".dragging");
    const targetList = event.target.closest(".task-list");
    if (targetList) {
        targetList.appendChild(task);
    }
}

// Funções de Persistência (localStorage)
function saveTasks() {
    const columns = {
        "todo-list": [],
        "in-progress-list": [],
        "done-list": [],
    };

    for (const columnId in columns) {
        const tasks = document
            .getElementById(columnId)
            .getElementsByClassName("task");
        for (const task of tasks) {
            const taskText = task
                .querySelector("span")
                .childNodes[0].textContent.trim();
            const isCompleted = task.classList.contains("completed");
            const priority = task.classList.contains("low")
                ? "low"
                : task.classList.contains("medium")
                ? "medium"
                : "high";
            const timestamp = task.dataset.timestamp;
            const notified = task.dataset.notified;
            const permanentlyNotified = task.dataset.permanentlyNotified; // Salva o novo estado
            columns[columnId].push({
                text: taskText,
                completed: isCompleted,
                priority,
                timestamp,
                notified,
                permanentlyNotified,
            });
        }
    }

    localStorage.setItem("tasks", JSON.stringify(columns));
}

function loadTasks() {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
        const columns = JSON.parse(savedTasks);

        for (const columnId in columns) {
            const taskList = document.getElementById(columnId);
            columns[columnId].forEach(
                ({
                    text,
                    completed,
                    priority,
                    timestamp,
                    notified,
                    permanentlyNotified,
                }) => {
                    const task = document.createElement("div");
                    task.className = `task ${priority}`;
                    if (completed) task.classList.add("completed");
                    task.draggable = true;
                    task.dataset.timestamp = timestamp; // Restaura o timestamp
                    task.dataset.notified = notified || "false"; // Restaura o estado da notificação
                    task.dataset.permanentlyNotified =
                        permanentlyNotified || "false"; // Restaura o estado permanente
                    task.innerHTML = `
                        <input type="checkbox" onchange="toggleComplete(this)" ${
                            completed ? "checked" : ""
                        }>
                        <span>${text} <small class="time-ago"></small></span>
                        <button onclick="removeTask(this)">Remover</button>
                    `;
                    task.addEventListener("dragstart", dragStart);
                    task.addEventListener("dragend", dragEnd);
                    taskList.appendChild(task);
                }
            );
        }
    }
    updateTimeAgo(); // Atualiza o tempo ao carregar
}

// Função para Calcular e Atualizar o Tempo Relativo
function updateTimeAgo() {
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

// Função para Verificar Tarefas Atrasadas e Enviar Notificações
function checkOverdueTasks() {
    const tasks = document.querySelectorAll(".task");
    tasks.forEach((task) => {
        const timestamp = parseInt(task.dataset.timestamp);
        const isCompleted = task.classList.contains("completed");
        const alreadyNotified = task.dataset.notified === "true";
        const permanentlyNotified = task.dataset.permanentlyNotified === "true";

        if (
            !isCompleted &&
            !alreadyNotified &&
            !permanentlyNotified &&
            timestamp
        ) {
            const diff = Date.now() - timestamp;
            const secondsElapsed = Math.floor(diff / 1000);

            // Notificar após 30 minutos
            const overdueThreshold = 30 * 60; // 30 minutos (em segundos)

            if (secondsElapsed >= overdueThreshold) {
                const taskText = task
                    .querySelector("span")
                    .childNodes[0].textContent.trim();
                sendNotification(taskText);
                task.dataset.notified = "true"; // Marca como notificado
                saveTasks(); // Salva o estado da notificação
            }
        }
    });
}

// Função para Enviar Notificação
function sendNotification(taskText) {
    try {
        // 1. Enviar notificação nativa (se disponível)
        if (
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
        ) {
            const notification = new Notification("Tarefa Atrasada", {
                body: `A tarefa "${taskText}" está incompleta há mais de 30 minutos!`,
            });

            notification.onclick = () => {
                // Ação ao clicar na notificação (pode ser personalizada)
            };
        }

        // 2. Enviar evento ao main process para exibir o popup e esperar resposta
        const { ipcRenderer } = require("electron");
        ipcRenderer.send("show-overdue-popup", taskText);

        // 3. Tocar o som de notificação
        const notificationSound = document.getElementById("notificationSound");
        if (notificationSound) {
            notificationSound.currentTime = 0; // Reinicia o áudio
            notificationSound.play();
        }

        // 4. Escutar a resposta do popup
        ipcRenderer.on(
            "popup-response",
            (event, { taskText: responseTaskText, ignored }) => {
                if (responseTaskText === taskText && ignored) {
                    // Se o usuário clicou em "Ignorar", marcar a tarefa como permanentemente notificada
                    const tasks = document.querySelectorAll(".task");
                    const task = Array.from(tasks).find(
                        (t) =>
                            t
                                .querySelector("span")
                                .childNodes[0].textContent.trim() === taskText
                    );
                    if (task) {
                        task.dataset.permanentlyNotified = "true";
                        saveTasks(); // Salva o estado
                    }
                }
            }
        );
    } catch (error) {
        // Erro tratado silenciosamente
    }
}

// Funções de Interface
function updateCounters() {
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

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    const isDarkMode = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", isDarkMode);
    // Atualizar o texto e os ícones do botão
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

function loadDarkModePreference() {
    const isDarkMode = localStorage.getItem("darkMode") === "true";
    if (isDarkMode) {
        document.body.classList.add("dark-mode");
    }
    // Definir o texto e os ícones iniciais do botão
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

// Evento de Adicionar Tarefa com Enter
document.getElementById("taskInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        addTask();
    }
});
