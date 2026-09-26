import { pool } from '../db.js';

// Obtener todos los estudiantes con datos de usuario y grado
export const getAllEstudiantes = async () => {
    const query = `
        SELECT 
            u.id AS estudiante_id,
            u.nombre,
            u.correo,
            u.rol,
            e.estado_perfil,
            g.id AS grado_id,
            g.nombre AS grado,
            e.created_at AS estudiante_desde
        FROM estudiante e
        INNER JOIN usuario u ON e.usuario_id = u.id
        INNER JOIN grado g ON e.grado_id = g.id
        ORDER BY u.id ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

// Buscar estudiante por ID (usuario_id)
export const getEstudianteById = async (id) => {
    const query = `
        SELECT 
            u.id AS estudiante_id,
            u.nombre,
            u.correo,
            u.rol,
            e.estado_perfil,
            g.id AS grado_id,
            g.nombre AS grado,
            e.created_at AS estudiante_desde
        FROM estudiante e
        INNER JOIN usuario u ON e.usuario_id = u.id
        INNER JOIN grado g ON e.grado_id = g.id
        WHERE e.usuario_id = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
};

// Buscar estudiante por Correo
export const getEstudianteByCorreo = async (correo) => {
    const query = `
        SELECT 
            u.id AS estudiante_id,
            u.nombre,
            u.correo,
            u.rol,
            e.estado_perfil,
            g.id AS grado_id,
            g.nombre AS grado,
            e.created_at AS estudiante_desde
        FROM estudiante e
        INNER JOIN usuario u ON e.usuario_id = u.id
        INNER JOIN grado g ON e.grado_id = g.id
        WHERE u.correo = $1;
    `;
    const result = await pool.query(query, [correo]);
    return result.rows[0] || null;
};

// Buscar estudiantes por Nombre (coincidencia parcial)
export const getEstudiantesByNombre = async (nombre) => {
    const buscar = `%${nombre}%`;
    const query = `
        SELECT 
            u.id AS estudiante_id,
            u.nombre,
            u.correo,
            u.rol,
            e.estado_perfil,
            g.id AS grado_id,
            g.nombre AS grado,
            e.created_at AS estudiante_desde
        FROM estudiante e
        INNER JOIN usuario u ON e.usuario_id = u.id
        INNER JOIN grado g ON e.grado_id = g.id
        WHERE u.nombre ILIKE $1
        ORDER BY u.id ASC;
    `;
    const result = await pool.query(query, [buscar]);
    return result.rows;
};

// Buscar estudiantes por Grado ID
export const getEstudiantesByGradoId = async (gradoId) => {
    const query = `
        SELECT 
            u.id AS estudiante_id,
            u.nombre,
            u.correo,
            u.rol,
            e.estado_perfil,
            g.id AS grado_id,
            g.nombre AS grado,
            e.created_at AS estudiante_desde
        FROM estudiante e
        INNER JOIN usuario u ON e.usuario_id = u.id
        INNER JOIN grado g ON e.grado_id = g.id
        WHERE e.grado_id = $1
        ORDER BY u.id ASC;
    `;
    const result = await pool.query(query, [gradoId]);
    return result.rows;
};

// Buscar estudiantes por Estado de Perfil ('activo', 'inactivo', 'retirado')
export const getEstudiantesByEstadoPerfil = async (estadoPerfil) => {
    const query = `
        SELECT 
            u.id AS estudiante_id,
            u.nombre,
            u.correo,
            u.rol,
            e.estado_perfil,
            g.id AS grado_id,
            g.nombre AS grado,
            e.created_at AS estudiante_desde
        FROM estudiante e
        INNER JOIN usuario u ON e.usuario_id = u.id
        INNER JOIN grado g ON e.grado_id = g.id
        WHERE e.estado_perfil = $1
        ORDER BY u.id ASC;
    `;
    const result = await pool.query(query, [estadoPerfil]);
    return result.rows;
};

