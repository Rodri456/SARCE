import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import usuarioRoutes from './routes/usuario.js';
import gradoRoutes from './routes/grado.js';
import materiaRoutes from './routes/materia.js';
import docenteRoutes from './routes/docente.js';
import estudianteRoutes from './routes/estudiante.js';
import horarioRoutes from './routes/horario.js';
import calificacionRoutes from './routes/calificacion.js';
import asignacionRoutes from './routes/asignacion.js';
import pagoRoutes from './routes/pago.js';
import eventoCalendarioRoutes from './routes/eventoCalendario.js';
import { errorHandler } from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();

app.use(cors());
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
app.use('/calificaciones', calificacionRoutes);
app.use('/asignaciones', asignacionRoutes);
app.use('/pagos', pagoRoutes);
app.use('/eventos-calendario', eventoCalendarioRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});