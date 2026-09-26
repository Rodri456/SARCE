import * as pagoService from '../services/pagoServices.js';

export const obtenerTodos = async (req, res, next) => {
    try {
        const result = await pagoService.getAllPagos();
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorId = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await pagoService.getPagoById(id);
        if (!result) return res.status(404).json({ message: 'Pago no encontrado' });
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorEstudiante = async (req, res, next) => {
    const { texto } = req.params;
    try {
        const result = await pagoService.getPagosByEstudiante(texto);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorConcepto = async (req, res, next) => {
    const { concepto } = req.params;
    try {
        const result = await pagoService.getPagosByConcepto(concepto);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorEstado = async (req, res, next) => {
    const { estado } = req.params;
    try {
        const result = await pagoService.getPagosByEstado(estado);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorGrado = async (req, res, next) => {
    const { grado } = req.params;
    try {
        const result = await pagoService.getPagosByGrado(grado);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorRangoFechas = async (req, res, next) => {
    const { inicio, fin } = req.query;
    try {
        if (!inicio || !fin) {
            return res.status(400).json({ message: 'Parámetros obligatorios: inicio y fin (YYYY-MM-DD)' });
        }
        const result = await pagoService.getPagosByRangoFechas(inicio, fin);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorRangoMonto = async (req, res, next) => {
    const { min, max } = req.query;
    try {
        if (min === undefined || max === undefined) {
            return res.status(400).json({ message: 'Parámetros obligatorios: min y max' });
        }
        const result = await pagoService.getPagosByRangoMonto(min, max);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const crear = async (req, res, next) => {
    try {
        const { estudianteId, monto, concepto, estado, fecha } = req.body;

        if (!estudianteId || monto === undefined || !concepto) {
            return res.status(400).json({ 
                message: 'Campos requeridos: estudianteId, monto, concepto' 
            });
        }

        const nuevoPago = await pagoService.postCrearPago(
            estudianteId, 
            monto, 
            concepto, 
            estado, 
            fecha
        );
        res.status(201).json(nuevoPago);
    } catch (err) {
        next(err);
    }
};

export const actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { estudianteId, monto, concepto, estado, fecha } = req.body;

        if (!estudianteId || monto === undefined || !concepto || !estado || !fecha) {
            return res.status(400).json({ 
                message: 'Todos los campos son requeridos para actualizar el pago: estudianteId, monto, concepto, estado, fecha' 
            });
        }

        const actualizado = await pagoService.actualizarPago(
            id, 
            estudianteId, 
            monto, 
            concepto, 
            estado, 
            fecha
        );

        if (!actualizado) return res.status(404).json({ message: 'Pago no encontrado' });

        res.status(200).json(actualizado);
    } catch (err) {
        next(err);
    }
};

export const eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pagoService.eliminarPago(id);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};