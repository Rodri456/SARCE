import {Router} from 'express';

import {getAllUsuarios,getUsuarioByCorreo,getBuscarNombre,getUsuariosByRol,postCrearUsuario,actualizarUsuario,eliminarUsuario} from '../services/usuarioServices.js'

const router = Router();

router.get('/', getAllUsuarios);

router.get('/buscarPorCorreo/:correo', getUsuarioByCorreo);

router.get('/buscarPorNombre/:nombre', async (req, res) => {
    const { nombre } = req.params;
    try{
        const allUsuariosByName = await getBuscarNombre(nombre);
        res.json(allUsuariosByName);
    } catch (err) {
        res.status(500).json({ error: err.message});
    }
});

router.get('/buscarPorRol/:rol', getUsuariosByRol);

router.post('/', async (req, res) => {
    try {
        const { nombre, correo, contrasena, rol } = req.body;

        const newUsuario = await postCrearUsuario(nombre, correo, contrasena, rol);

        res.status(201).json(newUsuario);
    }   catch (err) {  
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, correo, contrasena, rol } = req.body;

        const updatedUsuario = await actualizarUsuario(id, { 
            nombre, 
            correo, 
            contrasena, 
            rol 
        });

        if (!updatedUsuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        return res.status(200).json(updatedUsuario);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await eliminarUsuario(id);

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;