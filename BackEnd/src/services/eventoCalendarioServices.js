import { pool } from '../db.js';

// Consulta base relacionando Evento con el Creador (Usuario) y opcionalmente con un Grado
const BASE_SELECT = `
    SELECT 
        e.id AS evento_id,
        e.titulo,
        e.descripcion,
        e.tipo,
        e.fecha_inicio,
        e.fecha_fin,
        e.lugar,
        e.created_at AS fecha_registro,
        -- Usuario Creador (Docente/Admin)
        u.id AS creador_id,
        u.nombre AS creador_nombre,
        u.correo AS creador_correo,
        -- Grado (opcional si el evento es específico de un salón)
        g.id AS grado_id,
        g.nombre AS grado_nombre
    FROM evento_calendario e
    LEFT JOIN usuario u ON e.creador_id = u.id
    LEFT JOIN grado g ON e.grado_id = g.id
`;

// Obtener todos los eventos
export const getAllEventos = async () => {
    const query = `${BASE_SELECT} ORDER BY e.fecha_inicio ASC;`;
    const result = await pool.query(query);
    return result.rows;
};

// Buscar por ID
export const getEventoById = async (id) => {
    const query = `${BASE_SELECT} WHERE e.id = $1;`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
};

// Buscar por Título o Descripción (Búsqueda flexible)
export const getEventosByTexto = async (texto) => {
    const buscar = `%${texto}%`;
    const query = `
        ${BASE_SELECT} 
        WHERE e.titulo ILIKE $1 OR e.descripcion ILIKE $1
        ORDER BY e.fecha_inicio ASC;
    `;
    const result = await pool.query(query, [buscar]);
    return result.rows;
};

// Buscar por Tipo de Evento (ej: 'examen', 'feriado', 'reunion', 'deportivo')
export const getEventosByTipo = async (tipo) => {
    const buscar = `%${tipo}%`;
    const query = `
        ${BASE_SELECT} 
        WHERE e.tipo ILIKE $1 
        ORDER BY e.fecha_inicio ASC;
    `;
    const result = await pool.query(query, [buscar]);
    return result.rows;
};

// Buscar por Lugar (ej: 'Auditorio', 'Cancha', 'Virtual')
export const getEventosByLugar = async (lugar) => {
    const buscar = `%${lugar}%`;
    const query = `
        ${BASE_SELECT} 
        WHERE e.lugar ILIKE $1 
        ORDER BY e.fecha_inicio ASC;
    `;
    const result = await pool.query(query, [buscar]);
    return result.rows;
};

// Buscar por Creador / Organizador
export const getEventosByCreador = async (texto) => {
    const buscar = `%${texto}%`;
    const query = `
        ${BASE_SELECT} 
        WHERE u.nombre ILIKE $1 OR u.correo ILIKE $1 
        ORDER BY e.fecha_inicio ASC;
    `;
    const result = await pool.query(query, [buscar]);
    return result.rows;
};

// Buscar por Grado
export const getEventosByGrado = async (grado) => {
    const buscar = `%${grado}%`;
    const query = `
        ${BASE_SELECT} 
        WHERE g.nombre ILIKE $1 
        ORDER BY e.fecha_inicio ASC;
    `;
    const result = await pool.query(query, [buscar]);
    return result.rows;
};

// Buscar Eventos en un Rango de Fechas (YYYY-MM-DD)
export const getEventosByRangoFechas = async (fechaInicio, fechaFin) => {
    const query = `
        ${BASE_SELECT} 
        WHERE DATE(e.fecha_inicio) >= $1 AND DATE(e.fecha_fin) <= $2 
        ORDER BY e.fecha_inicio ASC;
    `;
    const result = await pool.query(query, [fechaInicio, fechaFin]);
    return result.rows;
};

// Crear Evento
export const postCrearEvento = async (titulo, descripcion, tipo, fechaInicio, fechaFin, lugar, creadorId, gradoId = null) => {
    const query = `
        INSERT INTO evento_calendario (titulo, descripcion, tipo, fecha_inicio, fecha_fin, lugar, creador_id, grado_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id;
    `;
    const values = [titulo, descripcion, tipo, fechaInicio, fechaFin, lugar, creadorId, gradoId];
    const result = await pool.query(query, values);
    return await getEventoById(result.rows[0].id);
};

// Actualizar Evento
export const actualizarEvento = async (id, titulo, descripcion, tipo, fechaInicio, fechaFin, lugar, creadorId, gradoId) => {
    const query = `
        UPDATE evento_calendario
        SET titulo = $1,
            descripcion = $2,
            tipo = $3,
            fecha_inicio = $4,
            fecha_fin = $5,
            lugar = $6,
            creador_id = $7,
            grado_id = $8
        WHERE id = $9
        RETURNING id;
    `;
    const values = [titulo, descripcion, tipo, fechaInicio, fechaFin, lugar, creadorId, gradoId, id];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) return null;
    return await getEventoById(id);
};

// Eliminar Evento
export const eliminarEvento = async (id) => {
    const query = `DELETE FROM evento_calendario WHERE id = $1 RETURNING *;`;
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
        const error = new Error('Evento no encontrado');
        error.statusCode = 404;
        throw error;
    }

    return { message: 'Evento eliminado exitosamente', evento: result.rows[0] };
};