document.addEventListener("DOMContentLoaded", () => {
    const loginButton = document.getElementById("loginButton");
    const registerButton = document.getElementById("registerButton");
    const toggleFormButton = document.getElementById("toggleForm");
    const formTitle = document.getElementById("formTitle");
    const errorMessage = document.getElementById("errorMessage");
    const rememberMeCheckbox = document.getElementById("rememberMe");
    const emailInput = document.getElementById("email");

    let isLoginForm = true;

    // Carregar email salvo, se existir
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
        emailInput.value = savedEmail;
        rememberMeCheckbox.checked = true;
    }

    toggleFormButton.addEventListener("click", () => {
        isLoginForm = !isLoginForm;
        formTitle.textContent = isLoginForm ? "Login" : "Cadastro";
        loginButton.classList.toggle("hidden");
        registerButton.classList.toggle("hidden");

        // Esconder o checkbox "Lembrar login" na tela de cadastro
        if (isLoginForm) {
            document.querySelector(".remember-me").style.display = "flex";
        } else {
            document.querySelector(".remember-me").style.display = "none";
        }

        toggleFormButton.textContent = isLoginForm
            ? "Não tem uma conta? Cadastre-se"
            : "Já tem uma conta? Faça login";
        errorMessage.textContent = "";
    });

    loginButton.addEventListener("click", async () => {
        const email = emailInput.value;
        const password = document.getElementById("password").value;

        if (!email || !password) {
            errorMessage.textContent = "Por favor, preencha todos os campos.";
            return;
        }

        try {
            const result = await window.api.login(email, password);
            if (result.success) {
                // Salvar email se "Lembrar login" estiver marcado
                if (rememberMeCheckbox.checked) {
                    localStorage.setItem("savedEmail", email);
                } else {
                    localStorage.removeItem("savedEmail");
                }

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
        const email = emailInput.value;
        const password = document.getElementById("password").value;

        if (!email || !password) {
            errorMessage.textContent = "Por favor, preencha todos os campos.";
            errorMessage.className = "error";
            return;
        }

        try {
            const result = await window.api.register(email, password);
            if (result.success) {
                // Mostrar mensagem de sucesso
                errorMessage.textContent =
                    result.message || "Conta criada com sucesso! Faça login.";
                errorMessage.className = "success";

                // Voltar para o formulário de login
                setTimeout(() => {
                    if (!isLoginForm) {
                        toggleFormButton.click();
                    }
                }, 1500);
            } else {
                errorMessage.textContent =
                    result.error || "Erro ao registrar usuário.";
                errorMessage.className = "error";
            }
        } catch (err) {
            errorMessage.textContent =
                "Erro ao registrar usuário. Tente novamente.";
            errorMessage.className = "error";
        }
    });
});
