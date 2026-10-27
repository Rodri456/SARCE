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
import { proteger } from "./middlewares/auth.js";

dotenv.config();

const app = express();

// CORS: solo los orígenes del frontend (configurables en .env con FRONTEND_ORIGINS, separados por coma)
const origenesPermitidos = (
    process.env.FRONTEND_ORIGINS ||
    'http://127.0.0.1:8081,http://localhost:8081,http://127.0.0.1:5500,http://localhost:5500'
)
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

app.use(cors({
    origin(origen, callback) {
        // Sin cabecera Origin = Postman, curl o el navegador abriendo la URL directamente
        if (!origen || origenesPermitidos.includes(origen)) return callback(null, true);
        callback(new Error('Origen no permitido por CORS'));
    }
}));
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

// Todo lo que sigue exige token (excepto POST /usuarios/login) y comprueba permisos por rol
app.use(proteger);

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