import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const DIAS_SEMANA = [
    { numero: 0, nombre: 'Domingo' },
    { numero: 1, nombre: 'Lunes' },
    { numero: 2, nombre: 'Martes' },
    { numero: 3, nombre: 'Miércoles' },
    { numero: 4, nombre: 'Jueves' },
    { numero: 5, nombre: 'Viernes' },
    { numero: 6, nombre: 'Sábado' }
];

let profesorId = null;
let semanaActual = null;
let semanas = [];
let indiceSemanaActual = 0;
let clasesSemana = [];
let inscripcionesCount = {};

const SESION_EXPIRATION_HOURS = 8;

document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    verificarSesion();
    
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('crear-semana-btn').addEventListener('click', () => mostrarModalCrearSemana());
    document.getElementById('copiar-semana-btn').addEventListener('click', copiarSemanaAnterior);
    document.getElementById('semana-anterior').addEventListener('click', () => cambiarSemana(-1));
    document.getElementById('semana-siguiente').addEventListener('click', () => cambiarSemana(1));

    document.querySelectorAll('.btn-agregar-clase').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const dia = parseInt(e.target.closest('.dia-card').dataset.dia);
            mostrarModalAgregarClase(dia);
        });
    });

    document.querySelector('.modal-close').addEventListener('click', cerrarModal);
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') cerrarModal();
    });
}

function verificarSesion() {
    const sesion = localStorage.getItem('profesor_session');
    if (sesion) {
        const data = JSON.parse(sesion);
        
        if (data.loginTime) {
            const horasTranscurridas = (Date.now() - data.loginTime) / (1000 * 60 * 60);
            if (horasTranscurridas > SESION_EXPIRATION_HOURS) {
                handleLogout();
                return;
            }
        }
        
        profesorId = data.id;
        mostrarDashboard();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorEl = document.getElementById('login-error');

    if (!supabase) {
        if (email && password) {
            profesorId = 'demo-profesor-id';
            localStorage.setItem('profesor_session', JSON.stringify({ 
                id: profesorId,
                loginTime: Date.now()
            }));
            mostrarDashboard();
        }
        return;
    }

    errorEl.classList.add('hidden');

    try {
        const { data: profesor, error } = await supabase
            .from('profesores')
            .select('*')
            .eq('email', email)
            .eq('password_hash', password)
            .maybeSingle();

        if (error) throw error;

        if (profesor) {
            profesorId = profesor.id;
            localStorage.setItem('profesor_session', JSON.stringify({ 
                id: profesor.id,
                loginTime: Date.now()
            }));
            mostrarDashboard();
        } else {
            errorEl.textContent = 'Email o contraseña incorrectos';
            errorEl.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error login:', error);
        errorEl.textContent = 'Error al iniciar sesión';
        errorEl.classList.remove('hidden');
    }
}

function handleLogout() {
    localStorage.removeItem('profesor_session');
    profesorId = null;
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('login-form').reset();
}

function mostrarDashboard() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    cargarSemanas();
}

async function cargarSemanas() {
    if (!supabase) {
        renderSemanasDemo();
        return;
    }

    try {
        const { data, error } = await supabase
            .from('semanas')
            .select('*')
            .eq('profesor_id', profesorId)
            .order('fecha_inicio', { ascending: false });

        if (error) throw error;

        semanas = data || [];
        
        if (semanas.length === 0) {
            indiceSemanaActual = -1;
            actualizarDisplaySemana();
            renderSinSemanas();
            return;
        }

        indiceSemanaActual = 0;
        actualizarDisplaySemana();
        await cargarClasesSemanaActual();

    } catch (error) {
        console.error('Error cargando semanas:', error);
        renderSemanasDemo();
    }
}

function renderSemanasDemo() {
    semanas = [
        { id: 'demo1', fecha_inicio: getFechaSemanaActual(), nombre: 'Semana actual' },
        { id: 'demo2', fecha_inicio: getFechaSemanaAnterior(), nombre: 'Semana pasada' }
    ];
    indiceSemanaActual = 0;
    actualizarDisplaySemana();
    renderClasesDemo();
}

function getFechaSemanaActual() {
    const hoy = new Date();
    const diaSemana = hoy.getDay();
    const diff = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
    const lunes = new Date(hoy);
    lunes.setDate(diff);
    return lunes.toISOString().split('T')[0];
}

function getFechaSemanaAnterior() {
    const hoy = new Date();
    const diaSemana = hoy.getDay();
    const diff = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1) - 7;
    const lunes = new Date(hoy);
    lunes.setDate(diff);
    return lunes.toISOString().split('T')[0];
}

