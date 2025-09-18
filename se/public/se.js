let usuarioActivo = null;
let gruposData = [];

// Obtener el ID de la URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}
// Obtener el ID del usuario
const id_usuario = getQueryParam('id');
console.log('ID del usuario:', id_usuario);

// Cargar datos del usuario activo
async function cargarDatosServiciosEscolares() {
    try {
        // Traer usuarios desde el servicio de RH (proxy interno si quieres)
        const response = await fetch("http://localhost:3002/api/ver-personal");
        const usuarios = await response.json();

        const usuario = usuarios.find(u => u.id_usuario === parseInt(id_usuario));

        if (usuario) {
            usuarioActivo = usuario;

            // Mostrar datos en la vista
            document.getElementById("numero_Empelado").textContent = usuario.num_Empleado;
            document.getElementById("nombre").textContent = usuario.nombre;
            document.getElementById("rol").textContent = usuario.rol;

        } else {
            console.error("No se encontró el usuario con id_usuario:", id_usuario);
        }
    } catch (error) {
        console.error("Error al cargar usuario de Servicios Escolares:", error);
    }
}

// Cargar grupos con detalles
async function cargarGrupos() {
    try {
        const response = await fetch('http://localhost:3003/api/ver-grupos-detalles');
        gruposData = await response.json();
        mostrarGrupos();
    } catch (error) {
        console.error('Error al cargar grupos:', error);
    }
}

// Mostrar grupos en la tabla
function mostrarGrupos() {
    const gruposList = document.getElementById('tablaGrupos');
    gruposList.innerHTML = '';

    gruposData.forEach(g => {
        const row = `<tr>
            <td>${g.id_grupo}</td>
            <td>${g.nombre}</td>
            <td>${g.carrera}</td>
            <td>${g.profesor}</td>
            <td>${g.alumnos.join(', ')}</td>
        </tr>`;
        gruposList.innerHTML += row;
    });
}

// Cargar profesores y alumnos en selects 
async function cargarProfesoresYAlumnos() {
    try {
        // Profesores desde RH
        const resProfes = await fetch('http://localhost:3002/api/ver-personal');
        const personal = await resProfes.json();

        const profesorSelect = document.getElementById('profesorSelect');
        profesorSelect.innerHTML = '<option value="">Seleccione un profesor</option>';

        personal
            .filter(p => p.rol === "Profesor")
            .forEach(prof => {
                const option = document.createElement('option');
                option.value = prof.id_personal;
                option.textContent = `${prof.nombre} (Empleado: ${prof.num_Empleado})`;
                profesorSelect.appendChild(option);
            });

        // Alumnos desde servicio de alumnos 
        const resAlumnos = await fetch('http://localhost:3005/api/ver-alumnos');
        const alumnos = await resAlumnos.json();

        const alumnosSelect = document.getElementById('alumnosSelect');
        alumnosSelect.innerHTML = ''; 

        alumnos.forEach(al => {
            const option = document.createElement('option');
            option.value = al.id_alumno;
            option.textContent = `${al.nombre} (Matrícula: ${al.matricula})`;
            alumnosSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Error cargando profesores o alumnos:", error);
    }
}

// Crear un nuevo grupo
document.getElementById('formCrearGrupo').addEventListener('submit', async function (event) {
    event.preventDefault();

    const nombre = document.getElementById('nombreGrupo').value;
    const carrera = document.getElementById('carrera').value;
    const id_personal = parseInt(document.getElementById('profesorSelect').value);

    // Obtener todos los alumnos seleccionados (múltiple select)
    const alumnosSelect = document.getElementById('alumnosSelect');
    const alumnos = Array.from(alumnosSelect.selectedOptions).map(opt => parseInt(opt.value));

    try {
        const response = await fetch('http://localhost:3003/api/crear-grupo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, carrera, id_personal, alumnos })
        });

        if (response.ok) {
            Swal.fire({
                title: "¡Éxito!",
                text: "Grupo creado correctamente",
                icon: "success",
                timer: 2000,
                confirmButtonText: "Aceptar"
            });
            document.getElementById("formCrearGrupo").reset();
            cargarGrupos();
        } else {
            const data = await response.json();
            Swal.fire({
                title: "¡Error!",
                text: "No se pudo crear el grupo: " + (data.mensaje || "Error desconocido"),
                icon: "error",
                confirmButtonText: "Aceptar"
            });
        }
    } catch (error) {
        Swal.fire({
            title: "¡Error!",
            text: "Error de conexión: " + error.message,
            icon: "error",
            confirmButtonText: "Aceptar"
        });
    }
});

// Manejar el envío del formulario de cambiar contraseña
document.getElementById('formCambioContrasena').addEventListener('submit', async function (event) {
    event.preventDefault();

    const nuevaContrasena = document.getElementById('nuevaContrasena').value.trim();

    if (!nuevaContrasena) {
        Swal.fire({
            title: "¡Error!",
            text: "Ingresa una nueva contraseña",
            icon: "warning",
            confirmButtonText: "Aceptar"
        });
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/api/cambiar-contrasena', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_usuario: parseInt(id_usuario), nueva_contrasena: nuevaContrasena })
        });


        if (response.ok) {
            Swal.fire({
                title: "¡Éxito!",
                text: "Contraseña actualizada con éxito",
                icon: "success",
                button: "Aceptar",
            });
            document.getElementById("formCambioContrasena").reset();
        } else {
            const data = await response.json();
            Swal.fire({
                title: "¡Error!",
                text: "Error al cambiar la contraseña: " + (data.mensaje || "Error desconocido"),
                icon: "error",
                button: "Aceptar",
            });
        }

    } catch (error) {
        Swal.fire({
            title: "¡Error!",
            text: "Error al conectar con el servidor: " + error.message,
            icon: "error",
            button: "Aceptar",
        });
    }
});


