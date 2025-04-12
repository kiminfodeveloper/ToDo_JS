import { saveTasks } from "./persistence.js";

let userId;

export function setUserId(id) {
    userId = id;
}

// Esta função não é mais necessária já que estamos importando saveTasks diretamente,
// mas a mantemos por compatibilidade com o código existente
export function setSaveTasks(fn) {
    console.log(
        "notifications.js: setSaveTasks é deprecated, usando import direto"
    );
}

export function resetNotifications() {
    if (!userId) {
        console.log(
            "notifications.js: userId não definido, não é possível resetar notificações"
        );
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
        console.log(
            "notifications.js: userId não definido, pulando verificação de tarefas"
        );
        return;
    }

    const now = Date.now();
    document.querySelectorAll(".task").forEach(async (task) => {
        const timestamp = parseInt(task.dataset.timestamp);
        const notified = task.dataset.notified === "true";
        const permanentlyNotified = task.dataset.permanentlyNotified === "true";
        const taskText = task.querySelector("span").textContent;
        const isCompleted = task.classList.contains("completed");

        // Se a tarefa está atrasada (mais de 24 horas)
        if (
            !isCompleted &&
            !permanentlyNotified &&
            timestamp &&
            now - timestamp > 24 * 60 * 60 * 1000
        ) {
            if (!notified) {
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
            console.log("Este navegador não suporta notificações desktop");
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
        const audio = new Audio("./assets/wakeup.wav");
        try {
            await audio.play();
        } catch (error) {
            console.error("Erro ao tocar som:", error);
        }
    } catch (error) {
        console.error("Erro ao enviar notificação:", error);
    }
}
