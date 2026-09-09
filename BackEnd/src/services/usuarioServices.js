import {pool} from '../db.js'

//todos los usuarios
export const getAllUsuarios = async (req, res) => {
    try{
    const result = await pool.query('SELECT * FROM usuario');
    res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message});
    }
};

//buscar por correo
export const getUsuarioByCorreo = async (req,res) => {
    const { correo } = req.params;
    try {
        const result = await pool.query('SELECT * FROM usuario WHERE correo = $1', [correo]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message});
    }
};

//buscar por nombre
export const getBuscarNombre = async (nombre) => {
    const buscar = `%${nombre}%`
    const result = await pool.query(
        'SELECT * FROM usuario WHERE nombre ILIKE $1', [buscar]
    );
    return result.rows;
};

//por Rol
export const getUsuariosByRol = async (req, res) => {
    const { rol } = req.params;
    try {
        const result = await pool.query('SELECT * FROM usuario WHERE rol = $1', [rol]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

//crear usuario
export const postCrearUsuario = async (nombre, correo, contrasena,rol) =>{
    try{
        const query = `INSERT INTO usuario (nombre, correo, contrasena, rol) VALUES ($1, $2, $3, $4) RETURNING *`;

        const result = await pool.query(query, [nombre, correo, contrasena, rol]);

        return result.rows[0];
    } catch (err) {
        throw new Error(err.message);
    }
};

//actualizar usuario
export const actualizarUsuario = async (id, datosUsuario) => {
    const { nombre, correo, contrasena, rol } = datosUsuario;

    const query = `
        UPDATE usuario 
        SET nombre = $1, 
            correo = $2, 
            contrasena = $3, 
            rol = $4,
            updated_at = NOW()
        WHERE id = $5 
        RETURNING *;
    `;

    const values = [nombre, correo, contrasena, rol, id];
    const result = await pool.query(query, values);

    return result.rows[0] || null;
};

export const eliminarUsuario = async (id) => {
    try {
        const usuarioAEliminar = await pool.query('SELECT * FROM usuario WHERE id = $1', [id]);

        if (usuarioAEliminar.rowCount === 0) throw new Error('Usuario no encontrado');

        const result = await pool.query('DELETE FROM usuario WHERE id = $1 RETURNING *', [id]);

        return {message: 'Usuario eliminado exitosamente', usuario: usuarioAEliminar.rows[0]};
    } catch (err) {
        throw new Error(err.message);
    }
};