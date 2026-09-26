import { pool } from '../db.js';

// Obtener todos los docentes con sus datos de usuario
export const getAllDocentes = async () => {
    const query = `
        SELECT 
            u.id AS docente_id, 
            u.nombre, 
            u.correo, 
            u.rol, 
            d.created_at AS docente_desde
        FROM docente d
        INNER JOIN usuario u ON d.usuario_id = u.id
        ORDER BY u.id ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

// Buscar docente por ID (usuario_id)
export const getDocenteById = async (id) => {
    const query = `
        SELECT 
            u.id AS docente_id, 
            u.nombre, 
            u.correo, 
            u.rol, 
            d.created_at AS docente_desde
        FROM docente d
        INNER JOIN usuario u ON d.usuario_id = u.id
        WHERE d.usuario_id = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
};

// Buscar docente por Correo
export const getDocenteByCorreo = async (correo) => {
    const query = `
        SELECT 
            u.id AS docente_id, 
            u.nombre, 
            u.correo, 
            u.rol, 
            d.created_at AS docente_desde
        FROM docente d
        INNER JOIN usuario u ON d.usuario_id = u.id
        WHERE u.correo = $1;
    `;
    const result = await pool.query(query, [correo]);
    return result.rows[0] || null;
};

// Buscar docentes por Nombre (coincidencia parcial)
export const getDocentesByNombre = async (nombre) => {
    const buscar = `%${nombre}%`;
    const query = `
        SELECT 
            u.id AS docente_id, 
            u.nombre, 
            u.correo, 
            u.rol, 
            d.created_at AS docente_desde
        FROM docente d
        INNER JOIN usuario u ON d.usuario_id = u.id
        WHERE u.nombre ILIKE $1
        ORDER BY u.id ASC;
    `;
    const result = await pool.query(query, [buscar]);
    return result.rows;
};

// Buscar docentes por fecha
export const getDocentesByFecha = async (fecha) => {
    const query = `
        SELECT 
            u.id AS docente_id, 
            u.nombre, 
            u.correo, 
            u.rol, 
            d.created_at AS docente_desde
        FROM docente d
        INNER JOIN usuario u ON d.usuario_id = u.id
        WHERE DATE(d.created_at) = $1
        ORDER BY u.id ASC;
    `;
    const result = await pool.query(query, [fecha]);
    return result.rows;
};

// Crear docente
export const postCrearDocente = async (nombre, correo, contrasena) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Insertar en la tabla usuario asegurando el rol 'docente'
        const queryUsuario = `
            INSERT INTO usuario (nombre, correo, contrasena, rol) 
            VALUES ($1, $2, $3, 'docente') 
            RETURNING id, nombre, correo, rol, created_at;
        `;
        const resUsuario = await client.query(queryUsuario, [nombre, correo, contrasena]);
        const nuevoUsuario = resUsuario.rows[0];

        // 2. Insertar en la tabla docente
        const queryDocente = `
            INSERT INTO docente (usuario_id) 
            VALUES ($1)
            RETURNING created_at;
        `;
        const resDocente = await client.query(queryDocente, [nuevoUsuario.id]);

        await client.query('COMMIT');

        return {
            docente_id: nuevoUsuario.id,
            nombre: nuevoUsuario.nombre,
            correo: nuevoUsuario.correo,
            rol: nuevoUsuario.rol,
            docente_desde: resDocente.rows[0].created_at
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// Actualizar docente
// En src/services/docenteServices.js
export const actualizarDocente = async (id, nombre, correo, contrasena) => {
    const query = `
        UPDATE usuario 
        SET nombre = $1, 
            correo = $2, 
            contrasena = $3, 
            updated_at = NOW()
        WHERE id = $4 AND rol = 'docente'
        RETURNING id AS docente_id, nombre, correo, rol, updated_at;
    `;

    const values = [nombre, correo, contrasena, id];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
};

// Eliminar docente (Maneja borrado en ambas tablas vía transacción)
export const eliminarDocente = async (id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Eliminar primero de la tabla docente por la FK
        await client.query(`DELETE FROM docente WHERE usuario_id = $1;`, [id]);

        // 2. Eliminar de la tabla usuario
        const resUsuario = await client.query(
            `DELETE FROM usuario WHERE id = $1 AND rol = 'docente' RETURNING id, nombre, correo;`,
            [id]
        );

        if (resUsuario.rowCount === 0) {
            await client.query('ROLLBACK');
            const error = new Error('Docente no encontrado');
            error.statusCode = 404;
            throw error;
        }

        await client.query('COMMIT');
        return { message: 'Docente eliminado exitosamente', docente: resUsuario.rows[0] };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};