let personalData = []; // Variable para almacenar los datos del personal

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Obtener el ID del usuario
const id_usuario = getQueryParam('id');
console.log('ID del usuario:', id_usuario);

// Función para cargar el personal en la tabla
async function cargarPersonal() {
    try {
        const response = await fetch('http://localhost:3002/api/ver-personal');
        personalData = await response.json();
        mostrarPersonal();
    } catch (error) {
        console.error('Error al cargar el personal:', error);
    }
}

// Función para mostrar el personal en la tabla
function mostrarPersonal() {
    const personalList = document.getElementById('personalList');
    personalList.innerHTML = '';

    const filtro = document.getElementById('filterRole').value;

    const datosFiltrados = filtro ? personalData.filter(p => p.rol === filtro) : personalData;

    datosFiltrados.forEach(p => {
        const row = `<tr>
            <td>${p.id_personal}</td>
            <td>${p.num_Empleado}</td>
            <td>${p.nombre}</td>
            <td>${p.rol}</td>
        </tr>`;
        personalList.innerHTML += row;
    });
}

// Función para manejar el envío del formulario de agregar personal
document.getElementById('addPersonalForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const num_empleado = document.getElementById('numeroEmpleado').value;
    const nombre = document.getElementById('nombre').value;
    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;
    const rol = document.getElementById('rol').value;

    try {
        const response = await fetch('http://localhost:3002/api/alta-personal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ num_empleado, nombre, usuario, password, rol }),
        });

        if (response.ok) {
            Swal.fire({
                title: "¡Éxito!",
                text: "Personal agregado con éxito",
                icon: "success",
                timer: 2000,
                confirmButtonText: "Aceptar"
            });
            document.getElementById("addPersonalForm").reset();
            cargarPersonal();
        } else {
            const data = await response.json();
            Swal.fire({
                title: "¡Error!",
                text: "Error al agregar personal: " + (data.mensaje || "Error desconocido"),
                icon: "error",
                confirmButtonText: "Aceptar"
            });
        }
    } catch (error) {
        Swal.fire({
            title: "¡Error!",
            text: "Error al conectar con el servidor: " + error.message,
            icon: "error",
            timer: 2000,
            confirmButtonText: "Aceptar"
        });
    }
});

// Función para manejar el envío del formulario de cambiar contraseña
document.getElementById('formCambioContrasena').addEventListener('submit', async function (event) {
    event.preventDefault();

    const nuevaContrasena = document.getElementById('nuevaContrasena').value;

    try {
        const response = await fetch('http://localhost:3001/api/cambiar-contrasena', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id_usuario: parseInt(id_usuario), nueva_contrasena: nuevaContrasena }),
        });

        if (response.ok) {
            Swal.fire({
                title: "¡Éxito!",
                text: "Contraseña cambiada con éxito",
                icon: "success",
                timer: 2000,
                confirmButtonText: "Aceptar"
            });
            document.getElementById("formCambioContrasena").reset();
        } else {
            const data = await response.json();
            Swal.fire({
                title: "¡Error!",
                text: "Error al cambiar la contraseña: " + (data.mensaje || "Error desconocido"),
                icon: "error",
                confirmButtonText: "Aceptar"
            });
        }
    } catch (error) {
        Swal.fire({
            title: "¡Error!",
            text: "Error al conectar con el servidor: " + error.message,
            icon: "error",
            timer: 2000,
            confirmButtonText: "Aceptar"
        });
    }
});

document.getElementById('logoutButton').addEventListener('click', async () => {
    Swal.fire({
        title: "¡Éxito!",
        text: "Has cerrado sesión con éxito.",
        icon: "success",
        timer: 1000,
        showConfirmButton: false,
    }).then(() => {
        window.location.href = 'http://localhost:3001/login.html';
    });
});


// Función para filtrar el personal
function filtrarPersonal() {
    mostrarPersonal();
}

// Cargar el personal al inicio
window.onload = cargarPersonal;