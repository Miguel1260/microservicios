
const express = require('express');
const cors = require('cors')
const fs = require('fs');
const bodyParser = require('body-parser');
const axios = require('axios'); // Importar axios

const app = express();
const port = 3002;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));


// Ruta del archivo de personal
const archivoPersonal = './personal.json';

// Función para leer personal desde el archivo
const leerPersonal = () => {
    const data = fs.readFileSync(archivoPersonal);
    return JSON.parse(data);
};

// Función para guardar personal en el archivo
const guardarPersonal = (personal) => {
    fs.writeFileSync(archivoPersonal, JSON.stringify(personal, null, 2));
};

// Ruta para dar de alta a personal (profesores, RH, ServiciosEscolares)
app.post('/api/alta-personal', async (req, res) => {
    const { num_empleado, nombre, rol, usuario, password } = req.body;

    // Leer archivo de personal
    let personal = leerPersonal();

    // Crear el objeto de nuevo personal
    const nuevoPersonal = {
        id_personal: personal.length + 1,
        num_Empleado: num_empleado,
        nombre: nombre,
        rol: rol
    };

    try {
        // Realizar solicitud a la API de autenticación para crear un nuevo usuario
        const response = await axios.post('http://localhost:3001/api/guardar-usuarios', {
            usuario: usuario,
            password: password,
            rol: rol
        });

        // Asignar el ID del usuario creado al nuevo personal
        nuevoPersonal.id_usuario = response.data.id_usuario;

        // Agregar el nuevo personal a la lista de personal
        personal.push(nuevoPersonal);
        guardarPersonal(personal); // Guardar el personal en personal.json

        res.status(201).json(nuevoPersonal);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear el usuario', error: error.message });
    }
});

// Obtener todo el personal
app.get('/api/ver-personal', (req, res) => {
    const personal = leerPersonal();
    res.json(personal);
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servicio de Recursos Humanos escuchando en http://localhost:${port}`);
});

