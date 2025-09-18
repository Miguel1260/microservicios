const express = require('express');
const cors = require('cors')
const fs = require('fs');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

const port = 3005;


const archivoAlumnos = './alumnos.json';

// Función para leer alumnos desde el archivo
const leerAlumnos = () => {
    if (!fs.existsSync(archivoAlumnos)) {
        return []; 
    }
    const data = fs.readFileSync(archivoAlumnos);
    return JSON.parse(data);
};

// Función para guardar alumnos en el archivo
const guardarAlumnos = (alumnos) => {
    fs.writeFileSync(archivoAlumnos, JSON.stringify(alumnos, null, 2));
};

// Ruta para dar de alta a alumnos
app.post('/api/registrar-alumno', async (req, res) => {
    const { matricula, nombre, carrera, usuario, password } = req.body;

    // Leer archivo de alumnos
    let alumnos = leerAlumnos();

    // Crear el objeto de nuevo alumno
    const nuevoAlumno = {
        id_alumno: alumnos.length + 1,
        matricula: matricula,
        nombre: nombre,
        carrera: carrera
    };

    try {
        // Realizar solicitud a la API de autenticación para crear un nuevo usuario
        const response = await axios.post('http://localhost:3001/api/guardar-usuarios', {
            usuario: usuario,
            password: password,
            rol: "Alumno"
        });

        // Asignar el ID del usuario creado al nuevo alumno
        nuevoAlumno.id_usuario = response.data.id_usuario;

        // Agregar el nuevo alumno a la lista de alumnos
        alumnos.push(nuevoAlumno);
        guardarAlumnos(alumnos);

        res.status(201).json(nuevoAlumno);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear el usuario', error: error.message });
    }
});


// Ruta para actualizar la información del alumno
app.put('/api/actualizar-alumno/:id_alumno', async (req, res) => {
    const { id_alumno } = req.params;
    const { matricula, nombre, carrera, usuario, password } = req.body;

    let alumnos = leerAlumnos();
    const alumnoIndex = alumnos.findIndex(a => a.id_alumno == id_alumno);

    if (alumnoIndex === -1) {
        return res.status(404).json({ mensaje: 'Alumno no encontrado' });
    }

    if (matricula) alumnos[alumnoIndex].matricula = matricula;
    if (nombre) alumnos[alumnoIndex].nombre = nombre;
    if (carrera) alumnos[alumnoIndex].carrera = carrera;

    // Actualizar usuario y contraseña
    if (usuario || password) {
        try {
            const response = await axios.put(`http://localhost:3001/api/usuarios/${alumnos[alumnoIndex].id_usuario}`, {
                usuario: usuario,
                password: password
            });
        } catch (error) {
            return res.status(500).json({ mensaje: 'Error al actualizar el usuario', error: error.message });
        }
    }

    guardarAlumnos(alumnos);

    res.status(200).json(alumnos[alumnoIndex]);
});

// Función para leer calificaciones del servicio de profesores
const obtenerCalificaciones = async () => {
    const response = await axios.get('http://localhost:3004/api/ver-calificaciones');
    return response.data;
};

// Función para leer grupos del servicio escolar
const obtenerGrupos = async () => {
    const response = await axios.get('http://localhost:3003/api/ver-grupos');
    return response.data;
};

// Función para obtener personal (profesores) del servicio de RH
const obtenerPersonal = async () => {
    const response = await axios.get('http://localhost:3002/api/ver-personal');
    return response.data;
};

// Ruta para ver las calificaciones de un alumno específico
app.get('/api/ver-calificaciones/:id_alumno', async (req, res) => {
    const id_alumno = parseInt(req.params.id_alumno, 10); // Convertir a entero

    try {
        const calificaciones = await obtenerCalificaciones();
        const grupos = await obtenerGrupos();
        const personal = await obtenerPersonal();
        const alumnos = leerAlumnos();

        // Filtrar calificaciones por el ID del alumno
        const calificacionesFiltradas = calificaciones.filter(c => c.id_alumno === id_alumno);

        if (calificacionesFiltradas.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontraron calificaciones para este alumno' });
        }

        // Obtener el nombre del alumno
        const alumno = alumnos.find(a => a.id_alumno === id_alumno);
        const nombreAlumno = alumno ? alumno.nombre : 'Alumno no encontrado';

        // Mapeo de calificaciones con información de grupos y maestros
        const resultado = calificacionesFiltradas.map(calificacion => {
            const grupo = grupos.find(g => g.id_grupo === calificacion.id_grupo);
            const nombreProfesor = personal.find(p => p.id_personal === grupo.id_personal)?.nombre || 'Maestro no encontrado';

            return {
                grupo: grupo ? grupo.nombre : 'Grupo no encontrado',
                nombre_maestro: nombreProfesor,
                materia: calificacion.materia,
                calificacion: calificacion.calificacion,
                alumno: nombreAlumno
            };
        });

        res.status(200).json(resultado);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los datos', error: error.message });
    }
});


// Obtener todos los alumnos
app.get('/api/ver-alumnos', (req, res) => {
    const alumnos = leerAlumnos();
    res.json(alumnos);
});


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servicio de Alumnos escuchando en http://localhost:${port}`);
});