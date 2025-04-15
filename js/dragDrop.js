let saveTasks, updateCounters;

export function setSaveTasks(fn) {
    saveTasks = fn;
}

export function setUpdateCounters(fn) {
    updateCounters = fn;
}

export function allowDrop(event) {
    event.preventDefault();
}

export function dragStart(event) {
    event.target.classList.add("dragging");
    event.dataTransfer.setData("text/plain", event.target.id);
}

export async function dragEnd(event) {
    event.target.classList.remove("dragging");
    await saveTasks();
    updateCounters();
}

export function drop(event) {
    event.preventDefault();
    const task = document.querySelector(".dragging");
    const targetList = event.target.closest(".task-list");
    if (targetList) {
        targetList.appendChild(task);
    }
}