function actualizarDisplaySemana() {
    if (semanas.length === 0) {
        document.getElementById('semana-actual').textContent = 'Sin semanas';
        return;
    }

    const semana = semanas[indiceSemanaActual];
    const date = new Date(semana.fecha_inicio + 'T00:00:00');
    const dia = date.getDate();
    const mes = date.toLocaleDateString('es-ES', { month: 'long' });
    const anio = date.getFullYear();
    
    const fechaFormateada = `${dia} ${mes.charAt(0).toUpperCase() + mes.slice(1)} ${anio}`;
    document.getElementById('semana-actual').textContent = 
        semana.nombre || fechaFormateada;
}

function cambiarSemana(direction) {
    if (semanas.length === 0) return;
    
    indiceSemanaActual += direction;
    
    if (indiceSemanaActual < 0) indiceSemanaActual = 0;
    if (indiceSemanaActual >= semanas.length) indiceSemanaActual = semanas.length - 1;
    
    actualizarDisplaySemana();
    cargarClasesSemanaActual();
}

async function cargarClasesSemanaActual() {
    if (semanas.length === 0) {
        renderSinSemanas();
        return;
    }

    semanaActual = semanas[indiceSemanaActual];

    if (!supabase) {
        renderClasesDemo();
        await cargarInscripcionesDemo();
        return;
    }

    try {
        const { data, error } = await supabase
            .from('clases')
            .select('*')
            .eq('semana_id', semanaActual.id)
            .order('dia_semana');

        if (error) throw error;

        clasesSemana = data || [];
        renderClases();
        await cargarInscripciones();

    } catch (error) {
        console.error('Error cargando clases:', error);
        renderSinSemanas();
    }
}

function renderSinSemanas() {
    const container = document.getElementById('dias-disponibles');
    container.innerHTML = '<p>No hay semanas creadas. Crea una nueva semana para comenzar.</p>';
    
    document.getElementById('lista-inscripciones').innerHTML = '';
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

function renderClases() {
    const container = document.getElementById('dias-disponibles');
    
    DIAS_SEMANA.forEach(dia => {
        const card = container.querySelector(`[data-dia="${dia.numero}"]`);
        const tieneClase = clasesSemana.some(c => c.dia_semana === dia.numero);
        
        if (tieneClase) {
            card.classList.add('tiene-clase');
            card.innerHTML = `
                <span class="dia-nombre">${dia.nombre}</span>
                <div class="clase-lista">
                    ${clasesSemana
                        .filter(c => c.dia_semana === dia.numero)
                        .map(c => {
                            const count = inscripcionesCount[c.id] || 0;
                            const countText = count === 1 ? '1 inscrita' : `${count} inscritas`;
                            return `
                                <div class="clase-lista-item" data-clase-id="${c.id}">
                                    <div class="clase-lista-info">
                                        <span class="clase-lista-nivel">${c.nivel}</span>
                                        <span class="clase-lista-inscritas">${countText}</span>
                                    </div>
                                    <button class="btn-eliminar-clase btn btn-small">Eliminar</button>
                                </div>
                            `;
                        }).join('')}
                </div>
            `;

            card.querySelectorAll('.btn-eliminar-clase').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const claseId = e.target.closest('.clase-lista-item').dataset.claseId;
                    eliminarClase(claseId);
                });
            });
        } else {
            card.classList.remove('tiene-clase');
            card.innerHTML = `
                <span class="dia-nombre">${dia.nombre}</span>
                <button class="btn-agregar-clase btn btn-small">+ Agregar</button>
            `;

            card.querySelector('.btn-agregar-clase').addEventListener('click', () => {
                mostrarModalAgregarClase(dia.numero);
            });
        }
    });
}

function mostrarModalAgregarClase(dia) {
    const modal = document.getElementById('modal');
    const body = document.getElementById('modal-body');
    const diaInfo = DIAS_SEMANA.find(d => d.numero === dia);

    body.innerHTML = `
        <h3>Agregar clase - ${diaInfo.nombre}</h3>
        <form id="agregar-clase-form">
            <div class="form-group">
                <label for="nivel">Nivel</label>
                <select id="nivel" required>
                    <option value="">Selecciona nivel</option>
                    <option value="Básico">Básico</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                    <option value="Libre">Libre</option>
                </select>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="cerrarModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Agregar</button>
            </div>
        </form>
    `;

    modal.classList.remove('hidden');

    document.getElementById('agregar-clase-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const nivel = document.getElementById('nivel').value;
        agregarClase(dia, nivel);
    });
}

function cerrarModal() {
    document.getElementById('modal').classList.add('hidden');
}

window.cerrarModal = cerrarModal;

