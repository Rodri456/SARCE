// middlewares/auth.js
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

// ============================================================
// Configuración (variables de .env)
//   JWT_SECRET      → obligatoria, mínimo 16 caracteres
//   JWT_EXPIRES_IN  → opcional, por defecto 8h
//   ROLES_ADMIN     → opcional, roles con acceso total (por defecto: admin)
// ============================================================
export const ROLES_ADMIN = (process.env.ROLES_ADMIN || 'admin')
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);

const EXPIRACION = process.env.JWT_EXPIRES_IN || '8h';

function secreto() {
    const valor = process.env.JWT_SECRET;
    if (!valor || valor.length < 16) {
        throw new Error('Falta JWT_SECRET (mínimo 16 caracteres) en el archivo .env');
    }
    return valor;
}
secreto(); // el servidor no arranca si falta

export const firmarToken = (usuario) =>
    jwt.sign({ id: usuario.id, rol: usuario.rol }, secreto(), { expiresIn: EXPIRACION });

// ============================================================
// Utilidades
// ============================================================
const limpiar = (ruta) => ruta.replace(/\/+$/, '') || '/';
const mismo = (a, b) => String(a) === String(b);
const esId = (v) => /^\d+$/.test(String(v ?? ''));
const existe = async (sql, params) => (await pool.query(sql, params)).rowCount > 0;

// Rutas que no requieren token
const PUBLICAS = [{ metodo: 'POST', ruta: /^\/usuarios\/login$/ }];

// ============================================================
// 1) AUTENTICAR: ¿quién eres?
// ============================================================
export const autenticar = async (req, res, next) => {
    const ruta = limpiar(req.path);

    if (PUBLICAS.some((p) => p.metodo === req.method && p.ruta.test(ruta))) {
        req.publica = true;
        return next();
    }

    const [tipo, token] = (req.headers.authorization || '').split(' ');
    if (tipo !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Debes iniciar sesión' });
    }

    try {
        req.usuario = jwt.verify(token, secreto());
    } catch {
        return res.status(401).json({ message: 'Tu sesión expiró. Inicia sesión de nuevo' });
    }

    // Un estudiante desactivado pierde el acceso aunque su token siga vigente
    if (req.usuario.rol === 'estudiante') {
        try {
            const activo = await existe(
                "SELECT 1 FROM estudiante WHERE usuario_id = $1 AND estado_perfil::text = 'activo'",
                [req.usuario.id]
            );
            if (!activo) {
                return res.status(403).json({ message: 'Tu perfil está desactivado. Contacta a secretaría académica.' });
            }
        } catch (err) {
            return next(err);
        }
    }

    next();
};

// ============================================================
// 2) AUTORIZAR: ¿qué puedes hacer?
//
// Cada regla indica método + ruta + roles permitidos.
//   propioPara → roles que solo pueden acceder a SU propio id (primer grupo de la ruta)
//   verificar  → comprobación extra contra la base de datos (no se aplica a admin)
// Todo lo que NO aparezca aquí queda reservado a los roles de ROLES_ADMIN.
// ============================================================
const TODOS = ['estudiante', 'docente', ...ROLES_ADMIN];
const SOLO_DOCENTE = ['docente', ...ROLES_ADMIN];
const SOLO_ESTUDIANTE = ['estudiante', ...ROLES_ADMIN];

// --- Comprobaciones específicas ---
const pagoPropio = async (req, id) => {
    const { rows } = await pool.query('SELECT estudiante_id, monto, concepto FROM pago WHERE id = $1', [id]);
    const pago = rows[0];
    const b = req.body || {};
    return (
        !!pago &&
        mismo(pago.estudiante_id, req.usuario.id) &&
        mismo(b.estudianteId, req.usuario.id) &&
        Number(b.monto) === Number(pago.monto) &&
        b.concepto === pago.concepto
    );
};

const docenteImparteGrado = (req, gradoId) =>
    existe('SELECT 1 FROM asignacion WHERE docente_id = $1 AND grado_id = $2 LIMIT 1', [req.usuario.id, gradoId]);

