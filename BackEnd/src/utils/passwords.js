// utils/passwords.js
import bcrypt from 'bcryptjs';

const RONDAS = 10;

// ¿La contraseña guardada ya está cifrada con bcrypt?
export const esHash = (texto) => /^\$2[aby]\$\d{2}\$/.test(String(texto ?? ''));

export const hashear = (contrasena) => bcrypt.hash(String(contrasena), RONDAS);

// Compara contra un hash. Mientras existan contraseñas antiguas en texto plano
// también las acepta (el login las cifra automáticamente la primera vez).
export const verificar = async (contrasena, guardada) => {
    if (!guardada) return false;
    return esHash(guardada)
        ? bcrypt.compare(String(contrasena), guardada)
        : String(contrasena) === String(guardada);
};