let toggleComplete, dragStart, dragEnd, updateTimeAgo;

export function setToggleComplete(fn) {
    toggleComplete = fn;
}

export function setDragStart(fn) {
    dragStart = fn;
}

export function setDragEnd(fn) {
    dragEnd = fn;
}

export function setUpdateTimeAgo(fn) {
    updateTimeAgo = fn;
}

export async function saveTasks() {
    const tasks = {
        "todo-list": [],
        "in-progress-list": [],
        "done-list": [],
    };

    document.querySelectorAll(".task-list").forEach((column) => {
        const columnId = column.id;
        column.querySelectorAll(".task").forEach((task) => {
            const taskData = {
                text: task.querySelector("span").textContent.trim(),
                completed: task.querySelector("input[type='checkbox']").checked,
                priority: task.classList.contains("high")
                    ? "high"
                    : task.classList.contains("medium")
                    ? "medium"
                    : "low",
                timestamp: task.dataset.timestamp || Date.now(),
                notified: task.dataset.notified || "false",
                permanentlyNotified:
                    task.dataset.permanentlyNotified || "false",
                reminderTime: task.dataset.reminderTime || null,
            };
            tasks[columnId].push(taskData);
        });
    });

    try {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    } catch (error) {
        // Error occurred but we're suppressing logs
    }
}

export async function loadTasks() {
    try {
        const tasksJson = localStorage.getItem("tasks");
        if (tasksJson) {
            const tasks = JSON.parse(tasksJson);
            renderTasks(tasks);
        } else {
            // Se não houver tarefas salvas, inicializa com listas vazias
            renderTasks({
                "todo-list": [],
                "in-progress-list": [],
                "done-list": [],
            });
        }
    } catch (error) {
        // Error occurred but we're suppressing logs
    }
}

function renderTasks(tasks) {
    const todoList = document.getElementById("todo-list");
    const inProgressList = document.getElementById("in-progress-list");
    const doneList = document.getElementById("done-list");

    todoList.innerHTML = "";
    inProgressList.innerHTML = "";
    doneList.innerHTML = "";

    for (const columnId in tasks) {
        const targetList = document.getElementById(columnId);
        for (const task of tasks[columnId]) {
            const taskElement = document.createElement("div");
            taskElement.className = `task ${task.priority}`;
            if (task.completed) taskElement.classList.add("completed");
            taskElement.draggable = true;
            taskElement.dataset.timestamp = task.timestamp;
            taskElement.dataset.notified = task.notified || "false";
            taskElement.dataset.permanentlyNotified =
                task.permanentlyNotified || "false";
            if (task.reminderTime) {
                taskElement.dataset.reminderTime = task.reminderTime;
            }
            taskElement.dataset.column = columnId;

            // Criar checkbox
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = task.completed;
            checkbox.addEventListener("change", () => toggleComplete(checkbox));

            // Criar span para o texto com ícone de lembrete se necessário
            const span = document.createElement("span");
            let taskHTML = task.text;

            // Adicionar ícone de lembrete se a tarefa tiver notificação programada
            if (task.reminderTime) {
                const reminderDate = new Date(parseInt(task.reminderTime));
                taskHTML += ` <i class="reminder-icon" title="Lembrete: ${reminderDate.toLocaleString()}">⏰</i>`;
            }

            span.innerHTML = `${taskHTML} <small class="time-ago"></small>`;

            // Criar botão remover
            const removeBtn = document.createElement("button");
            removeBtn.textContent = "Remover";
            removeBtn.addEventListener("click", () => removeTask(removeBtn));

            // Adicionar elementos à tarefa
            taskElement.appendChild(checkbox);
            taskElement.appendChild(span);
            taskElement.appendChild(removeBtn);

            taskElement.addEventListener("dragstart", dragStart);
            taskElement.addEventListener("dragend", dragEnd);
            targetList.appendChild(taskElement);
        }
    }
    updateTimeAgo();
}
