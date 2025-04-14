import { saveTasks } from "./persistence.js";

let userId;

export function setUserId(id) {
    userId = id;
}

// Esta função não é mais necessária já que estamos importando saveTasks diretamente,
// mas a mantemos por compatibilidade com o código existente
export function setSaveTasks(fn) {
    // Função mantida por compatibilidade
}

export function resetNotifications() {
    if (!userId) {
        return;
    }

    const tasks = document.querySelectorAll(".task");
    tasks.forEach((task) => {
        if (task.dataset.permanentlyNotified !== "true") {
            task.dataset.notified = "false";
        }
    });
    saveTasks();
}

export function checkOverdueTasks() {
    if (!userId) {
        return;
    }

    const now = Date.now();
    document.querySelectorAll(".task").forEach(async (task) => {
        const notified = task.dataset.notified === "true";
        const permanentlyNotified = task.dataset.permanentlyNotified === "true";
        const isCompleted = task.classList.contains("completed");
        const taskText = task
            .querySelector("span")
            .textContent.replace(/⏰.*$/, "")
            .trim();

        // Não notifica tarefas completadas ou já notificadas permanentemente
        if (isCompleted || permanentlyNotified) {
            return;
        }

        // Verifica se a tarefa tem um lembrete definido
        if (task.dataset.reminderTime) {
            const reminderTime = parseInt(task.dataset.reminderTime);

            // Verifica se o horário do lembrete já chegou
            if (!notified && now >= reminderTime) {
                // Formata o texto da notificação
                const notificationText = `A tarefa "${taskText}" precisa de atenção!`;

                // Envia notificação
                await sendNotification("Lembrete de Tarefa", notificationText);

                // Marca como notificada
                task.dataset.notified = "true";
                await saveTasks();
            }
        }
        // Verifica tarefas atrasadas sem lembrete definido (mais de 24 horas)
        else {
            const timestamp = parseInt(task.dataset.timestamp);
            if (
                !notified &&
                timestamp &&
                now - timestamp > 24 * 60 * 60 * 1000
            ) {
                // Envia notificação
                await sendNotification(
                    "Tarefa Atrasada!",
                    `A tarefa "${taskText}" está atrasada!`
                );

                // Marca como notificada
                task.dataset.notified = "true";
                await saveTasks();
            }
        }
    });
}

export async function sendNotification(title, body) {
    try {
        // Verifica se as notificações são suportadas
        if (!("Notification" in window)) {
            return;
        }

        // Verifica a permissão
        if (Notification.permission === "granted") {
            new Notification(title, { body });
        } else if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                new Notification(title, { body });
            }
        }

        // Toca o som de notificação
        try {
            // Usar Audio API para tocar o som
            const audio = new Audio("./assets/wakeup.wav");
            audio.volume = 0.7; // 70% do volume

            // Tentar reproduzir o áudio
            audio.play().catch(() => {
                // Tentar caminho alternativo em caso de erro
                const audioAlt = new Audio("../assets/wakeup.wav");
                audioAlt.play().catch(() => {
                    // Silenciar erros de áudio
                });
            });
        } catch (error) {
            // Silenciar erros de áudio
        }
    } catch (error) {
        // Silenciar erros de notificação
    }
}
