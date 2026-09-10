import express from "express";

import usuarioRoutes from './routes/usuario.js';
import gradoRoutes from './routes/grado.js';
import materiaRoutes from './routes/materia.js';
import docenteRoutes from './routes/docente.js';
import estudianteRoutes from './routes/estudiante.js';
import horarioRoutes from './routes/horario.js';
import { errorHandler } from "./middlewares/errorHandler.js";

import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use('/usuarios', usuarioRoutes);
app.use('/grados', gradoRoutes);
app.use('/materias', materiaRoutes);
app.use('/docentes', docenteRoutes);
app.use('/estudiantes', estudianteRoutes);
app.use('/horarios', horarioRoutes);
app.use(errorHandler);

app.listen(process.env.PORT || 3000, () => {
    console.log('Servidor corriendo en http://localhost:${process.env.PORT || 3000}');
});