// Buscar estudiantes por Fecha de creación (YYYY-MM-DD)
export const getEstudiantesByFecha = async (fecha) => {
    const query = `
        SELECT 
            u.id AS estudiante_id,
            u.nombre,
            u.correo,
            u.rol,
            e.estado_perfil,
            g.id AS grado_id,
            g.nombre AS grado,
            e.created_at AS estudiante_desde
        FROM estudiante e
        INNER JOIN usuario u ON e.usuario_id = u.id
        INNER JOIN grado g ON e.grado_id = g.id
        WHERE DATE(e.created_at) = $1
        ORDER BY u.id ASC;
    `;
    const result = await pool.query(query, [fecha]);
    return result.rows;
};

// Crear Estudiante (Transacción SQL)
export const postCrearEstudiante = async (nombre, correo, contrasena, gradoId, estadoPerfil = 'activo') => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Insertar en tabla usuario
        const queryUsuario = `
            INSERT INTO usuario (nombre, correo, contrasena, rol)
            VALUES ($1, $2, $3, 'estudiante')
            RETURNING id, nombre, correo, rol;
        `;
        const resUsuario = await client.query(queryUsuario, [nombre, correo, contrasena]);
        const nuevoUsuario = resUsuario.rows[0];

        // 2. Insertar en tabla estudiante
        const queryEstudiante = `
            INSERT INTO estudiante (usuario_id, grado_id, estado_perfil)
            VALUES ($1, $2, $3)
            RETURNING usuario_id, grado_id, estado_perfil, created_at;
        `;
        const resEstudiante = await client.query(queryEstudiante, [nuevoUsuario.id, gradoId, estadoPerfil]);
        const nuevoEstudiante = resEstudiante.rows[0];

        await client.query('COMMIT');

        return {
            estudiante_id: nuevoUsuario.id,
            nombre: nuevoUsuario.nombre,
            correo: nuevoUsuario.correo,
            rol: nuevoUsuario.rol,
            grado_id: nuevoEstudiante.grado_id,
            estado_perfil: nuevoEstudiante.estado_perfil,
            created_at: nuevoEstudiante.created_at
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// Actualizar Estudiante
export const actualizarEstudiante = async (id, nombre, correo, contrasena, gradoId, estadoPerfil) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Actualizar usuario
        const queryUsuario = `
            UPDATE usuario 
            SET nombre = $1, 
                correo = $2, 
                contrasena = $3, 
                updated_at = NOW()
            WHERE id = $4 AND rol = 'estudiante'
            RETURNING id;
        `;
        const resUsuario = await client.query(queryUsuario, [nombre, correo, contrasena, id]);

        if (resUsuario.rowCount === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        // 2. Actualizar estudiante
        const queryEstudiante = `
            UPDATE estudiante
            SET grado_id = $1,
                estado_perfil = $2
            WHERE usuario_id = $3
            RETURNING usuario_id, grado_id, estado_perfil;
        `;
        await client.query(queryEstudiante, [gradoId, estadoPerfil, id]);

        await client.query('COMMIT');

        return await getEstudianteById(id);
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// Eliminar Estudiante (Transacción SQL para evitar error de FK)
export const eliminarEstudiante = async (id) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Eliminar primero de la tabla estudiante
        await client.query(`DELETE FROM estudiante WHERE usuario_id = $1;`, [id]);

        // 2. Eliminar de la tabla usuario
        const resUsuario = await client.query(
            `DELETE FROM usuario WHERE id = $1 AND rol = 'estudiante' RETURNING id, nombre, correo;`,
            [id]
        );

        if (resUsuario.rowCount === 0) {
            await client.query('ROLLBACK');
            const error = new Error('Estudiante no encontrado');
            error.statusCode = 404;
            throw error;
        }

        await client.query('COMMIT');

        return { 
            message: 'Estudiante eliminado exitosamente', 
            estudiante: resUsuario.rows[0] 
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};