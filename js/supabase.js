import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const DIAS_SEMANA = [
    { numero: 0, nombre: 'Domingo', abrev: 'Dom' },
    { numero: 1, nombre: 'Lunes', abrev: 'Lun' },
    { numero: 2, nombre: 'Martes', abrev: 'Mar' },
    { numero: 3, nombre: 'Miércoles', abrev: 'Mié' },
    { numero: 4, nombre: 'Jueves', abrev: 'Jue' },
    { numero: 5, nombre: 'Viernes', abrev: 'Vie' },
    { numero: 6, nombre: 'Sábado', abrev: 'Sáb' }
];

export function getFechaSemanaActual() {
    const hoy = new Date();
    const diaSemana = hoy.getDay();
    const diff = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
    const lunes = new Date(hoy.setDate(diff));
    return lunes.toISOString().split('T')[0];
}

export function formatearFecha(fecha) {
    const date = new Date(fecha);
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

export function formatearNombreSemana(fechaInicio) {
    const date = new Date(fechaInicio);
    const dia = date.getDate();
    const mes = date.toLocaleDateString('es-ES', { month: 'long' });
    return `${dia} ${mes.charAt(0).toUpperCase() + mes.slice(1)}`;
}