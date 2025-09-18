const express = require('express');
const cors = require('cors')
const fs = require('fs');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

const port = 3003;

const archivoGrupos = './grupos.json';

// Función para leer grupos desde el archivo
const leerGrupos = () => {
    const data = fs.readFileSync(archivoGrupos);
    return JSON.parse(data);
};

// Función para guardar grupos en el archivo
const guardarGrupos = (grupos) => {
    fs.writeFileSync(archivoGrupos, JSON.stringify(grupos, null, 2));
};

// Ruta para crear un nuevo grupo
app.post('/api/crear-grupo', (req, res) => {
    const { nombre, carrera, id_personal, alumnos } = req.body;

    // Leer grupos existentes
    const grupos = leerGrupos();

    // Crear nuevo grupo
    const nuevoGrupo = {
        id_grupo: grupos.length + 1, // Asignar un nuevo ID
        nombre: nombre,
        carrera: carrera,
        id_personal: id_personal,
        alumnos: alumnos
    };

    grupos.push(nuevoGrupo);
    guardarGrupos(grupos);

    res.status(201).json(nuevoGrupo);
});


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

// Ruta para ver los grupos con detalles
app.get('/api/ver-grupos-detalles', async (req, res) => {
    try {
        const grupos = await leerGrupos();
        const alumnos = await obtenerAlumnos();
        const personal = await obtenerPersonal();

        if (grupos.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontraron grupos' });
        }

        // Mapeo de grupos con información de profesores y alumnos
        const resultado = grupos.map(grupo => {
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

// Obtener todos los grupos
app.get('/api/ver-grupos', (req, res) => {
    const grupos = leerGrupos();
    res.json(grupos);
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servicio de Servicios Escolares escuchando en http://localhost:${port}`);
});