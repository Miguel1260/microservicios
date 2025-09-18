document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;

    const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario, password })
    });

    if (response.ok) {
        const data = await response.json();
        const userId = data.id_usuario;   // Redirigir según el rol

        Swal.fire({
            title: "¡Éxito!",
            text: "Inicio de sesión exitoso.",
            icon: "success",
            timer: 1000,
            showConfirmButton: false,
        }).then(() => {
            switch (data.rol) {
                case 'Alumno':
                    window.location.href = `http://localhost:3005/alumno.html?id=${userId}`; // URL de la página de alumno
                    break;
                case 'Profesor':
                    window.location.href = `http://localhost:3004/profesor.html?id=${userId}`; // URL de la página de profesor
                    break;
                case 'RH':
                    window.location.href = `http://localhost:3002/rh.html?id=${userId}`; // URL de la página de Recursos Humanos
                    break;
                case 'ServiciosEscolares':
                    window.location.href = `http://localhost:3003/servicios-escolares.html?id=${userId}`; // URL de la página de servicios escolares
                    break;
            }
        });
    } else {
        const errorData = await response.json(); 
        Swal.fire({
            title: "¡Error!",
            text: errorData.mensaje || "Credenciales Incorrectas.",
            icon: "error",
            timer: 1000,
            showConfirmButton: false,
        });
    }
});