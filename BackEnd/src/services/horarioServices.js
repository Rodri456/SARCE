import { pool } from '../db.js';

// Estructura de consulta haciendo JOIN directo con grado, materia y docente
const BASE_SELECT = `
    SELECT 
        h.id AS horario_id,
        h.dia_semana,
        h.hora_inicio,
        h.hora_fin,
        h.created_at AS fecha_registro,
        g.id AS grado_id,
        g.nombre AS grado_nombre,
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        u.id AS docente_id,
        u.nombre AS docente_nombre
    FROM horario h
    INNER JOIN grado g ON h.grado_id = g.id
    INNER JOIN materia m ON h.materia_id = m.id
    INNER JOIN docente d ON h.docente_id = d.usuario_id
    INNER JOIN usuario u ON d.usuario_id = u.id
`;

// Obtener todos los horarios
export const getAllHorarios = async () => {
    const query = `${BASE_SELECT} ORDER BY h.dia_semana, h.hora_inicio ASC;`;
    const result = await pool.query(query);
    return result.rows;
};

// Buscar horario por ID
export const getHorarioById = async (id) => {
    const query = `${BASE_SELECT} WHERE h.id = $1;`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
};

// Buscar por Grado ID
export const getHorariosByGrado = async (gradoId) => {
    const query = `${BASE_SELECT} WHERE h.grado_id = $1 ORDER BY h.dia_semana, h.hora_inicio ASC;`;
    const result = await pool.query(query, [gradoId]);
    return result.rows;
};

// Buscar por Materia ID
export const getHorariosByMateria = async (materiaId) => {
    const query = `${BASE_SELECT} WHERE h.materia_id = $1 ORDER BY h.dia_semana, h.hora_inicio ASC;`;
    const result = await pool.query(query, [materiaId]);
    return result.rows;
};

// Buscar por Docente ID (usuario_id)
export const getHorariosByDocente = async (docenteId) => {
    const query = `${BASE_SELECT} WHERE h.docente_id = $1 ORDER BY h.dia_semana, h.hora_inicio ASC;`;
    const result = await pool.query(query, [docenteId]);
    return result.rows;
};

// Buscar por Día de la semana
export const getHorariosByDiaSemana = async (dia) => {
    const query = `${BASE_SELECT} WHERE LOWER(h.dia_semana::text) = LOWER($1) ORDER BY h.hora_inicio ASC;`;
    const result = await pool.query(query, [dia.trim()]);
    return result.rows;
};

// Buscar por Hora de Inicio
export const getHorariosByHoraInicio = async (horaInicio) => {
    const query = `${BASE_SELECT} WHERE h.hora_inicio = $1 ORDER BY h.dia_semana ASC;`;
    const result = await pool.query(query, [horaInicio]);
    return result.rows;
};

// Buscar por Hora de Fin
export const getHorariosByHoraFin = async (horaFin) => {
    const query = `${BASE_SELECT} WHERE h.hora_fin = $1 ORDER BY h.dia_semana ASC;`;
    const result = await pool.query(query, [horaFin]);
    return result.rows;
};

// Crear Horario
export const postCrearHorario = async (gradoId, materiaId, docenteId, diaSemana, horaInicio, horaFin) => {
    const query = `
        INSERT INTO horario (grado_id, materia_id, docente_id, dia_semana, hora_inicio, hora_fin)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id;
    `;
    const values = [gradoId, materiaId, docenteId, diaSemana, horaInicio, horaFin];
    const result = await pool.query(query, values);
    return await getHorarioById(result.rows[0].id);
};

// Actualizar Horario
export const actualizarHorario = async (id, gradoId, materiaId, docenteId, diaSemana, horaInicio, horaFin) => {
    const query = `
        UPDATE horario
        SET grado_id = $1,
            materia_id = $2,
            docente_id = $3,
            dia_semana = $4,
            hora_inicio = $5,
            hora_fin = $6
        WHERE id = $7
        RETURNING id;
    `;
    const values = [gradoId, materiaId, docenteId, diaSemana, horaInicio, horaFin, id];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) return null;
    return await getHorarioById(id);
};

// Eliminar Horario
export const eliminarHorario = async (id) => {
    const query = `DELETE FROM horario WHERE id = $1 RETURNING *;`;
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
        const error = new Error('Horario no encontrado');
        error.statusCode = 404;
        throw error;
    }

    return { message: 'Horario eliminado exitosamente', horario: result.rows[0] };
};