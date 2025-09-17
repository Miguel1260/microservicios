const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.json());

// Ruta del archivo JSON
const archivoVideojuegos = './videojuegos.json';

// Función para leer videojuegos del archivo
const leerVideojuegos = () => {
    const data = fs.readFileSync(archivoVideojuegos);
    return JSON.parse(data);
};

// Función para escribir videojuegos en el archivo
const guardarVideojuegos = (videojuegos) => {
    fs.writeFileSync(archivoVideojuegos, JSON.stringify(videojuegos, null, 2));
};

// Inicializar videojuegos desde el archivo
let videojuegos = leerVideojuegos();

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

// Obtener todos los videojuegos
app.get('/videojuegos', (req, res) => {
    res.json(videojuegos);
});

app.get('/mis-videojuegos', (req, res) =>  {
    return res.json([
        videojuegos[0],
        videojuegos[2]
    ]);
});

app.post('/guardar-videojuego', (req, res) => {
    let nuevoVideojuego = {
        id: videojuegos.length + 1,
        titulo: req.body.titulo,
        genero: req.body.genero,
        precio: req.body.precio
    };
    videojuegos.push(nuevoVideojuego);
    guardarVideojuegos(videojuegos); // Guardar cambios en el archivo

    return res.status(200).json(nuevoVideojuego);
});