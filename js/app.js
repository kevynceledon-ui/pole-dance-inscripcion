import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const DIAS_SEMANA = [
    { numero: 0, nombre: 'Domingo', abrev: 'Dom' },
    { numero: 1, nombre: 'Lunes', abrev: 'Lun' },
    { numero: 2, nombre: 'Martes', abrev: 'Mar' },
    { numero: 3, nombre: 'Miércoles', abrev: 'Mié' },
    { numero: 4, nombre: 'Jueves', abrev: 'Jue' },
    { numero: 5, nombre: 'Viernes', abrev: 'Vie' },
    { numero: 6, nombre: 'Sábado', abrev: 'Sáb' }
];

let alumnaData = { nombre: '', telefono: '' };
let semanaActual = null;
let clasesSemana = [];
let inscripcionesExistentes = [];

document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    initTheme();
    cargarSemanaActual();
    await cargarDatosSemana();
    
    document.getElementById('alumna-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('guardar-btn').addEventListener('click', guardarInscripciones);
    document.getElementById('nueva-inscripcion-btn').addEventListener('click', resetForm);
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

function getFechaSemanaActual() {
    const hoy = new Date();
    const diaSemana = hoy.getDay();
    const diff = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
    const lunes = new Date(hoy);
    lunes.setDate(diff);
    return lunes.toISOString().split('T')[0];
}

function cargarSemanaActual() {
    const fecha = getFechaSemanaActual();
    const date = new Date(fecha);
    const dia = date.getDate();
    const mes = date.toLocaleDateString('es-ES', { month: 'long' });
    document.getElementById('semana-nombre').textContent = `${dia} ${mes.charAt(0).toUpperCase() + mes.slice(1)}`;
}

async function cargarDatosSemana() {
    if (!supabase) {
        console.warn('Supabase no configurado. Usando modo demo.');
        renderClasesDemo();
        return;
    }

    try {
        const fechaSemana = getFechaSemanaActual();
        
        const { data: semana, error: errorSemana } = await supabase
            .from('semanas')
            .select('*')
            .eq('fecha_inicio', fechaSemana)
            .maybeSingle();

        if (errorSemana) throw errorSemana;

        if (!semana) {
            semanaActual = null;
            renderSinClases();
            return;
        }

        semanaActual = semana;

        const { data: clases, error: errorClases } = await supabase
            .from('clases')
            .select('*')
            .eq('semana_id', semana.id)
            .order('dia_semana');

        if (errorClases) throw errorClases;

        clasesSemana = clases || [];
        
        if (clasesSemana.length === 0) {
            renderSinClases();
            return;
        }

        if (alumnaData.nombre) {
            await cargarInscripcionesExistentes();
            renderClases();
        } else {
            renderClases();
        }

    } catch (error) {
        console.error('Error cargando datos:', error);
        renderSinClases();
    }
}

async function cargarInscripcionesExistentes() {
    if (!supabase || !semanaActual) return;

    try {
        const { data, error } = await supabase
            .from('inscripciones')
            .select('*')
            .eq('nombre_alumna', alumnaData.nombre)
            .eq('telefono', alumnaData.telefono);

        if (error) throw error;
        inscripcionesExistentes = data || [];
    } catch (error) {
        console.error('Error cargando inscripciones:', error);
    }
}

function renderClasesDemo() {
    const demoClases = [
        { id: 'demo1', dia_semana: 1, nivel: 'Básico' },
        { id: 'demo2', dia_semana: 3, nivel: 'Intermedio' },
        { id: 'demo3', dia_semana: 5, nivel: 'Avanzado' }
    ];
    clasesSemana = demoClases;
    renderClases();
}

function renderSinClases() {
    const container = document.getElementById('lista-clases');
    container.innerHTML = `
        <div class="clase-card">
            <div class="clase-info">
                <span class="clase-dia">No hay clases programadas esta semana</span>
                <span class="clase-nivel">Consulta más adelante</span>
            </div>
        </div>
    `;
    document.getElementById('guardar-btn').disabled = true;
}

function renderClases() {
    const container = document.getElementById('lista-clases');
    
    if (clasesSemana.length === 0) {
        renderSinClases();
        return;
    }

    container.innerHTML = clasesSemana.map(clase => {
        const dia = DIAS_SEMANA.find(d => d.numero === clase.dia_semana);
        const yaInscrita = inscripcionesExistentes.some(i => i.clase_id === clase.id);
        
        return `
            <div class="clase-card ${yaInscrita ? 'seleccionada' : ''}" data-clase-id="${clase.id}">
                <div class="clase-info">
                    <span class="clase-dia">${dia.nombre}</span>
                    <span class="clase-nivel">${clase.nivel || 'Clase de Pole'}</span>
                </div>
                <input type="checkbox" class="clase-checkbox" 
                    data-clase-id="${clase.id}"
                    ${yaInscrita ? 'checked' : ''}>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.clase-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox') {
                const checkbox = card.querySelector('.clase-checkbox');
                checkbox.checked = !checkbox.checked;
                card.classList.toggle('seleccionada', checkbox.checked);
            }
        });
    });

    document.querySelectorAll('.clase-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const card = e.target.closest('.clase-card');
            card.classList.toggle('seleccionada', e.target.checked);
        });
    });

    document.getElementById('guardar-btn').disabled = false;
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    alumnaData.nombre = document.getElementById('nombre').value.trim();
    alumnaData.telefono = document.getElementById('telefono').value.trim();

    if (!alumnaData.nombre || !alumnaData.telefono) {
        alert('Por favor completa todos los campos');
        return;
    }

    document.getElementById('alumna-info').textContent = `Alumna: ${alumnaData.nombre}`;
    document.getElementById('form-section').classList.add('hidden');
    document.getElementById('clases-section').classList.remove('hidden');

    cargarDatosSemana();
}

async function guardarInscripciones() {
    const checkboxes = document.querySelectorAll('.clase-checkbox:checked');
    const clasesSeleccionadas = Array.from(checkboxes).map(cb => cb.dataset.claseId);

    if (clasesSeleccionadas.length === 0) {
        alert('Selecciona al menos una clase');
        return;
    }

    const btn = document.getElementById('guardar-btn');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    if (!supabase || !semanaActual) {
        setTimeout(() => {
            showConfirmacion();
            btn.disabled = false;
            btn.textContent = 'Confirmar Inscripción';
        }, 500);
        return;
    }

    try {
        const clasesAEliminar = inscripcionesExistentes
            .filter(i => !clasesSeleccionadas.includes(i.clase_id))
            .map(i => i.id);

        if (clasesAEliminar.length > 0) {
            await supabase
                .from('inscripciones')
                .delete()
                .in('id', clasesAEliminar);
        }

        for (const claseId of clasesSeleccionadas) {
            const yaExiste = inscripcionesExistentes.some(i => i.clase_id === claseId);
            
            if (!yaExiste) {
                await supabase
                    .from('inscripciones')
                    .insert({
                        clase_id: claseId,
                        nombre_alumna: alumnaData.nombre,
                        telefono: alumnaData.telefono,
                        asistira: true
                    });
            }
        }

        showConfirmacion();

    } catch (error) {
        console.error('Error guardando:', error);
        alert('Error al guardar. Intenta de nuevo.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Confirmar Inscripción';
    }
}

function showConfirmacion() {
    document.getElementById('clases-section').classList.add('hidden');
    document.getElementById('confirmacion-section').classList.remove('hidden');
}

function resetForm() {
    alumnaData = { nombre: '', telefono: '' };
    inscripcionesExistentes = [];
    
    document.getElementById('alumna-form').reset();
    document.getElementById('confirmacion-section').classList.add('hidden');
    document.getElementById('form-section').classList.remove('hidden');
    document.getElementById('clases-section').classList.add('hidden');
}