let userId;

export function setUserId(id) {
    userId = id;
}

let saveTasks, updateCounters, updateTimeAgo, dragStart, dragEnd;

export function setSaveTasks(fn) {
    saveTasks = fn;
}

export function setUpdateCounters(fn) {
    updateCounters = fn;
}

export function setUpdateTimeAgo(fn) {
    updateTimeAgo = fn;
}

export function setDragStart(fn) {
    dragStart = fn;
}

export function setDragEnd(fn) {
    dragEnd = fn;
}

export async function addTask() {
    const taskInput = document.getElementById("taskInput");
    const taskText = taskInput.value.trim();
    const priority = document.getElementById("priority").value;
    const enableReminder = document.getElementById("enableReminder");
    const reminderInput = document.getElementById("reminderTime");
    let reminderTime = null;

    if (
        enableReminder &&
        enableReminder.checked &&
        reminderInput &&
        reminderInput.value
    ) {
        // Converter a string de data/hora para timestamp
        const reminderDate = new Date(reminderInput.value);
        reminderTime = reminderDate.getTime();

        // Validar se a data não está no passado
        if (reminderTime < Date.now()) {
            alert(
                "Não é possível definir um lembrete para uma data no passado!"
            );
            return;
        }
    }

    if (taskText === "") {
        alert("Por favor, insira uma tarefa!");
        return;
    }

    const timestamp = Date.now();
    const task = document.createElement("div");
    task.className = `task ${priority}`;
    task.draggable = true;
    task.dataset.timestamp = timestamp;
    task.dataset.notified = "false";
    task.dataset.permanentlyNotified = "false";
    if (reminderTime) {
        task.dataset.reminderTime = reminderTime;
    }
    task.dataset.column = "todo-list";

    // Criar checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = false;
    checkbox.addEventListener("change", () => toggleComplete(checkbox));

    // Criar span para o texto com ícone de lembrete se necessário
    const span = document.createElement("span");
    let taskHTML = taskText;

    // Adicionar ícone de lembrete se a tarefa tiver notificação programada
    if (reminderTime) {
        const reminderDate = new Date(reminderTime);
        taskHTML += ` <i class="reminder-icon" title="Lembrete: ${reminderDate.toLocaleString()}">⏰</i>`;
    }

    span.innerHTML = `${taskHTML} <small class="time-ago"></small>`;

    // Criar botão remover
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remover";
    removeBtn.addEventListener("click", () => removeTask(removeBtn));

    // Adicionar elementos à tarefa
    task.appendChild(checkbox);
    task.appendChild(span);
    task.appendChild(removeBtn);

    task.addEventListener("dragstart", dragStart);
    task.addEventListener("dragend", dragEnd);

    document.getElementById("todo-list").appendChild(task);
    taskInput.value = "";

    // Resetar o seletor de lembrete
    if (enableReminder) {
        enableReminder.checked = false;
        if (reminderInput) {
            reminderInput.disabled = true;
            reminderInput.value = "";
        }
    }

    await saveTasks();
    updateCounters();
    updateTimeAgo();
}

export async function toggleComplete(checkbox) {
    const task = checkbox.parentElement;
    const isCompleted = checkbox.checked;

    // Toggle the completed class based on checkbox state
    if (isCompleted) {
        task.classList.add("completed");
    } else {
        task.classList.remove("completed");
    }

    await saveTasks();
    updateCounters();
}

export async function removeTask(element) {
    const task = element.parentElement;
    task.remove();
    await saveTasks();
    updateCounters();
}

export async function clearTasks() {
    if (confirm("Tem certeza que deseja limpar todas as tarefas?")) {
        document.getElementById("todo-list").innerHTML = "";
        document.getElementById("in-progress-list").innerHTML = "";
        document.getElementById("done-list").innerHTML = "";
        await saveTasks();
        updateCounters();
    }
}

export function createTaskElement(taskData) {
    const task = document.createElement("div");
    task.classList.add("task");
    if (taskData.priority) {
        task.classList.add(taskData.priority);
    }
    task.draggable = true;
    task.dataset.id = taskData.id;
    task.dataset.timestamp = taskData.timestamp;
    task.dataset.notified = taskData.notified ? "true" : "false";
    task.dataset.permanentlyNotified = taskData.permanentlyNotified
        ? "true"
        : "false";

    if (taskData.reminderTime) {
        task.dataset.reminderTime = taskData.reminderTime;
    }

    // Add completed class if task is marked as completed
    if (taskData.completed) {
        task.classList.add("completed");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = taskData.completed || false;
    checkbox.addEventListener("change", function () {
        toggleComplete(this);
    });

    const contentElement = document.createElement("span");
    let taskHTML = taskData.text;

    // Adicionar ícone de lembrete se a tarefa tiver notificação programada
    if (taskData.reminderTime) {
        const reminderDate = new Date(Number(taskData.reminderTime));
        taskHTML += ` <i class="reminder-icon" title="Lembrete: ${reminderDate.toLocaleString()}">⏰</i>`;
    }

    contentElement.innerHTML = `${taskHTML} <small class="time-ago"></small>`;

    // Criar botão remover
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remover";
    removeBtn.addEventListener("click", () => removeTask(removeBtn));

    // Adicionar elementos à tarefa
    task.appendChild(checkbox);
    task.appendChild(contentElement);
    task.appendChild(removeBtn);

    task.addEventListener("dragstart", dragStart);
    task.addEventListener("dragend", dragEnd);

    return task;
}
