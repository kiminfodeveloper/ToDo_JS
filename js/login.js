console.log("login.js: Verificando API:", window.api);

document.addEventListener("DOMContentLoaded", () => {
    const loginButton = document.getElementById("loginButton");
    const registerButton = document.getElementById("registerButton");
    const toggleFormButton = document.getElementById("toggleForm");
    const formTitle = document.getElementById("formTitle");
    const errorMessage = document.getElementById("errorMessage");

    let isLoginForm = true;

    toggleFormButton.addEventListener("click", () => {
        isLoginForm = !isLoginForm;
        formTitle.textContent = isLoginForm ? "Login" : "Cadastro";
        loginButton.classList.toggle("hidden");
        registerButton.classList.toggle("hidden");
        toggleFormButton.textContent = isLoginForm
            ? "Não tem uma conta? Cadastre-se"
            : "Já tem uma conta? Faça login";
        errorMessage.textContent = "";
    });

    loginButton.addEventListener("click", async () => {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        if (!email || !password) {
            errorMessage.textContent = "Por favor, preencha todos os campos.";
            return;
        }

        try {
            const result = await window.api.login(email, password);
            if (result.success) {
                errorMessage.textContent = "";
                window.location.href = "index.html";
            } else {
                errorMessage.textContent =
                    result.error || "Erro ao fazer login.";
            }
        } catch (err) {
            errorMessage.textContent = "Erro ao fazer login. Tente novamente.";
        }
    });

    registerButton.addEventListener("click", async () => {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        if (!email || !password) {
            errorMessage.textContent = "Por favor, preencha todos os campos.";
            return;
        }

        try {
            const result = await window.api.register(email, password);
            if (result.success) {
                errorMessage.textContent = "";
                window.location.href = "index.html";
            } else {
                errorMessage.textContent =
                    result.error || "Erro ao registrar usuário.";
            }
        } catch (err) {
            errorMessage.textContent =
                "Erro ao registrar usuário. Tente novamente.";
        }
    });
});
