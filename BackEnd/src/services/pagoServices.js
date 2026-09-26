import { pool } from '../db.js';

// Consulta base uniendo Pago con Estudiante, Usuario y Grado
const BASE_SELECT = `
    SELECT 
        p.id AS pago_id,
        p.monto,
        p.concepto,
        p.estado,
        p.fecha,
        p.created_at AS fecha_registro,
        -- Datos del Estudiante
        u.id AS estudiante_id,
        u.nombre AS estudiante_nombre,
        u.correo AS estudiante_correo,
        -- Datos del Grado
        g.id AS grado_id,
        g.nombre AS grado_nombre
    FROM pago p
    INNER JOIN estudiante e ON p.estudiante_id = e.usuario_id
    INNER JOIN usuario u ON e.usuario_id = u.id
    INNER JOIN grado g ON e.grado_id = g.id
`;

// Obtener todos los pagos
export const getAllPagos = async () => {
    const query = `${BASE_SELECT} ORDER BY p.id DESC;`;
    const result = await pool.query(query);
    return result.rows;
};

// Buscar por ID exacto
export const getPagoById = async (id) => {
    const query = `${BASE_SELECT} WHERE p.id = $1;`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
};

// Buscar por Estudiante (Búsqueda flexible por nombre o correo)
export const getPagosByEstudiante = async (texto) => {
    const buscar = `%${texto}%`;
    const query = `
        ${BASE_SELECT} 
        WHERE u.nombre ILIKE $1 OR u.correo ILIKE $1
        ORDER BY p.id DESC;
    `;
    const result = await pool.query(query, [buscar]);
    return result.rows;
};

// Buscar por Concepto
export const getPagosByConcepto = async (concepto) => {
    const buscar = `%${concepto}%`;
    const query = `
        ${BASE_SELECT} 
        WHERE p.concepto ILIKE $1 
        ORDER BY p.id DESC;
    `;
    const result = await pool.query(query, [buscar]);
    return result.rows;
};

// Buscar por Estado
export const getPagosByEstado = async (estado) => {
    const buscar = `%${estado}%`;
    const query = `
        ${BASE_SELECT} 
        WHERE p.estado::text ILIKE $1 
        ORDER BY p.id DESC;
    `;
    const result = await pool.query(query, [buscar]);
    return result.rows;
};

// Buscar por Grado del estudiante
export const getPagosByGrado = async (grado) => {
    const buscar = `%${grado}%`;
    const query = `
        ${BASE_SELECT} 
        WHERE g.nombre ILIKE $1 
        ORDER BY p.id DESC;
    `;
    const result = await pool.query(query, [buscar]);
    return result.rows;
};

// Buscar por Rango de Fechas (YYYY-MM-DD)
export const getPagosByRangoFechas = async (fechaInicio, fechaFin) => {
    const query = `
        ${BASE_SELECT} 
        WHERE p.fecha BETWEEN $1 AND $2 
        ORDER BY p.fecha DESC;
    `;
    const result = await pool.query(query, [fechaInicio, fechaFin]);
    return result.rows;
};

// Buscar por Rango de Montos
export const getPagosByRangoMonto = async (min, max) => {
    const query = `
        ${BASE_SELECT} 
        WHERE p.monto BETWEEN $1 AND $2 
        ORDER BY p.monto DESC;
    `;
    const result = await pool.query(query, [min, max]);
    return result.rows;
};

// Crear Pago
export const postCrearPago = async (estudianteId, monto, concepto, estado = 'pendiente', fecha = new Date()) => {
    const query = `
        INSERT INTO pago (estudiante_id, monto, concepto, estado, fecha)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
    `;
    const values = [estudianteId, monto, concepto, estado, fecha];
    const result = await pool.query(query, values);
    return await getPagoById(result.rows[0].id);
};

// Actualizar Pago
export const actualizarPago = async (id, estudianteId, monto, concepto, estado, fecha) => {
    const query = `
        UPDATE pago
        SET estudiante_id = $1,
            monto = $2,
            concepto = $3,
            estado = $4,
            fecha = $5
        WHERE id = $6
        RETURNING id;
    `;
    const values = [estudianteId, monto, concepto, estado, fecha, id];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) return null;
    return await getPagoById(id);
};

// Eliminar Pago
export const eliminarPago = async (id) => {
    const query = `DELETE FROM pago WHERE id = $1 RETURNING *;`;
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
        const error = new Error('Pago no encontrado');
        error.statusCode = 404;
        throw error;
    }

    return { message: 'Pago eliminado exitosamente', pago: result.rows[0] };
};