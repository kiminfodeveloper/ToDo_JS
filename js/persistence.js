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
        return;
    }

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
        await window.api.saveTasks(userId, tasks);
    } catch (error) {
        // Error occurred but we're suppressing logs
    }
}

export async function loadTasks() {
    if (!userId) {
        return;
    }

    try {
        const tasks = await window.api.loadTasks(userId);
        renderTasks(tasks);
    } catch (error) {
        // Error occurred but we're suppressing logs
    }
}

async function saveTask(task) {
    if (!userId) {
        return false;
    }

    try {
        await window.api.saveTask(userId, task);
        return true;
    } catch (error) {
        // Error occurred but we're suppressing logs
        return false;
    }
}
