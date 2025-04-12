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
    task.dataset.column = "todo-list";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.addEventListener("change", () => toggleComplete(checkbox));

    const span = document.createElement("span");
    span.innerHTML = `${taskText} <small class="time-ago"></small>`;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remover";
    removeBtn.addEventListener("click", () => removeTask(removeBtn));

    task.appendChild(checkbox);
    task.appendChild(span);
    task.appendChild(removeBtn);

    task.addEventListener("dragstart", dragStart);
    task.addEventListener("dragend", dragEnd);

    document.getElementById("todo-list").appendChild(task);
    taskInput.value = "";
    await saveTasks();
    updateCounters();
    updateTimeAgo();
}

export async function toggleComplete(checkbox) {
    const task = checkbox.parentElement;
    task.classList.toggle("completed");
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
