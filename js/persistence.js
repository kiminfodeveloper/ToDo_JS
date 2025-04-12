let toggleComplete, dragStart, dragEnd, updateTimeAgo, userId;

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

export function setUserId(id) {
    userId = id;
}

export async function saveTasks() {
    if (!userId) {
        console.error("Erro ao salvar tarefas: userId não fornecido");
        return;
    }

    const tasks = {
        "todo-list": [],
        "in-progress-list": [],
        "done-list": [],
    };

    // Coletar tarefas de cada coluna
    document.querySelectorAll(".task-list").forEach((list) => {
        const columnId = list.id;
        list.querySelectorAll(".task").forEach((taskElement) => {
            tasks[columnId].push({
                text: taskElement
                    .querySelector("span")
                    .textContent.replace(/\s*\([^)]*\)\s*$/, ""),
                completed: taskElement.querySelector("input[type='checkbox']")
                    .checked,
                priority: taskElement.className
                    .split(" ")
                    .find((c) => ["low", "medium", "high"].includes(c)),
                timestamp: parseInt(taskElement.dataset.timestamp),
                notified: taskElement.dataset.notified,
                permanentlyNotified: taskElement.dataset.permanentlyNotified,
            });
        });
    });

    try {
        await window.api.saveTasks(userId, tasks);
        console.log("Tarefas salvas com sucesso");
    } catch (error) {
        console.error("Erro ao salvar tarefas:", error);
    }
}

export async function loadTasks() {
    if (!userId) {
        console.error("Erro ao carregar tarefas: userId não fornecido");
        return;
    }

    try {
        const tasks = await window.api.loadTasks(userId);

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
                taskElement.dataset.column = columnId;

                // Criar checkbox
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = task.completed;
                checkbox.addEventListener("change", () =>
                    toggleComplete(checkbox)
                );

                // Criar span para o texto
                const span = document.createElement("span");
                span.innerHTML = `${task.text} <small class="time-ago"></small>`;

                // Criar botão remover
                const removeBtn = document.createElement("button");
                removeBtn.textContent = "Remover";
                removeBtn.addEventListener("click", () =>
                    removeTask(removeBtn)
                );

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
    } catch (error) {
        console.error("Erro ao carregar tarefas:", error);
    }
}

async function saveTask(task) {
    if (!userId) {
        console.error("Erro ao salvar tarefa: userId não fornecido");
        return false;
    }

    try {
        task.userId = userId;
        const result = await window.api.saveTask(task);
        return result;
    } catch (error) {
        console.error("Erro ao salvar tarefa:", error);
        return false;
    }
}
