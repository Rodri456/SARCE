import { pool } from '../db.js';

const BASE_SELECT = `
    SELECT
        e.id AS evento_id,
        e.nombre,
        e.tipo,
        to_char(e.fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio,
        to_char(e.fecha_fin, 'YYYY-MM-DD') AS fecha_fin,
        e.created_at AS fecha_registro
    FROM evento_calendario e
`;

export const getAllEventos = async () => {
    const result = await pool.query(`${BASE_SELECT} ORDER BY e.fecha_inicio ASC;`);
    return result.rows;
};

export const getEventoById = async (id) => {
    const result = await pool.query(`${BASE_SELECT} WHERE e.id = $1;`, [id]);
    return result.rows[0] || null;
};

export const getEventosByTexto = async (texto) => {
    const result = await pool.query(
        `${BASE_SELECT} WHERE e.nombre ILIKE $1 ORDER BY e.fecha_inicio ASC;`,
        [`%${texto}%`]
    );
    return result.rows;
};

export const getEventosByTipo = async (tipo) => {
    const result = await pool.query(
        `${BASE_SELECT} WHERE e.tipo ILIKE $1 ORDER BY e.fecha_inicio ASC;`,
        [`%${tipo}%`]
    );
    return result.rows;
};

// Eventos que se traslapan con el rango [inicio, fin]
export const getEventosByRangoFechas = async (inicio, fin) => {
    const result = await pool.query(
        `${BASE_SELECT}
         WHERE e.fecha_inicio <= $2 AND e.fecha_fin >= $1
         ORDER BY e.fecha_inicio ASC;`,
        [inicio, fin]
    );
    return result.rows;
};

export const postCrearEvento = async ({ nombre, tipo, fechaInicio, fechaFin }) => {
    const result = await pool.query(
        `INSERT INTO evento_calendario (nombre, tipo, fecha_inicio, fecha_fin)
         VALUES ($1, $2, $3, $4)
         RETURNING id;`,
        [nombre, tipo, fechaInicio, fechaFin]
    );
    return await getEventoById(result.rows[0].id);
};

export const actualizarEvento = async (id, { nombre, tipo, fechaInicio, fechaFin }) => {
    const result = await pool.query(
        `UPDATE evento_calendario
         SET nombre = $1, tipo = $2, fecha_inicio = $3, fecha_fin = $4
         WHERE id = $5
         RETURNING id;`,
        [nombre, tipo, fechaInicio, fechaFin, id]
    );
    if (result.rowCount === 0) return null;
    return await getEventoById(id);
};

export const eliminarEvento = async (id) => {
    const result = await pool.query(
        `DELETE FROM evento_calendario WHERE id = $1
         RETURNING id AS evento_id, nombre, tipo;`,
        [id]
    );
    return result.rows[0] || null;
};