const calificacionDelDocente = async (req, id) => {
    const b = req.body || {};
    if (!mismo(b.docenteId, req.usuario.id) || !esId(b.materiaId) || !esId(b.estudianteId)) return false;

    // Al modificar, la calificación debe ser suya
    if (id && !(await existe('SELECT 1 FROM calificacion WHERE id = $1 AND docente_id = $2', [id, req.usuario.id]))) {
        return false;
    }

    // Debe impartir esa materia al grado de ese estudiante
    return existe(
        `SELECT 1
         FROM asignacion a
         INNER JOIN estudiante e ON e.grado_id = a.grado_id
         WHERE a.docente_id = $1 AND a.materia_id = $2 AND e.usuario_id = $3
         LIMIT 1`,
        [req.usuario.id, b.materiaId, b.estudianteId]
    );
};

const estadoPermitidoAlDocente = async (req, estudianteId) => {
    // "retirado" lo gestiona secretaría
    if (!['activo', 'inactivo'].includes(req.body?.estadoPerfil)) return false;
    return existe(
        `SELECT 1
         FROM asignacion a
         INNER JOIN estudiante e ON e.grado_id = a.grado_id
         WHERE a.docente_id = $1 AND e.usuario_id = $2
         LIMIT 1`,
        [req.usuario.id, estudianteId]
    );
};

const reglas = [
    // ---------- Estudiante ----------
    { metodo: 'GET', ruta: /^\/estudiantes\/(\d+)$/, roles: TODOS, propioPara: ['estudiante'] },
    { metodo: 'GET', ruta: /^\/calificaciones\/estudiante\/(\d+)$/, roles: TODOS, propioPara: ['estudiante'] },
    { metodo: 'GET', ruta: /^\/pagos\/estudiante\/(\d+)$/, roles: SOLO_ESTUDIANTE, propioPara: ['estudiante'] },
    { metodo: 'PUT', ruta: /^\/pagos\/(\d+)$/, roles: SOLO_ESTUDIANTE, verificar: pagoPropio },
    { metodo: 'GET', ruta: /^\/horarios\/buscarPorGrado\/(\d+)$/, roles: TODOS },
    { metodo: 'GET', ruta: /^\/eventos-calendario$/, roles: TODOS },

    // ---------- Docente ----------
    { metodo: 'GET', ruta: /^\/asignaciones\/docente\/(\d+)$/, roles: SOLO_DOCENTE, propioPara: ['docente'] },
    { metodo: 'GET', ruta: /^\/calificaciones\/docente\/(\d+)$/, roles: SOLO_DOCENTE, propioPara: ['docente'] },
    { metodo: 'GET', ruta: /^\/estudiantes\/buscarPorGrado\/(\d+)$/, roles: SOLO_DOCENTE, verificar: docenteImparteGrado },
    { metodo: 'POST', ruta: /^\/calificaciones$/, roles: SOLO_DOCENTE, verificar: calificacionDelDocente },
    { metodo: 'PUT', ruta: /^\/calificaciones\/(\d+)$/, roles: SOLO_DOCENTE, verificar: calificacionDelDocente },
    { metodo: 'PATCH', ruta: /^\/estudiantes\/(\d+)\/estado$/, roles: SOLO_DOCENTE, verificar: estadoPermitidoAlDocente }
];

export const autorizar = async (req, res, next) => {
    if (req.publica) return next();

    try {
        const ruta = limpiar(req.path);
        const rol = req.usuario.rol;
        const esAdmin = ROLES_ADMIN.includes(rol);

        let regla = null;
        let grupos = null;
        for (const r of reglas) {
            if (r.metodo !== req.method) continue;
            const coincidencia = r.ruta.exec(ruta);
            if (coincidencia) {
                regla = r;
                grupos = coincidencia;
                break;
            }
        }

        // Sin regla: solo administradores
        if (!regla) {
            return esAdmin
                ? next()
                : res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
        }

        if (!regla.roles.includes(rol)) {
            return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
        }

        if (regla.propioPara?.includes(rol) && !mismo(grupos[1], req.usuario.id)) {
            return res.status(403).json({ message: 'Solo puedes consultar tu propia información' });
        }

        if (regla.verificar && !esAdmin && !(await regla.verificar(req, grupos[1]))) {
            return res.status(403).json({ message: 'No tienes permiso sobre este recurso' });
        }

        next();
    } catch (err) {
        next(err);
    }
};

// Uso en index.js:  app.use(proteger);
export const proteger = [autenticar, autorizar];