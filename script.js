document.addEventListener("DOMContentLoaded", function () {
  const taskInput = document.getElementById("taskInput");
  const dateInput = document.getElementById("dateInput");
  const addTaskBtn = document.getElementById("addTask");
  const clearFieldsBtn = document.getElementById("clearFields");

  // Referências para as colunas
  const columnStartList = document.getElementById("column-start-list");
  const columnProgressList = document.getElementById("column-progress-list");
  const columnCompletedList = document.getElementById("column-completed-list");

  // Função para criar uma nova tarefa
  function createTask(text, date) {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="task-content">
        <span>${text}</span>
        <span>${date}</span>
      </div>
      <div class="task-actions">
        <div class="task-progress">
          <div class="progress-bar"></div>
        </div>
        <button class="delete-btn">Excluir</button>
        <button class="move-progress-btn">Avançar</button>
        <button class="move-completed-btn">Concluído</button>
      </div>
    `;

    // Lidar com o movimento da tarefa para a coluna "Em Progresso"
    const moveProgressBtn = li.querySelector(".move-progress-btn");
    moveProgressBtn.addEventListener("click", function () {
      columnProgressList.appendChild(li);
      moveProgressBtn.remove();
      li.querySelector(".progress-bar").style.width = "50%";
    });

    // Lidar com o movimento da tarefa para a coluna "Finalizado"
    const moveCompletedBtn = li.querySelector(".move-completed-btn");
    moveCompletedBtn.addEventListener("click", function () {
      columnCompletedList.appendChild(li);
      moveCompletedBtn.remove();
      li.querySelector(".progress-bar").style.width = "100%";
    });

    // Lidar com a exclusão da tarefa
    const deleteBtn = li.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", function () {
      li.remove();
    });

    return li;
  }

  // Adicionar uma tarefa
  addTaskBtn.addEventListener("click", function () {
    const taskText = taskInput.value.trim();
    const taskDate = dateInput.value;

    if (taskText !== "") {
      const task = createTask(taskText, taskDate);

      // Adicionar a tarefa à coluna "Iniciando"
      columnStartList.appendChild(task);

      // Limpar os campos de entrada
      taskInput.value = "";
      dateInput.value = "";
    }
  });

  // Event listener para o botão "Limpar Campos"
  clearFieldsBtn.addEventListener("click", function () {
    taskInput.value = "";
    dateInput.value = "";
  });
});