async function agregarClase(dia, nivel) {
    if (!supabase) {
        clasesSemana.push({ id: 'demo-new-' + Date.now(), dia_semana: dia, nivel });
        renderClases();
        cerrarModal();
        return;
    }

    try {
        const { data, error } = await supabase
            .from('clases')
            .insert({
                semana_id: semanaActual.id,
                dia_semana: dia,
                nivel: nivel
            })
            .select()
            .single();

        if (error) throw error;

        clasesSemana.push(data);
        renderClases();
        cerrarModal();

    } catch (error) {
        console.error('Error agregando clase:', error);
        alert('Error al agregar clase');
    }
}

async function eliminarClase(claseId) {
    if (!confirm('¿Eliminar esta clase?')) return;

    if (!supabase) {
        clasesSemana = clasesSemana.filter(c => c.id !== claseId);
        renderClases();
        return;
    }

    try {
        await supabase.from('clases').delete().eq('id', claseId);
        clasesSemana = clasesSemana.filter(c => c.id !== claseId);
        renderClases();
        cargarInscripciones();
    } catch (error) {
        console.error('Error eliminando:', error);
        alert('Error al eliminar clase');
    }
}

function mostrarModalCrearSemana() {
    const modal = document.getElementById('modal');
    const body = document.getElementById('modal-body');
    
    const fechaSemanaProxima = getFechaSemanaSiguiente();
    const fechaActual = getFechaSemanaActual();

    body.innerHTML = `
        <h3>Crear Nueva Semana</h3>
        <form id="crear-semana-form">
            <div class="form-group">
                <label for="fecha-semana">Fecha de inicio (Lunes)</label>
                <input type="date" id="fecha-semana" value="${fechaSemanaProxima}" required>
            </div>
            <div class="form-group">
                <label for="nombre-semana">Nombre (opcional)</label>
                <input type="text" id="nombre-semana" placeholder="Ej: Semana 21-27 Abril">
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="cerrarModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Crear Semana</button>
            </div>
        </form>
    `;

    modal.classList.remove('hidden');

    document.getElementById('crear-semana-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const fechaSemana = document.getElementById('fecha-semana').value;
        const nombreSemana = document.getElementById('nombre-semana').value;
        crearSemana(fechaSemana, nombreSemana);
    });
}

function getFechaSemanaSiguiente() {
    const hoy = new Date();
    const proximoLunes = new Date(hoy);
    proximoLunes.setDate(hoy.getDate() + (1 + 7 - hoy.getDay()) % 7);
    if (proximoLunes <= hoy) {
        proximoLunes.setDate(proximoLunes.getDate() + 7);
    }
    return proximoLunes.toISOString().split('T')[0];
}

async function crearSemana(fechaSemana, nombreSemana) {
    if (!fechaSemana) {
        alert('Selecciona una fecha');
        return;
    }

    const date = new Date(fechaSemana + 'T00:00:00');
    const dia = date.getDate();
    const mes = date.toLocaleDateString('es-ES', { month: 'long' });
    const anio = date.getFullYear();
    const nombre = nombreSemana || `${dia} ${mes.charAt(0).toUpperCase() + mes.slice(1)} ${anio}`;

    if (!supabase) {
        semanas.unshift({ id: 'demo-new-' + Date.now(), fecha_inicio: fechaSemana, nombre });
        indiceSemanaActual = 0;
        actualizarDisplaySemana();
        clasesSemana = [];
        renderClases();
        document.getElementById('lista-inscripciones').innerHTML = '';
        cerrarModal();
        return;
    }

    try {
        const existe = semanas.find(s => s.fecha_inicio === fechaSemana);
        if (existe) {
            const confirmar = confirm('Ya existe una semana para esta fecha. ¿Deseas ir a esa semana?');
            if (confirmar) {
                indiceSemanaActual = semanas.findIndex(s => s.fecha_inicio === fechaSemana);
                actualizarDisplaySemana();
                await cargarClasesSemanaActual();
            }
            cerrarModal();
            return;
        }

        const { data, error } = await supabase
            .from('semanas')
            .insert({
                profesor_id: profesorId,
                fecha_inicio: fechaSemana,
                nombre: nombre
            })
            .select()
            .single();

        if (error) throw error;

        semanas.unshift(data);
        indiceSemanaActual = 0;
        semanaActual = data;
        clasesSemana = [];
        inscripcionesCount = {};
        actualizarDisplaySemana();
        renderClases();
        document.getElementById('lista-inscripciones').innerHTML = '';
        cerrarModal();

    } catch (error) {
        console.error('Error creando semana:', error);
        alert('Error al crear semana');
    }
}

