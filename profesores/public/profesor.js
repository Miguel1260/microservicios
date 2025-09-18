let idProfesorActivo = null;
let gruposConAlumnos = [];


// Obtener el ID de la URL 
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
const id_usuario = getQueryParam('id');
console.log('ID del usuario:', id_usuario);

// Lista maestra de alumnos
let alumnosMaster = [];

async function cargarDatosProfesor() {
  try {
    const response = await fetch("http://localhost:3002/api/ver-personal");
    const personal = await response.json();

    const prof = personal.find(p => p.id_usuario === parseInt(id_usuario));
    if (prof) {
      idProfesorActivo = prof.id_personal;

      document.getElementById("num_Empleado").textContent  = prof.num_Empleado;
      document.getElementById("nombre").textContent  = prof.nombre;
      document.getElementById("rol").textContent = prof.rol;

      cargarGruposProfesor();

      // Cargar lista maestra de alumnos para el select de calificaciones
      await cargarAlumnosMaster();
      llenarSelectAlumnos();
    } else {
      console.error("No se encontró el profesor con id_usuario:", id_usuario);
    }
  } catch (error) {
    console.error("Error al cargar profesor:", error);
  }
}

async function cargarGruposProfesor() {
  if (!idProfesorActivo) return;
  try {
    const resGrupos = await fetch("http://localhost:3004/api/ver-grupos-detalles/" + idProfesorActivo);
    const grupos = await resGrupos.json();

    const tabla = document.getElementById("tablaGrupos");
    tabla.innerHTML = "";
    const selectGrupo = document.getElementById("id_grupo");
    selectGrupo.innerHTML = '<option value="" disabled selected>Selecciona un grupo</option>';

    // Guardar información de grupos con alumnos para usar después
    gruposConAlumnos = grupos;

    grupos.forEach(g => {
      tabla.innerHTML += `
        <tr>
          <td>${g.id_grupo}</td>
          <td>${g.nombre}</td>
          <td>${g.carrera}</td>
          <td>${g.alumnos.join(", ")}</td>
        </tr>`;

      selectGrupo.innerHTML += `<option value="${g.id_grupo}">${g.nombre} - ${g.carrera}</option>`;
    });

    // Agregar evento para cuando se seleccione un grupo
    selectGrupo.addEventListener('change', function() {
      const idGrupoSeleccionado = parseInt(this.value);
      filtrarAlumnosPorGrupo(idGrupoSeleccionado);
    });
  } catch (error) {
    console.error("Error al cargar grupos:", error);
  }
}

// Filtrar alumnos por grupo seleccionado
function filtrarAlumnosPorGrupo(idGrupo) {
  const selectAlumno = document.getElementById("idAlumno");
  
  const grupoSeleccionado = gruposConAlumnos.find(g => g.id_grupo === idGrupo);
  
  if (!grupoSeleccionado) {
    selectAlumno.innerHTML = '<option value="" disabled selected>No se encontró el grupo</option>';
    return;
  }
  
  selectAlumno.innerHTML = '<option value="" disabled selected>Selecciona un alumno</option>';
  
  grupoSeleccionado.alumnos.forEach((nombreAlumno) => {
    // Buscar el alumno en la lista maestra para obtener su ID
    const alumno = alumnosMaster.find(a => a.nombre === nombreAlumno);
    const idAlumno = alumno ? alumno.id_alumno : nombreAlumno;
    
    selectAlumno.innerHTML += `<option value="${idAlumno}">${nombreAlumno}</option>`;
  });
}

async function cargarAlumnosMaster() {
  try {
    const response = await fetch("http://localhost:3005/api/ver-alumnos");
    const alumnos = await response.json();
    alumnosMaster = alumnos;
    console.log('Alumnos master cargados:', alumnosMaster);
  } catch (error) {
    console.error("Error al cargar alumnos master:", error);
  }
}



// Llenar select de alumnos solo con nombres (para registrar calificaciones)
function llenarSelectAlumnos() {
  const selectAlumno = document.getElementById("idAlumno");
  selectAlumno.innerHTML = '<option value="" disabled selected>Selecciona un alumno</option>';

  alumnosMaster.forEach(alumno => {
    selectAlumno.innerHTML += `<option value="${alumno.id_alumno}">${alumno.nombre}</option>`;
  });
}

// Registrar calificación
document.getElementById("formCalificacion").addEventListener("submit", async e => {
  e.preventDefault();

  const id_grupo = parseInt(document.getElementById("id_grupo").value);
  const id_alumno = parseInt(document.getElementById("idAlumno").value);
  const materia = document.getElementById("materia").value;
  const calificacion = parseInt(document.getElementById("calificacion").value);

  try {
    const res = await fetch("http://localhost:3004/api/registrar-calificacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_alumno, id_grupo, materia, calificacion })
    });

    if (res.ok) {
      Swal.fire("Éxito", "Calificación registrada", "success");
      e.target.reset();
    } else {
      const errorData = await res.json();
      Swal.fire("Error", errorData.mensaje || "No se pudo registrar", "error");
    }
  } catch (error) {
    Swal.fire("Error", "Problema de conexión: " + error.message, "error");
  }
});

document.getElementById("formCambioContrasena").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nuevaContrasena = document.getElementById("nuevaContrasena").value;

    try {
        const response = await fetch("http://localhost:3001/api/cambiar-contrasena", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_usuario: parseInt(id_usuario), nueva_contrasena: nuevaContrasena })
        });

        if (response.ok) {
            Swal.fire("¡Éxito!", "Contraseña actualizada con éxito", "success");
            document.getElementById("formCambioContrasena").reset();
        } else {
            const data = await response.json();
            Swal.fire("¡Error!", "Error al cambiar la contraseña: " + (data.mensaje || "Error desconocido"), "error");
        }
    } catch (error) {
        Swal.fire("¡Error!", "Error al conectar con el servidor: " + error.message, "error");
    }
});


// Cerrar sesión
document.getElementById("btnCerrarSesion").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "http://localhost:3001/login.html";
});

// Inicializar al cargar
window.onload = cargarDatosProfesor;