// Cargar alumnos desde la API
async function cargarAlumnos() {
    try {
        const response = await fetch('http://localhost:3005/api/ver-alumnos');
        const alumnos = await response.json();
        mostrarAlumnos(alumnos);
    } catch (error) {
        console.error('Error al cargar alumnos:', error);
        Swal.fire({
            title: "Error",
            text: "No se pudieron cargar los alumnos",
            icon: "error"
        });
    }
}

// Mostrar alumnos en la tabla
async function mostrarAlumnos(alumnos) {
    const tablaAlumnos = document.getElementById('tablaAlumnos');
    tablaAlumnos.innerHTML = '';

    for (const alumno of alumnos) {
        // Intentar obtener información de usuario para cada alumno
        let usuario = 'N/A';
        try {
            if (alumno.id_usuario) {
                const response = await fetch(`http://localhost:3001/api/usuarios-id/${alumno.id_usuario}`);
                if (response.ok) {
                    const usuarioInfo = await response.json();
                    usuario = usuarioInfo.usuario;
                }
            }
        } catch (error) {
            console.error('Error al obtener usuario:', error);
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${alumnos.indexOf(alumno) + 1}</td>
            <td>${alumno.matricula}</td>
            <td>${alumno.nombre}</td>
            <td>${alumno.carrera}</td>
            <td>${usuario}</td>
            <td>
                <button class="btn btn-sm btn-warning me-1" onclick="editarAlumno(${alumno.id_alumno})">Editar</button>
            </td>
        `;
        tablaAlumnos.appendChild(row);
    }
}

// Editar alumno
async function editarAlumno(idAlumno) {
    try {
        // Obtener información del alumno
        const responseAlumnos = await fetch(`http://localhost:3005/api/ver-alumnos`);
        const alumnos = await responseAlumnos.json();
        const alumno = alumnos.find(a => a.id_alumno === idAlumno);
        
        if (alumno) {
            // Obtener información del usuario
            let usuarioInfo = { usuario: '', password: '' };
            try {
                const responseUsuario = await fetch(`http://localhost:3001/api/usuarios-id/${alumno.id_usuario}`);
                if (responseUsuario.ok) {
                    usuarioInfo = await responseUsuario.json();
                }
            } catch (error) {
                console.error('Error al cargar información de usuario:', error);
            }
            
            // Llenar el formulario con los datos del alumno
            document.getElementById('idAlumno').value = alumno.id_alumno;
            document.getElementById('matriculaAlumno').value = alumno.matricula;
            document.getElementById('nombreAlumno').value = alumno.nombre;
            document.getElementById('carreraAlumno').value = alumno.carrera;
            document.getElementById('usuarioAlumno').value = usuarioInfo.usuario || '';
            document.getElementById('contrasenaAlumno').value = usuarioInfo.password || '';
            
            document.getElementById('tituloFormulario').textContent = 'Editar Alumno';
            
            document.getElementById('contrasenaAlumno').required = false;
            document.getElementById('contrasenaAlumno').placeholder = 'Dejar en blanco para no cambiar';
            
            // Desplazarse al formulario
            document.getElementById('formAlumno').scrollIntoView();
        }
    } catch (error) {
        console.error('Error al cargar alumno para editar:', error);
        Swal.fire({
            title: "Error",
            text: "No se pudo cargar la información del alumno",
            icon: "error"
        });
    }
}

// Limpiar formulario
function limpiarFormulario() {
    document.getElementById('formAlumno').reset();
    document.getElementById('idAlumno').value = '';
    document.getElementById('tituloFormulario').textContent = 'Agregar Nuevo Alumno';
    document.getElementById('contrasenaAlumno').required = true;
    document.getElementById('contrasenaAlumno').placeholder = 'Contraseña';
}

// Manejar envío del formulario (crear o actualizar alumno)
document.getElementById('formAlumno').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const idAlumno = document.getElementById('idAlumno').value;
    const matricula = document.getElementById('matriculaAlumno').value;
    const nombre = document.getElementById('nombreAlumno').value;
    const carrera = document.getElementById('carreraAlumno').value;
    const usuario = document.getElementById('usuarioAlumno').value;
    const contrasena = document.getElementById('contrasenaAlumno').value;
    
    try {
        let response;
        
        if (idAlumno) {
            // Actualizar alumno existente
            response = await fetch(`http://localhost:3005/api/actualizar-alumno/${idAlumno}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    matricula,
                    nombre,
                    carrera,
                    usuario,
                    password: contrasena || undefined
                })
            });
        } else {
            // Crear nuevo alumno
            response = await fetch('http://localhost:3005/api/registrar-alumno', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    matricula,
                    nombre,
                    carrera,
                    usuario,
                    password: contrasena
                })
            });
        }
        
        if (response.ok) {
            Swal.fire({
                title: "¡Éxito!",
                text: idAlumno ? "Alumno actualizado correctamente" : "Alumno registrado correctamente",
                icon: "success"
                
            });
            cargarProfesoresYAlumnos();
            limpiarFormulario();
            cargarAlumnos(); // Recargar la lista de alumnos
        } else {
            const errorData = await response.json();
            throw new Error(errorData.mensaje || 'Error desconocido');
        }
    } catch (error) {
        console.error('Error al guardar alumno:', error);
        Swal.fire({
            title: "Error",
            text: error.message || "No se pudo guardar el alumno",
            icon: "error"
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


// Inicializar al cargar la página
window.onload = () => {
    cargarDatosServiciosEscolares();
    cargarGrupos();
    cargarProfesoresYAlumnos();
    cargarAlumnos();
};