async function copiarSemanaAnterior() {
    if (semanas.length < 2) {
        alert('Necesitas al menos dos semanas para copiar');
        return;
    }

    const semanaAnterior = semanas[1];

    if (!supabase) {
        const clasesDemoCopiadas = [
            { id: 'demo-copy-1', dia_semana: 1, nivel: 'Básico' },
            { id: 'demo-copy-2', dia_semana: 3, nivel: 'Intermedio' }
        ];
        clasesSemana = [...clasesDemoCopiadas];
        renderClases();
        return;
    }

    try {
        const { data: clasesAnterior, error: errorClases } = await supabase
            .from('clases')
            .select('*')
            .eq('semana_id', semanaAnterior.id);

        if (errorClases) throw errorClases;

        const nuevasClases = clasesAnterior.map(c => ({
            semana_id: semanaActual.id,
            dia_semana: c.dia_semana,
            nivel: c.nivel
        }));

        const { data, error } = await supabase
            .from('clases')
            .insert(nuevasClases)
            .select();

        if (error) throw error;

        clasesSemana = data;
        renderClases();

    } catch (error) {
        console.error('Error copiando:', error);
        alert('Error al copiar clases');
    }
}

async function cargarInscripciones() {
    if (clasesSemana.length === 0) {
        document.getElementById('lista-inscripciones').innerHTML = '<p>No hay clases esta semana</p>';
        return;
    }

    if (!supabase) {
        await cargarInscripcionesDemo();
        return;
    }

    try {
        const claseIds = clasesSemana.map(c => c.id);
        
        const { data, error } = await supabase
            .from('inscripciones')
            .select('*')
            .in('clase_id', claseIds)
            .order('created_at', { ascending: false });

        if (error) throw error;

        inscripcionesCount = {};
        if (data) {
            data.forEach(ins => {
                inscripcionesCount[ins.clase_id] = (inscripcionesCount[ins.clase_id] || 0) + 1;
            });
        }

        renderClases();
        renderInscripciones(data || []);

    } catch (error) {
        console.error('Error cargando inscripciones:', error);
    }
}

async function cargarInscripcionesDemo() {
    const demoInscripciones = [
        { id: 'ins1', clase_id: 'demo1', nombre_alumna: 'María García', telefono: '123456789', created_at: new Date().toISOString() },
        { id: 'ins2', clase_id: 'demo1', nombre_alumna: 'Ana López', telefono: '987654321', created_at: new Date().toISOString() },
        { id: 'ins3', clase_id: 'demo2', nombre_alumna: 'Sofia Martínez', telefono: '456123789', created_at: new Date().toISOString() }
    ];
    renderInscripciones(demoInscripciones);
}

function renderInscripciones(inscripciones) {
    const container = document.getElementById('lista-inscripciones');
    
    if (inscripciones.length === 0) {
        container.innerHTML = '<p>No hay inscripciones aún</p>';
        return;
    }

    container.innerHTML = inscripciones.map(inscripcion => {
        const clase = clasesSemana.find(c => c.id === inscripcion.clase_id);
        const dia = clase ? DIAS_SEMANA.find(d => d.numero === clase.dia_semana) : null;
        
        return `
            <div class="inscripcion-card" data-inscripcion-id="${inscripcion.id}">
                <div class="inscripcion-info">
                    <span class="inscripcion-nombre">${inscripcion.nombre_alumna}</span>
                    <span class="inscripcion-telefono">${inscripcion.telefono}</span>
                    <span class="inscripcion-fecha">${dia ? dia.nombre + ' - ' + clase.nivel : 'Clase'} | ${formatearFecha(inscripcion.created_at)}</span>
                </div>
                <button class="btn-eliminar-inscripcion btn btn-danger btn-small">Eliminar</button>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.btn-eliminar-inscripcion').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.closest('.inscripcion-card').dataset.inscripcionId;
            eliminarInscripcion(id);
        });
    });
}

function formatearFecha(fecha) {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES');
}

async function eliminarInscripcion(inscripcionId) {
    if (!confirm('¿Eliminar esta inscripción?')) return;

    if (!supabase) {
        const container = document.getElementById('lista-inscripciones');
        container.innerHTML = container.innerHTML.replace(/<div class="inscripcion-card" data-inscripcion-id="[^"]*">[^<]*<button class="btn-eliminar-inscripcion[^<]*<\/button><\/div>/, '');
        return;
    }

    try {
        await supabase.from('inscripciones').delete().eq('id', inscripcionId);
        const container = document.getElementById('lista-inscripciones');
        const card = container.querySelector(`[data-inscripcion-id="${inscripcionId}"]`);
        if (card) card.remove();
        
        if (container.children.length === 0) {
            container.innerHTML = '<p>No hay inscripciones aún</p>';
        }
    } catch (error) {
        console.error('Error eliminando:', error);
        alert('Error al eliminar inscripción');
    }
}