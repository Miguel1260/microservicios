const express = require('express');
const cors = require('cors')
const fs = require('fs');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

const port = 3004;

const archivoCalificaciones = './calificaciones.json';

// Función para leer calificaciones desde el archivo
const leerCalificaciones = () => {
    if (!fs.existsSync(archivoCalificaciones)) {
        return []; // Retornar un arreglo vacío si el archivo no existe
    }
    const data = fs.readFileSync(archivoCalificaciones);
    return JSON.parse(data);
};

// Función para guardar calificaciones en el archivo
const guardarCalificaciones = (calificaciones) => {
    fs.writeFileSync(archivoCalificaciones, JSON.stringify(calificaciones, null, 2));
};

// Ruta para registrar una nueva calificación
app.post('/api/registrar-calificacion', (req, res) => {
    const { id_alumno, id_grupo, calificacion, materia } = req.body;

    // Leer calificaciones existentes
    const calificaciones = leerCalificaciones();

    // Crear nueva calificación
    const nuevaCalificacion = {
        id_calificacion: calificaciones.length + 1, // Asignar un nuevo ID
        id_alumno: id_alumno,
        id_grupo: id_grupo,
        calificacion: calificacion,
        materia: materia
    };

    // Agregar la nueva calificación a la lista de calificaciones
    calificaciones.push(nuevaCalificacion);
    guardarCalificaciones(calificaciones); // Guardar las calificaciones en calificaciones.json

    res.status(201).json(nuevaCalificacion);
});

// Función para obtener grupos del servicio escolar
const obtenerGrupos = async () => {
    const response = await axios.get('http://localhost:3003/api/ver-grupos');
    return response.data;
};

// Función para obtener alumnos del servicio de alumnos
const obtenerAlumnos = async () => {
    const response = await axios.get('http://localhost:3005/api/ver-alumnos');
    return response.data;
};

// Función para obtener personal (profesores) del servicio de RH
const obtenerPersonal = async () => {
    const response = await axios.get('http://localhost:3002/api/ver-personal');
    return response.data;
};

// Ruta para ver los grupos con detalles de un profesor específico
app.get('/api/ver-grupos-detalles/:id_profesor', async (req, res) => {
    const id_profesor = parseInt(req.params.id_profesor, 10); // Convertir a entero

    try {
        const grupos = await obtenerGrupos();
        const alumnos = await obtenerAlumnos();
        const personal = await obtenerPersonal();

        // Filtrar grupos por el ID del profesor
        const gruposFiltrados = grupos.filter(grupo => grupo.id_personal === id_profesor);

        if (gruposFiltrados.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontraron grupos para este profesor' });
        }

        // Mapeo de grupos con información de profesores y alumnos
        const resultado = gruposFiltrados.map(grupo => {
            const profesor = personal.find(p => p.id_personal === grupo.id_personal);
            const nombresAlumnos = grupo.alumnos.map(id_alumno => {
                const alumno = alumnos.find(a => a.id_alumno === id_alumno);
                return alumno ? alumno.nombre : 'Alumno no encontrado';
            });

            return {
                id_grupo: grupo.id_grupo,
                nombre: grupo.nombre,
                carrera: grupo.carrera,
                profesor: profesor ? profesor.nombre : 'Profesor no encontrado',
                alumnos: nombresAlumnos
            };
        });

        res.status(200).json(resultado);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los datos', error: error.message });
    }
});

//Obtener todas las calificaciones
app.get('/api/ver-calificaciones', (req, res) => {
    const calificaciones = leerCalificaciones();
    res.json(calificaciones);
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servicio de Profesores escuchando en http://localhost:${port}`);
});