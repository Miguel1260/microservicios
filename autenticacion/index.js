const express = require('express');
const cors = require('cors')
const fs = require('fs');
const bodyParser = require('body-parser');
const axios = require('axios'); // Importar axios

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));


// Leer usuarios desde el archivo
const leerUsuarios = () => {
    const data = fs.readFileSync('./usuarios.json');
    return JSON.parse(data);
};

// Guardar usuarios en el archivo
const guardarUsuarios = (usuarios) => {
    fs.writeFileSync('./usuarios.json', JSON.stringify(usuarios, null, 2));
};

app.get('/usuarios', (req, res) => {
    res.json(leerUsuarios);
});

// Ruta para iniciar sesión
app.post('/api/login', (req, res) => {
    const { usuario, password } = req.body;
    let usuarios = leerUsuarios();

    // Buscar el usuario por nombre de usuario y contraseña
    const usuarioEncontrado = usuarios.find(u => u.usuario === usuario && u.password === password);

    if (!usuarioEncontrado) {
        return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    res.status(200).json({ mensaje: 'Inicio de sesión exitoso', id_usuario: usuarioEncontrado.id_usuario, rol: usuarioEncontrado.rol });
});

// Ruta para crear un nuevo usuario
app.post('/api/guardar-usuarios', (req, res) => {
    let usuarios = leerUsuarios();
    const nuevoUsuario = {
        id_usuario: usuarios.length + 1,
        usuario: String(req.body.usuario),
        password: String(req.body.password),
        rol: req.body.rol
    };
    usuarios.push(nuevoUsuario);
    guardarUsuarios(usuarios);
    res.status(201).json(nuevoUsuario);
});

// Ruta para cambiar la contraseña de un usuario
app.put('/api/cambiar-contrasena', (req, res) => {
    const { id_usuario, nueva_contrasena } = req.body;
    let usuarios = leerUsuarios();

    // Buscar el usuario por ID
    const usuario = usuarios.find(u => u.id_usuario === id_usuario);

    if (!usuario) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Cambiar la contraseña
    usuario.password = nueva_contrasena;

    // Guardar los cambios en el archivo
    guardarUsuarios(usuarios);
    res.status(200).json({ mensaje: 'Contraseña actualizada con éxito' });
});


// Ruta para actualizar la información del usuario
app.put('/api/usuarios/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    const { usuario, password } = req.body;

    try {
        let usuarios = leerUsuarios(); // Función para leer usuarios
        const userIndex = usuarios.findIndex(u => u.id_usuario == id_usuario);

        if (userIndex === -1) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        // Actualizar el usuario
        if (usuario) usuarios[userIndex].usuario = usuario;
        if (password) usuarios[userIndex].password = password;

        guardarUsuarios(usuarios); // Función para guardar usuarios actualizados

        res.status(200).json({ mensaje: 'Usuario actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar el usuario', error: error.message });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servicio de autenticación escuchando en http://localhost:${port}`);
});