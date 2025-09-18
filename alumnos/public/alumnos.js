const urlParams = new URLSearchParams(window.location.search);
const idUsuario = urlParams.get("id");

let alumnoActual = null;

// Función para cargar datos del alumno
async function cargarAlumno() {
    const response = await fetch("http://localhost:3005/api/ver-alumnos");
    const alumnos = await response.json();

    alumnoActual = alumnos.find(a => a.id_usuario == idUsuario);

    if (!alumnoActual) {
        alert("Alumno no encontrado");
        return;
    }

    document.getElementById("matricula").textContent = alumnoActual.matricula;
    document.getElementById("nombre").textContent = alumnoActual.nombre;
    document.getElementById("carrera").textContent = alumnoActual.carrera;

    cargarGrupos();
    cargarCalificaciones();
}

async function cargarGrupos() {
    try {
        // Trae todos los grupos:)
        const responseGrupos = await fetch("http://localhost:3003/api/ver-grupos");
        const grupos = await responseGrupos.json();

        // Trae a los profesores
        const responseProfesores = await fetch("http://localhost:3002/api/ver-personal");
        const profesores = await responseProfesores.json();

        // Se filtran grupos del alumno
        const gruposAlumno = grupos.filter(g => g.alumnos.includes(alumnoActual.id_alumno));

        const tabla = document.getElementById("tablaGrupos");
        tabla.innerHTML = "";

        if (gruposAlumno.length === 0) {
            tabla.innerHTML = `<tr><td colspan="3">No estás inscrito en ningún grupo</td></tr>`;
            return;
        }

        gruposAlumno.forEach(g => {
            const profesor = profesores.find(p => p.id_personal === g.id_personal);
            const nombreProfesor = profesor ? profesor.nombre : "Sin asignar";

            const fila = `
                <tr>
                    <td>${g.id_grupo}</td>
                    <td>${g.nombre}</td>
                    <td>${nombreProfesor}</td>
                </tr>
            `;
            tabla.innerHTML += fila;
        });
    } catch (error) {
        console.error("Error al cargar los grupos:", error);
        document.getElementById("tablaGrupos").innerHTML = `<tr><td colspan="3">Error al cargar los grupos</td></tr>`;
    }
}


// Función para cargar calificaciones
async function cargarCalificaciones() {
    const response = await fetch(`http://localhost:3005/api/ver-calificaciones/${alumnoActual.id_alumno}`);
    if (!response.ok) {
        document.getElementById("tablaCalificaciones").innerHTML = `<tr><td colspan="4">No hay calificaciones registradas.</td></tr>`;
        return;
    }
    const calificaciones = await response.json();

    const tabla = document.getElementById("tablaCalificaciones");
    tabla.innerHTML = "";

    calificaciones.forEach(c => {
        const fila = `
            <tr>
                <td>${c.materia}</td>
                <td>${c.grupo}</td>
                <td>${c.nombre_maestro}</td>
                <td>${c.calificacion}</td>
            </tr>
        `;
        tabla.innerHTML += fila;
    });
}

// Cambiar contraseña
document.getElementById("formCambioContrasena").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nuevaContrasena = document.getElementById("nuevaContrasena").value;

    try {
        const response = await fetch("http://localhost:3001/api/cambiar-contrasena", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_usuario: parseInt(idUsuario),nueva_contrasena: nuevaContrasena
            })
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

// Cerrar sesión
document.getElementById("btnCerrarSesion").addEventListener("click", () => {
    localStorage.clear(); 

    window.location.href = "http://localhost:3001/login.html";
});


// Cargar todo al iniciar
cargarAlumno();