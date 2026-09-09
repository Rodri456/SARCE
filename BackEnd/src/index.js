import express from "express";

import usuarioRoutes from './routes/usuario.js';

import { errorHandler } from "./middlewares/errorHandler.js";

import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use('/usuarios', usuarioRoutes);

app.use(errorHandler);

app.listen(process.env.PORT || 3000, () => {
    console.log('Servidor corriendo en http://localhost:${process.env.PORT || 3000}');
});