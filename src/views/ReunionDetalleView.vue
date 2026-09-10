<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  reunionActual,
  arbitros,
  loading,
  error,
  loadReunionDetalle,
  loadArbitros,
  actualizarReunion,
  guardarTemas,
  guardarAsistenciasBatch,
  loadDisponibilidadFinde,
  getMetricasReunion
} from '../stores/reunionesStore';
import BadgeEstado from '../components/BadgeEstado.vue';
import ModalNuevoTema from '../components/ModalNuevoTema.vue';
import ModalAgregarArbitros from '../components/ModalAgregarArbitros.vue';
import {
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Users,
  UserPlus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Edit3,
  Trash2,
  ArrowUp,
  ArrowDown,
  Printer,
  FileSpreadsheet,
  CheckCheck,
  RotateCw,
  Copy,
  FileText,
  ShieldAlert,
  Save,
  Server,
  Loader2,
  X,
  ChevronDown
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

const reunionId = computed(() => Number(route.params.id));
const reunion = computed(() => reunionActual.value);

// Active Tab
const activeTab = ref('asistencia'); // 'temas' | 'asistencia' | 'disponibilidad' | 'acta'

// Attendance Filters & Search
const searchQuery = ref('');
const filterEstado = ref('TODOS'); // 'TODOS' | 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO'
const filterCategoria = ref('TODAS');

// Topics Modal State
const isModalTemaOpen = ref(false);
const temaAEditar = ref(null);

// Status for saving attendance
const isSavingAsistencia = ref(false);
const asistenciaGuardada = ref(false);

// State for incrementally adding referees
const isModalAgregarArbitrosOpen = ref(false);
const quickAddQuery = ref('');
const isQuickAddOpen = ref(false);
const alertaAgregado = ref(null);

// Quick Observation Presets
const observacionesFrecuentes = [
  'Llegó tarde con aviso',
  'Turno de guardia laboral',
  'Certificado médico presentado',
  'Designación federativa exterior',
  'Problemas de transporte en ruta',
  'Sin aviso previo a secretaría',
  'Licencia por estudio / examen',
  'En recuperación por lesión'
];

onMounted(async () => {
  try {
    await Promise.all([
      loadReunionDetalle(reunionId.value),
      loadArbitros(0, 100)
    ]);
  } catch (err) {
    console.error('Error al cargar detalle de reunión o árbitros:', err);
  }
});

const arbitrosYaEnReunionIds = computed(() => {
  if (!reunion.value || !reunion.value.asistencias) return new Set();
  return new Set(reunion.value.asistencias.map(a => a.arbitro?.idArbitro).filter(Boolean));
});

const arbitrosDisponiblesParaAgregar = computed(() => {
  const ids = arbitrosYaEnReunionIds.value;
  return arbitros.value.filter(a => a.estadoSistema !== false && !ids.has(a.idArbitro));
});

const arbitrosQuickAddFiltrados = computed(() => {
  const disponibles = arbitrosDisponiblesParaAgregar.value;
  if (!quickAddQuery.value.trim()) {
    return disponibles.slice(0, 6);
  }
  const q = quickAddQuery.value.toLowerCase();
  return disponibles.filter(a => {
    const fullName = `${a.nombre || ''} ${a.apellido || ''}`.toLowerCase();
    return fullName.includes(q) || (a.categoria || '').toLowerCase().includes(q) || (a.whatsapp || '').includes(q);
  }).slice(0, 6);
});

function handleAgregarArbitro({ arbitro, estado = 'PRESENTE' }) {
  if (!reunion.value) return;
  if (!reunion.value.asistencias) reunion.value.asistencias = [];

  const existe = reunion.value.asistencias.some(a => a.arbitro?.idArbitro === arbitro.idArbitro);
  if (existe) return;

  const nueva = {
    idAsistencia: Date.now() + Math.floor(Math.random() * 1000),
    arbitro: { ...arbitro },
    estadoAsistencia: estado,
    observacion: estado === 'PRESENTE' ? 'Presente en horario.' : (estado === 'JUSTIFICADO' ? 'Con aviso previo.' : ''),
    disponibleSabado: arbitro.disponibleSabado ?? true,
    disponibleDomingo: arbitro.disponibleDomingo ?? true
  };

  reunion.value.asistencias.unshift(nueva);
  asistenciaGuardada.value = false;
  quickAddQuery.value = '';
  isQuickAddOpen.value = false;

  const nombreCompleto = `${arbitro.nombre || ''} ${arbitro.apellido || ''}`.trim();
  alertaAgregado.value = `✓ ${nombreCompleto} incorporado como ${estado}`;
  setTimeout(() => {
    alertaAgregado.value = null;
  }, 3500);
}

function handleAgregarMultiples({ arbitros: lista, estado }) {
  if (!reunion.value || !Array.isArray(lista)) return;
  if (!reunion.value.asistencias) reunion.value.asistencias = [];

  const yaRegistrados = arbitrosYaEnReunionIds.value;
  let count = 0;

  lista.forEach((arb, idx) => {
    if (!yaRegistrados.has(arb.idArbitro)) {
      reunion.value.asistencias.push({
        idAsistencia: Date.now() + idx,
        arbitro: { ...arb },
        estadoAsistencia: estado,
        observacion: estado === 'PRESENTE' ? 'Presente en horario.' : '',
        disponibleSabado: arb.disponibleSabado ?? true,
        disponibleDomingo: arb.disponibleDomingo ?? true
      });
      count++;
    }
  });

  asistenciaGuardada.value = false;
  isModalAgregarArbitrosOpen.value = false;
  alertaAgregado.value = `✓ ${count} árbitros incorporados como ${estado}`;
  setTimeout(() => {
    alertaAgregado.value = null;
  }, 3500);
}

function quitarArbitroDeReunion(asis) {
  const nombre = `${asis.arbitro?.nombre || ''} ${asis.arbitro?.apellido || ''}`.trim() || 'este árbitro';
  if (confirm(`¿Quitar a ${nombre} de la planilla de esta sesión?`)) {
    reunion.value.asistencias = reunion.value.asistencias.filter(a => a.idAsistencia !== asis.idAsistencia);
    asistenciaGuardada.value = false;
  }
}

const metricas = computed(() => getMetricasReunion(reunion.value));

const categoriasDisponibles = computed(() => {
  if (!reunion.value || !reunion.value.asistencias) return [];
  const set = new Set(reunion.value.asistencias.map(a => a.arbitro?.categoria).filter(Boolean));
  return Array.from(set);
});

const asistenciasFiltradas = computed(() => {
  if (!reunion.value || !reunion.value.asistencias) return [];
  return reunion.value.asistencias.filter(a => {
    const query = searchQuery.value.toLowerCase();
    const matchSearch =
      (a.arbitro?.nombre || '').toLowerCase().includes(query) ||
      (a.arbitro?.apellido || '').toLowerCase().includes(query) ||
      (a.arbitro?.documento || '').toLowerCase().includes(query) ||
      (a.arbitro?.whatsapp || '').toLowerCase().includes(query) ||
      (a.arbitro?.categoria || '').toLowerCase().includes(query) ||
      (a.observacion || '').toLowerCase().includes(query);

    if (!matchSearch) return false;

    if (filterEstado.value !== 'TODOS' && a.estadoAsistencia !== filterEstado.value) {
      return false;
    }

    if (filterCategoria.value !== 'TODAS' && a.arbitro?.categoria !== filterCategoria.value) {
      return false;
    }

    return true;
  });
});

// Grouped availability for designaciones
const disponibilidadGrupos = computed(() => {
  if (!reunion.value || !reunion.value.asistencias) {
    return { ambos: [], soloSabado: [], soloDomingo: [], noDisponibles: [] };
  }
  const ambos = [];
  const soloSabado = [];
  const soloDomingo = [];
  const noDisponibles = [];

  reunion.value.asistencias.forEach(a => {
    if (a.disponibleSabado && a.disponibleDomingo) {
      ambos.push(a);
    } else if (a.disponibleSabado) {
      soloSabado.push(a);
    } else if (a.disponibleDomingo) {
      soloDomingo.push(a);
    } else {
      noDisponibles.push(a);
    }
  });

  return { ambos, soloSabado, soloDomingo, noDisponibles };
});

function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

// Attendance Handlers
function cambiarEstadoAsistencia(asistencia, nuevoEstado) {
  if (asistencia.estadoAsistencia === nuevoEstado) return;
  asistencia.estadoAsistencia = nuevoEstado;

  if (nuevoEstado === 'PRESENTE' && (!asistencia.observacion || asistencia.observacion === 'Sin aviso previo.')) {
    asistencia.observacion = 'Presente en horario.';
  } else if (nuevoEstado === 'AUSENTE' && (!asistencia.observacion || asistencia.observacion.startsWith('Presente'))) {
    asistencia.observacion = 'Sin aviso previo.';
  } else if (nuevoEstado === 'JUSTIFICADO' && (!asistencia.observacion || asistencia.observacion.startsWith('Presente'))) {
    asistencia.observacion = 'Justificado con aviso.';
  }
  asistenciaGuardada.value = false;
}

function setObservacion(asistencia, texto) {
  asistencia.observacion = texto;
  asistenciaGuardada.value = false;
}

function appendObservacion(asistencia, texto) {
  const actual = asistencia.observacion ? asistencia.observacion.trim() : '';
  const nueva = actual && actual !== 'Presente en horario.' && actual !== 'Sin aviso previo.'
    ? `${actual} - ${texto}`
    : texto;
  asistencia.observacion = nueva;
  asistenciaGuardada.value = false;
}

function toggleDisponibilidad(asistencia, campo) {
  asistencia[campo] = !asistencia[campo];
  asistenciaGuardada.value = false;
}

function handleBatch(estado) {
  if (!reunion.value || !reunion.value.asistencias) return;
  const nombreEstado = estado === 'PRESENTE' ? 'todos presentes' : 'todos ausentes';
  if (confirm(`¿Marcar ${nombreEstado}? (Recuerda guardar los cambios en la API)`)) {
    reunion.value.asistencias.forEach(a => {
      a.estadoAsistencia = estado;
      if (estado === 'PRESENTE' && !a.observacion) {
        a.observacion = 'Presente en horario.';
      }
    });
    asistenciaGuardada.value = false;
  }
}

async function guardarCambiosAsistenciaApi() {
  if (!reunion.value || !reunion.value.asistencias) return;
  isSavingAsistencia.value = true;
  try {
    const items = reunion.value.asistencias.map(a => ({
      idAsistencia: a.idAsistencia,
      idArbitro: a.arbitro?.idArbitro,
      estadoAsistencia: a.estadoAsistencia,
      observacion: a.observacion || '',
      disponibleSabado: !!a.disponibleSabado,
      disponibleDomingo: !!a.disponibleDomingo
    }));

    await guardarAsistenciasBatch(reunionId.value, {
      sincronizarConActivos: false,
      asistencias: items
    });
    asistenciaGuardada.value = true;
    setTimeout(() => {
      asistenciaGuardada.value = false;
    }, 3000);
  } catch (err) {
    alert(`Error al registrar asistencia en API: ${err.message}`);
  } finally {
    isSavingAsistencia.value = false;
  }
}

async function toggleEstadoReunion() {
  const nuevo = !reunion.value.editable;
  try {
    await actualizarReunion(reunionId.value, {
      fecha: reunion.value.fecha,
      lugar: reunion.value.lugar,
      titulo: reunion.value.titulo,
      observaciones: reunion.value.observaciones,
      editable: nuevo
    });
  } catch (err) {
    alert(`Error al actualizar estado: ${err.message}`);
  }
}

// Topics Handlers
function abrirNuevoTema() {
  temaAEditar.value = null;
  isModalTemaOpen.value = true;
}

function abrirEditarTema(tema) {
  temaAEditar.value = { ...tema };
  isModalTemaOpen.value = true;
}

async function handleSaveTema(temaData) {
  if (!reunion.value.temas) reunion.value.temas = [];
  if (temaAEditar.value) {
    const idx = reunion.value.temas.findIndex(t => t.idTema === temaAEditar.value.idTema);
    if (idx >= 0) {
      Object.assign(reunion.value.temas[idx], temaData);
    }
  } else {
    reunion.value.temas.push({
      idTema: Date.now(),
      ...temaData,
      orden: reunion.value.temas.length + 1
    });
  }
  try {
    await guardarTemas(reunionId.value, reunion.value.temas);
  } catch (err) {
    alert(`Error al guardar temas en API: ${err.message}`);
  }
}

async function handleBorrarTema(idTema, titulo) {
  if (confirm(`¿Eliminar el tema "${titulo}" en el servidor?`)) {
    reunion.value.temas = reunion.value.temas.filter(t => t.idTema !== idTema);
    reunion.value.temas.forEach((t, i) => t.orden = i + 1);
    try {
      await guardarTemas(reunionId.value, reunion.value.temas);
    } catch (err) {
      alert(`Error al actualizar temas en API: ${err.message}`);
    }
  }
}

async function handleMoverTema(idTema, dir) {
  const idx = reunion.value.temas.findIndex(t => t.idTema === idTema);
  if (idx < 0) return;
  const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= reunion.value.temas.length) return;
  const [removed] = reunion.value.temas.splice(idx, 1);
  reunion.value.temas.splice(targetIdx, 0, removed);
  reunion.value.temas.forEach((t, i) => t.orden = i + 1);
  try {
    await guardarTemas(reunionId.value, reunion.value.temas);
  } catch (err) {
    alert(`Error al reordenar temas en API: ${err.message}`);
  }
}

function imprimirActa() {
  window.print();
}

function copiarDesignaciones() {
  const texto = [
    `REPORTE DE DISPONIBILIDAD - ${reunion.value.titulo}`,
    `Fecha: ${formatDate(reunion.value.fecha)}`,
    '',
    `DISPONIBLES AMBOS DÍAS (${disponibilidadGrupos.value.ambos.length}):`,
    disponibilidadGrupos.value.ambos.map(a => `- ${a.arbitro?.nombre} (${a.arbitro?.categoria})`).join('\n') || 'Ninguno',
    '',
    `SOLO SÁBADO (${disponibilidadGrupos.value.soloSabado.length}):`,
    disponibilidadGrupos.value.soloSabado.map(a => `- ${a.arbitro?.nombre} (${a.arbitro?.categoria})`).join('\n') || 'Ninguno',
    '',
    `SOLO DOMINGO (${disponibilidadGrupos.value.soloDomingo.length}):`,
    disponibilidadGrupos.value.soloDomingo.map(a => `- ${a.arbitro?.nombre} (${a.arbitro?.categoria})`).join('\n') || 'Ninguno',
    '',
    `NO DISPONIBLES (${disponibilidadGrupos.value.noDisponibles.length}):`,
    disponibilidadGrupos.value.noDisponibles.map(a => `- ${a.arbitro?.nombre} (${a.arbitro?.categoria}) - Motivo: ${a.observacion || 'No especificado'}`).join('\n') || 'Ninguno'
  ].join('\n');

  navigator.clipboard.writeText(texto).then(() => {
    alert('¡Reporte copiado al portapapeles!');
  });
}
</script>

<template>
  <div v-if="reunion" class="space-y-6">
    <!-- Top Bar Navigation (No-Print) -->
    <div class="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <router-link
        to="/"
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        <span>Volver a Reuniones</span>
      </router-link>

      <div class="flex items-center gap-2">
        <button
          @click="imprimirActa"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <Printer class="w-3.5 h-3.5 text-slate-500" />
          <span>Imprimir Acta</span>
        </button>

        <button
          @click="toggleEstadoReunion"
          :class="[
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-xs',
            reunion.editable
              ? 'bg-slate-900 hover:bg-slate-800 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          ]"
        >
          <CheckCheck class="w-3.5 h-3.5" />
          <span>{{ reunion.editable ? 'Cerrar Acta (Finalizar)' : 'Reabrir Sesión' }}</span>
        </button>
      </div>
    </div>

    <!-- Institutional Meeting Header -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div class="space-y-3 flex-1">
          <div class="flex items-center flex-wrap gap-2">
            <BadgeEstado :estado="reunion.editable ? 'EN_CURSO' : 'FINALIZADA'" size="lg" />
            <span class="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Colegio de Árbitros • Sesión Ordinaria
            </span>
          </div>

          <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            {{ reunion.titulo }}
          </h1>

          <div class="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-600">
            <div class="flex items-center gap-1.5">
              <Calendar class="w-4 h-4 text-emerald-600 shrink-0" />
              <span class="font-medium">{{ formatDate(reunion.fecha) }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <MapPin class="w-4 h-4 text-slate-400 shrink-0" />
              <span>{{ reunion.lugar }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Users class="w-4 h-4 text-slate-400 shrink-0" />
              <span><strong>{{ metricas.total }}</strong> convocados</span>
            </div>
          </div>

          <p v-if="reunion.observaciones" class="text-xs text-slate-600 pt-2 border-t border-slate-100 max-w-3xl">
            <span class="font-semibold text-slate-700">Directiva / Observación:</span> {{ reunion.observaciones }}
          </p>
        </div>

        <!-- Real-Time Quorum Counters Widget -->
        <div class="no-print bg-slate-50 border border-slate-200/80 rounded-xl p-4 lg:w-80 shrink-0 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Control de Quórum</span>
            <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {{ metricas.porcentajeAsistencia }}% Asistencia
            </span>
          </div>

          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="p-2 rounded-lg bg-emerald-100/50 border border-emerald-200">
              <div class="text-xl font-mono font-bold text-emerald-800">{{ metricas.presentes }}</div>
              <div class="text-[10px] font-semibold text-emerald-700 uppercase">Presentes</div>
            </div>
            <div class="p-2 rounded-lg bg-rose-100/50 border border-rose-200">
              <div class="text-xl font-mono font-bold text-rose-800">{{ metricas.ausentes }}</div>
              <div class="text-[10px] font-semibold text-rose-700 uppercase">Ausentes</div>
            </div>
            <div class="p-2 rounded-lg bg-amber-100/50 border border-amber-200">
              <div class="text-xl font-mono font-bold text-amber-900">{{ metricas.justificados }}</div>
              <div class="text-[10px] font-semibold text-amber-800 uppercase">Justif.</div>
            </div>
          </div>

          <!-- Quorum Multi-Bar -->
          <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
            <div
              class="bg-emerald-500 transition-all duration-300"
              :style="{ width: `${metricas.porcentajeAsistencia}%` }"
              title="Presentes"
            ></div>
            <div
              class="bg-amber-400 transition-all duration-300"
              :style="{ width: `${(metricas.justificados / (metricas.total || 1)) * 100}%` }"
              title="Justificados"
            ></div>
            <div
              class="bg-rose-400 transition-all duration-300"
              :style="{ width: `${(metricas.ausentes / (metricas.total || 1)) * 100}%` }"
              title="Ausentes"
            ></div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs (No-Print) -->
      <div class="no-print mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
        <button
          @click="activeTab = 'asistencia'"
          :class="[
            'px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shrink-0',
            activeTab === 'asistencia'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          ]"
        >
          <CheckCircle2 class="w-4 h-4" />
          <span>Planilla de Asistencia & Observaciones</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-700 text-white font-mono">
            {{ metricas.presentes }}/{{ metricas.total }}
          </span>
        </button>

        <button
          @click="activeTab = 'temas'"
          :class="[
            'px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shrink-0',
            activeTab === 'temas'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          ]"
        >
          <FileText class="w-4 h-4" />
          <span>Temas Tratados (Orden del Día)</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-mono">
            {{ reunion.temas?.length || 0 }}
          </span>
        </button>

        <button
          @click="activeTab = 'disponibilidad'"
          :class="[
            'px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shrink-0',
            activeTab === 'disponibilidad'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          ]"
        >
          <FileSpreadsheet class="w-4 h-4" />
          <span>Disponibilidad Finde (Designador)</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono">
            {{ disponibilidadGrupos.ambos.length }} full
          </span>
        </button>

        <button
          @click="activeTab = 'acta'"
          :class="[
            'px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shrink-0',
            activeTab === 'acta'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          ]"
        >
          <Printer class="w-4 h-4" />
          <span>Acta Oficial Formal</span>
        </button>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- TAB 1: CONTROL DE ASISTENCIA & OBSERVACIONES (PUNTO NEURÁLGICO) -->
    <!-- ============================================================= -->
    <div v-show="activeTab === 'asistencia'" class="space-y-4">
      
      <!-- Notification Banner when referee added -->
      <div
        v-if="alertaAgregado"
        class="no-print p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-150"
      >
        <div class="flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{{ alertaAgregado }}</span>
        </div>
        <span class="text-[11px] text-emerald-700 font-medium">Recuerda presionar "Guardar en Servidor"</span>
      </div>

      <!-- Tactical Check-in & Roster Addition Panel (Strict Light Mode) -->
      <div class="no-print bg-white rounded-2xl p-4 sm:p-5 text-slate-800 shadow-xs border border-emerald-200/80 ring-1 ring-emerald-500/10 relative overflow-hidden">
        <!-- Subtle decorative athletic federation background tint -->
        <div class="absolute inset-0 bg-gradient-to-r from-emerald-50/60 via-white to-slate-50/70 pointer-events-none"></div>

        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          <!-- Title & Context -->
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Ingreso a Sala
              </span>
              <span class="text-slate-300 text-xs">•</span>
              <span class="text-xs font-semibold text-slate-500">Padrón Oficial del Colegio</span>
            </div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Registrar / Incorporar Árbitros
            </h3>
            <p class="text-xs text-slate-600 max-w-xl">
              Agrega a los colegiados a medida que ingresan al salón o abre el padrón para convocatorias selectivas.
            </p>
          </div>

          <!-- Quick Search Dropdown & Roster Modal Trigger -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <!-- Autocomplete Combobox -->
            <div class="relative w-full sm:w-80">
              <div class="relative">
                <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  v-model="quickAddQuery"
                  @focus="isQuickAddOpen = true"
                  type="text"
                  placeholder="Buscar árbitro para agregar..."
                  class="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all shadow-2xs"
                />
                <button
                  v-if="quickAddQuery"
                  @click="quickAddQuery = ''; isQuickAddOpen = false"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Outside click backdrop -->
              <div
                v-if="isQuickAddOpen"
                class="fixed inset-0 z-40"
                @click="isQuickAddOpen = false"
              ></div>

              <!-- Quick Add Dropdown Menu -->
              <div
                v-if="isQuickAddOpen && arbitrosQuickAddFiltrados.length > 0"
                class="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-50 divide-y divide-slate-100 max-h-72 overflow-y-auto ring-1 ring-slate-900/5"
              >
                <div
                  v-for="arb in arbitrosQuickAddFiltrados"
                  :key="arb.idArbitro"
                  class="p-2.5 hover:bg-emerald-50/40 transition-colors flex items-center justify-between gap-2"
                >
                  <div class="min-w-0">
                    <div class="text-xs font-bold text-slate-900 truncate">
                      {{ arb.nombre }} {{ arb.apellido || '' }}
                    </div>
                    <div class="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span class="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono font-medium border border-slate-200/60">{{ arb.categoria }}</span>
                      <span v-if="arb.whatsapp" class="font-mono text-slate-600">📱 {{ arb.whatsapp }}</span>
                    </div>
                  </div>

                  <!-- Instant add action buttons -->
                  <div class="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      @click="handleAgregarArbitro({ arbitro: arb, estado: 'PRESENTE' })"
                      class="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1"
                      title="Ingresar como Presente"
                    >
                      <CheckCircle2 class="w-3 h-3" />
                      <span>+ P</span>
                    </button>
                    <button
                      type="button"
                      @click="handleAgregarArbitro({ arbitro: arb, estado: 'AUSENTE' })"
                      class="px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-semibold transition-colors"
                      title="Ingresar como Ausente"
                    >
                      + A
                    </button>
                    <button
                      type="button"
                      @click="handleAgregarArbitro({ arbitro: arb, estado: 'JUSTIFICADO' })"
                      class="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-semibold transition-colors"
                      title="Ingresar como Justificado"
                    >
                      + J
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Button to Open Full Roster Modal -->
            <button
              type="button"
              @click="isModalAgregarArbitrosOpen = true"
              class="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
            >
              <UserPlus class="w-4 h-4" />
              <span>Ver Padrón ({{ arbitrosDisponiblesParaAgregar.length }} pendientes)</span>
            </button>
          </div>

        </div>
      </div>

      <!-- Toolbar & Filters -->
      <div class="no-print bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <!-- Left: Search & Select Filter -->
        <div class="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto flex-1">
          <div class="relative w-full sm:w-72">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por nombre, DNI u observación..."
              class="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-slate-900"
            />
          </div>

          <!-- Category filter -->
          <select
            v-model="filterCategoria"
            class="w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-slate-700"
          >
            <option value="TODAS">Todas las categorías</option>
            <option v-for="cat in categoriasDisponibles" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>

        <!-- Middle: Status Pills -->
        <div class="flex items-center gap-1 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            @click="filterEstado = 'TODOS'"
            :class="[
              'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0',
              filterEstado === 'TODOS' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            ]"
          >
            Todos ({{ reunion.asistencias.length }})
          </button>
          <button
            @click="filterEstado = 'PRESENTE'"
            :class="[
              'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1',
              filterEstado === 'PRESENTE' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'
            ]"
          >
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Presentes ({{ metricas.presentes }})</span>
          </button>
          <button
            @click="filterEstado = 'AUSENTE'"
            :class="[
              'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1',
              filterEstado === 'AUSENTE' ? 'bg-rose-600 text-white' : 'text-rose-700 hover:bg-rose-50'
            ]"
          >
            <span class="w-2 h-2 rounded-full bg-rose-400"></span>
            <span>Ausentes ({{ metricas.ausentes }})</span>
          </button>
          <button
            @click="filterEstado = 'JUSTIFICADO'"
            :class="[
              'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1',
              filterEstado === 'JUSTIFICADO' ? 'bg-amber-600 text-white' : 'text-amber-800 hover:bg-amber-50'
            ]"
          >
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Justificados ({{ metricas.justificados }})</span>
          </button>
        </div>

        <!-- Right: Batch Actions & API Save -->
        <div class="flex items-center gap-1.5 w-full md:w-auto justify-end">
          <button
            @click="handleBatch('PRESENTE')"
            title="Marcar a todos como Presentes"
            class="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-medium transition-colors"
          >
            Todos P
          </button>
          <button
            @click="handleBatch('AUSENTE')"
            title="Marcar a todos como Ausentes"
            class="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-medium transition-colors"
          >
            Todos A
          </button>

          <button
            @click="guardarCambiosAsistenciaApi"
            :disabled="isSavingAsistencia"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors"
            title="Enviar asistencias a la API (POST /reuniones/{id}/asistencia)"
          >
            <Loader2 v-if="isSavingAsistencia" class="w-3.5 h-3.5 animate-spin" />
            <Save v-else class="w-3.5 h-3.5" />
            <span>{{ isSavingAsistencia ? 'Guardando...' : (asistenciaGuardada ? '¡Guardado!' : 'Guardar en Servidor') }}</span>
          </button>
        </div>
      </div>

      <!-- Attendance List / Cards Grid -->
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div class="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
          <div class="col-span-4">Árbitro / Colegiado</div>
          <div class="col-span-3 text-center">Pase de Lista (1-Click)</div>
          <div class="col-span-3">Observación Correspondiente</div>
          <div class="col-span-2 text-center">Disponibilidad Finde</div>
        </div>

        <div class="divide-y divide-slate-100">
          <div
            v-for="asis in asistenciasFiltradas"
            :key="asis.idAsistencia"
            :class="[
              'p-4 sm:px-6 transition-colors',
              asis.estadoAsistencia === 'AUSENTE' && 'bg-rose-50/20',
              asis.estadoAsistencia === 'JUSTIFICADO' && 'bg-amber-50/20',
              asis.estadoAsistencia === 'PRESENTE' && 'hover:bg-slate-50/50'
            ]"
          >
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-start lg:items-center">
              <!-- Col 1: Árbitro Info -->
              <div class="lg:col-span-4 flex items-center gap-3">
                <div
                  :class="[
                    'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors',
                    asis.estadoAsistencia === 'PRESENTE' && 'bg-emerald-100 text-emerald-800 border border-emerald-300',
                    asis.estadoAsistencia === 'AUSENTE' && 'bg-rose-100 text-rose-800 border border-rose-300',
                    asis.estadoAsistencia === 'JUSTIFICADO' && 'bg-amber-100 text-amber-900 border border-amber-300'
                  ]"
                >
                  {{ ((asis.arbitro?.nombre?.[0] || '') + (asis.arbitro?.apellido?.[0] || '')).toUpperCase() || 'AR' }}
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-sm text-slate-900 truncate">
                    {{ asis.arbitro?.nombre }} {{ asis.arbitro?.apellido || '' }}
                  </div>
                  <div class="flex items-center gap-2 text-xs text-slate-500">
                    <span v-if="asis.arbitro?.whatsapp" class="font-mono text-slate-600 font-medium">📱 {{ asis.arbitro?.whatsapp }}</span>
                    <span v-if="asis.arbitro?.whatsapp && asis.arbitro?.categoria">•</span>
                    <span class="text-emerald-800 font-medium truncate">{{ asis.arbitro?.categoria }}</span>
                  </div>
                </div>
              </div>

              <!-- Col 2: Selector de Estado 1-Click (Tactical Buttons) -->
              <div class="lg:col-span-3 flex items-center justify-start lg:justify-center">
                <div class="inline-flex rounded-lg p-1 bg-slate-100 border border-slate-200 gap-1 w-full sm:w-auto">
                  <!-- Botón PRESENTE -->
                  <button
                    type="button"
                    @click="cambiarEstadoAsistencia(asis, 'PRESENTE')"
                    :class="[
                      'flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                      asis.estadoAsistencia === 'PRESENTE'
                        ? 'bg-emerald-600 text-white shadow-xs scale-102'
                        : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50'
                    ]"
                  >
                    <CheckCircle2 class="w-3.5 h-3.5" />
                    <span>Presente</span>
                  </button>

                  <!-- Botón AUSENTE -->
                  <button
                    type="button"
                    @click="cambiarEstadoAsistencia(asis, 'AUSENTE')"
                    :class="[
                      'flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                      asis.estadoAsistencia === 'AUSENTE'
                        ? 'bg-rose-600 text-white shadow-xs scale-102'
                        : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50/50'
                    ]"
                  >
                    <XCircle class="w-3.5 h-3.5" />
                    <span>Ausente</span>
                  </button>

                  <!-- Botón JUSTIFICADO -->
                  <button
                    type="button"
                    @click="cambiarEstadoAsistencia(asis, 'JUSTIFICADO')"
                    :class="[
                      'flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                      asis.estadoAsistencia === 'JUSTIFICADO'
                        ? 'bg-amber-600 text-white shadow-xs scale-102'
                        : 'text-slate-600 hover:text-amber-800 hover:bg-amber-50/50'
                    ]"
                  >
                    <AlertCircle class="w-3.5 h-3.5" />
                    <span>Justif.</span>
                  </button>
                </div>
              </div>

              <!-- Col 3: Observación Correspondiente Editable & Chips Rápidos -->
              <div class="lg:col-span-3 space-y-1.5">
                <div class="relative">
                  <input
                    :value="asis.observacion"
                    @input="setObservacion(asis, $event.target.value)"
                    type="text"
                    placeholder="Escribir observación..."
                    :class="[
                      'w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white transition-colors',
                      !asis.observacion && (asis.estadoAsistencia === 'AUSENTE' || asis.estadoAsistencia === 'JUSTIFICADO')
                        ? 'border-amber-400 bg-amber-50/40 text-amber-900 placeholder:text-amber-600'
                        : 'border-slate-300 text-slate-800'
                    ]"
                  />
                  <!-- Alerta si falta observación para ausente/justificado -->
                  <span
                    v-if="!asis.observacion && asis.estadoAsistencia !== 'PRESENTE'"
                    class="text-[10px] font-semibold text-amber-700 block mt-0.5"
                  >
                    * Indicar motivo de inasistencia
                  </span>
                </div>

                <!-- Chips de Atajo Rápido (1-Click Presets) -->
                <div class="flex items-center gap-1 flex-wrap">
                  <button
                    v-for="preset in observacionesFrecuentes.slice(0, 3)"
                    :key="preset"
                    @click="appendObservacion(asis, preset)"
                    class="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 font-medium transition-colors"
                  >
                    + {{ preset }}
                  </button>
                </div>
              </div>

              <!-- Col 4: Disponibilidad Finde (Sáb / Dom) + Quitar -->
              <div class="lg:col-span-2 flex items-center justify-start lg:justify-end gap-1.5">
                <button
                  type="button"
                  @click="toggleDisponibilidad(asis, 'disponibleSabado')"
                  :class="[
                    'px-2 py-1 rounded-md text-xs font-bold transition-all border',
                    asis.disponibleSabado
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                  ]"
                  title="Disponible para partidos del Sábado"
                >
                  Sáb {{ asis.disponibleSabado ? '✓' : '✗' }}
                </button>

                <button
                  type="button"
                  @click="toggleDisponibilidad(asis, 'disponibleDomingo')"
                  :class="[
                    'px-2 py-1 rounded-md text-xs font-bold transition-all border',
                    asis.disponibleDomingo
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                  ]"
                  title="Disponible para partidos del Domingo"
                >
                  Dom {{ asis.disponibleDomingo ? '✓' : '✗' }}
                </button>

                <button
                  type="button"
                  @click="quitarArbitroDeReunion(asis)"
                  class="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Quitar de esta sesión"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty Filter / Planilla State -->
        <div v-if="asistenciasFiltradas.length === 0" class="p-12 text-center text-slate-500 text-xs space-y-3">
          <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users class="w-6 h-6" />
          </div>
          <div v-if="reunion.asistencias.length === 0" class="space-y-2">
            <p class="font-bold text-slate-800 text-sm">No hay árbitros registrados en la planilla de esta sesión.</p>
            <p class="text-slate-500 max-w-md mx-auto">Podes ir incorporando árbitros uno a uno usando el buscador rápido superior o abriendo el padrón general.</p>
            <button
              type="button"
              @click="isModalAgregarArbitrosOpen = true"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <UserPlus class="w-4 h-4" />
              <span>Abrir Padrón para Agregar</span>
            </button>
          </div>
          <div v-else>
            <p>No hay árbitros que coincidan con los filtros aplicados.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- TAB 2: TEMAS TRATADOS EN LA REUNIÓN (ORDEN DEL DÍA & NOTAS) -->
    <!-- ============================================================= -->
    <div v-show="activeTab === 'temas'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Temas Charlados en la Sesión</h2>
          <p class="text-xs text-slate-500">Registro pormenorizado del orden del día, debate reglamentario y conclusiones técnicas.</p>
        </div>
        <button
          @click="abrirNuevoTema"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus class="w-4 h-4" />
          <span>Registrar Nuevo Tema</span>
        </button>
      </div>

      <!-- Topics List -->
      <div class="space-y-3">
        <div
          v-for="(tema, idx) in reunion.temas"
          :key="tema.idTema"
          class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 relative group"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-start gap-3">
              <span class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                #{{ idx + 1 }}
              </span>
              <div>
                <h3 class="font-bold text-base text-slate-900">{{ tema.titulo }}</h3>
                <div class="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span class="flex items-center gap-1">
                    <Clock class="w-3.5 h-3.5 text-slate-400" />
                    {{ tema.tiempoMinutos || 20 }} minutos de charla
                  </span>
                  <a
                    v-if="tema.urlMaterial"
                    :href="tema.urlMaterial"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-emerald-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    <ExternalLink class="w-3.5 h-3.5" />
                    <span>Ver material pedagógico</span>
                  </a>
                </div>
              </div>
            </div>

            <!-- Action buttons for topics -->
            <div class="flex items-center gap-1">
              <button
                @click="handleMoverTema(tema.idTema, 'up')"
                :disabled="idx === 0"
                class="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                title="Mover arriba"
              >
                <ArrowUp class="w-4 h-4" />
              </button>
              <button
                @click="handleMoverTema(tema.idTema, 'down')"
                :disabled="idx === (reunion.temas.length - 1)"
                class="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                title="Mover abajo"
              >
                <ArrowDown class="w-4 h-4" />
              </button>
              <button
                @click="abrirEditarTema(tema)"
                class="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                title="Editar tema"
              >
                <Edit3 class="w-4 h-4" />
              </button>
              <button
                @click="handleBorrarTema(tema.idTema, tema.titulo)"
                class="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                title="Eliminar tema"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Description & Debate Notes -->
          <div class="pl-10 space-y-2">
            <div v-if="tema.descripcion" class="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span class="font-bold text-slate-900 block mb-1 text-[11px] uppercase tracking-wider">Notas del Debate:</span>
              {{ tema.descripcion }}
            </div>

            <!-- Conclusions / Unified Criteria -->
            <div v-if="tema.conclusiones" class="text-xs text-emerald-950 bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 flex items-start gap-2">
              <CheckCircle2 class="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span class="font-bold text-emerald-900 block mb-0.5 text-[11px] uppercase tracking-wider">Criterio Unificado / Directiva Oficial:</span>
                {{ tema.conclusiones }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="!reunion.temas || reunion.temas.length === 0" class="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
          <p class="text-xs text-slate-500 mb-2">No se han registrado temas en esta reunión aún.</p>
          <button
            @click="abrirNuevoTema"
            class="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
          >
            + Agregar Primer Tema
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- TAB 3: DISPONIBILIDAD FIN DE SEMANA (DESIGNADOR ARBITRAL) -->
    <!-- ============================================================= -->
    <div v-show="activeTab === 'disponibilidad'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Reporte de Disponibilidad para Designaciones</h2>
          <p class="text-xs text-slate-500">Mapeo de árbitros confirmados para la fecha del fin de semana (sábado y domingo).</p>
        </div>
        <button
          @click="copiarDesignaciones"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-xs transition-colors"
        >
          <Copy class="w-3.5 h-3.5 text-slate-500" />
          <span>Copiar al Portapapeles</span>
        </button>
      </div>

      <!-- 4 Quadrants Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 1. Disponibles Ambos Días (Ideal para terna principal) -->
        <div class="bg-white rounded-xl border border-emerald-200 p-5 shadow-xs space-y-3">
          <div class="flex items-center justify-between border-b border-emerald-100 pb-2">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h3 class="text-sm font-bold text-slate-900">Disponibles Ambos Días (Sáb y Dom)</h3>
            </div>
            <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {{ disponibilidadGrupos.ambos.length }}
            </span>
          </div>

          <ul class="divide-y divide-slate-100 max-h-72 overflow-y-auto text-xs">
            <li v-for="a in disponibilidadGrupos.ambos" :key="a.idAsistencia" class="py-2 flex items-center justify-between">
              <div>
                <span class="font-semibold text-slate-900">{{ a.arbitro?.nombre }}</span>
                <span class="text-slate-500 block text-[11px]">{{ a.arbitro?.categoria }}</span>
              </div>
              <BadgeEstado :estado="a.estadoAsistencia" size="sm" />
            </li>
            <li v-if="disponibilidadGrupos.ambos.length === 0" class="py-4 text-center text-slate-400">
              Sin árbitros con disponibilidad completa
            </li>
          </ul>
        </div>

        <!-- 2. Solo Sábado -->
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <h3 class="text-sm font-bold text-slate-900">Solo Sábado</h3>
            </div>
            <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              {{ disponibilidadGrupos.soloSabado.length }}
            </span>
          </div>

          <ul class="divide-y divide-slate-100 max-h-72 overflow-y-auto text-xs">
            <li v-for="a in disponibilidadGrupos.soloSabado" :key="a.idAsistencia" class="py-2 flex items-center justify-between">
              <div>
                <span class="font-semibold text-slate-900">{{ a.arbitro?.nombre }}</span>
                <span class="text-slate-500 block text-[11px]">{{ a.arbitro?.categoria }}</span>
              </div>
              <BadgeEstado :estado="a.estadoAsistencia" size="sm" />
            </li>
            <li v-if="disponibilidadGrupos.soloSabado.length === 0" class="py-4 text-center text-slate-400">
              Ninguno
            </li>
          </ul>
        </div>

        <!-- 3. Solo Domingo -->
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <h3 class="text-sm font-bold text-slate-900">Solo Domingo</h3>
            </div>
            <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
              {{ disponibilidadGrupos.soloDomingo.length }}
            </span>
          </div>

          <ul class="divide-y divide-slate-100 max-h-72 overflow-y-auto text-xs">
            <li v-for="a in disponibilidadGrupos.soloDomingo" :key="a.idAsistencia" class="py-2 flex items-center justify-between">
              <div>
                <span class="font-semibold text-slate-900">{{ a.arbitro?.nombre }}</span>
                <span class="text-slate-500 block text-[11px]">{{ a.arbitro?.categoria }}</span>
              </div>
              <BadgeEstado :estado="a.estadoAsistencia" size="sm" />
            </li>
            <li v-if="disponibilidadGrupos.soloDomingo.length === 0" class="py-4 text-center text-slate-400">
              Ninguno
            </li>
          </ul>
        </div>

        <!-- 4. No Disponibles -->
        <div class="bg-white rounded-xl border border-rose-200 p-5 shadow-xs space-y-3">
          <div class="flex items-center justify-between border-b border-rose-100 pb-2">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <h3 class="text-sm font-bold text-slate-900">No Disponibles el Fin de Semana</h3>
            </div>
            <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
              {{ disponibilidadGrupos.noDisponibles.length }}
            </span>
          </div>

          <ul class="divide-y divide-slate-100 max-h-72 overflow-y-auto text-xs">
            <li v-for="a in disponibilidadGrupos.noDisponibles" :key="a.idAsistencia" class="py-2 flex items-start justify-between gap-2">
              <div>
                <span class="font-semibold text-slate-900">{{ a.arbitro?.nombre }}</span>
                <span class="text-rose-700 block text-[11px] font-medium">Motivo: {{ a.observacion || 'Sin justificación' }}</span>
              </div>
              <BadgeEstado :estado="a.estadoAsistencia" size="sm" />
            </li>
            <li v-if="disponibilidadGrupos.noDisponibles.length === 0" class="py-4 text-center text-slate-400">
              Todos con al menos un día disponible
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- TAB 4: ACTA OFICIAL IMPRIMIBLE (DOCUMENTO INSTITUCIONAL) -->
    <!-- ============================================================= -->
    <div v-show="activeTab === 'acta'" class="bg-white rounded-2xl border border-slate-300 p-8 sm:p-12 shadow-sm space-y-8 font-serif">
      <!-- Formal Document Header -->
      <div class="border-b-2 border-slate-900 pb-6 flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold uppercase tracking-wider text-slate-900 font-sans">
            Acta Oficial de Sesión Arbitral
          </h2>
          <p class="text-sm text-slate-600 font-sans mt-0.5">
            Colegio de Árbitros de Fútbol • Departamento Técnico & Disciplinario
          </p>
        </div>
        <div class="text-right font-sans text-xs text-slate-500">
          <div class="font-bold text-slate-800 font-mono">ACTA Nº {{ reunion.idReunion }}</div>
          <div>{{ formatDate(reunion.fecha) }}</div>
        </div>
      </div>

      <!-- Formal Meta -->
      <div class="font-sans grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div>
          <strong class="text-slate-800">Convocatoria:</strong> {{ reunion.titulo }}
        </div>
        <div>
          <strong class="text-slate-800">Lugar de Sesión:</strong> {{ reunion.lugar }}
        </div>
        <div>
          <strong class="text-slate-800">Quórum Registrado:</strong> {{ metricas.presentes }} Presentes / {{ metricas.ausentes }} Ausentes / {{ metricas.justificados }} Justificados ({{ metricas.porcentajeAsistencia }}%)
        </div>
        <div>
          <strong class="text-slate-800">Estado de Acta:</strong> {{ reunion.editable ? 'Borrador en Curso' : 'Cerrada y Aprobada' }}
        </div>
      </div>

      <!-- Section I: Temas Tratados -->
      <div class="space-y-4">
        <h3 class="text-base font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 font-sans">
          I. Orden del Día y Temas Tratados
        </h3>
        <div class="space-y-4 font-sans text-xs">
          <div v-for="(tema, idx) in reunion.temas" :key="tema.idTema" class="space-y-1">
            <h4 class="font-bold text-slate-900">
              {{ idx + 1 }}. {{ tema.titulo }} ({{ tema.tiempoMinutos }} min)
            </h4>
            <p v-if="tema.descripcion" class="text-slate-700 pl-4 border-l-2 border-slate-300">
              {{ tema.descripcion }}
            </p>
            <p v-if="tema.conclusiones" class="text-emerald-900 pl-4 border-l-2 border-emerald-600 font-medium">
              Directiva acordada: {{ tema.conclusiones }}
            </p>
          </div>
        </div>
      </div>

      <!-- Section II: Planilla Oficial de Asistencia con Observaciones -->
      <div class="space-y-4">
        <h3 class="text-base font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 font-sans">
          II. Nómina de Asistencia y Observaciones
        </h3>
        <table class="w-full text-left font-sans text-xs border border-slate-200">
          <thead class="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
            <tr>
              <th class="p-2">Árbitro</th>
              <th class="p-2">Categoría</th>
              <th class="p-2">Estado</th>
              <th class="p-2">Observación Individual</th>
              <th class="p-2 text-center">Finde (S/D)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="a in reunion.asistencias" :key="a.idAsistencia">
              <td class="p-2 font-semibold text-slate-900">{{ a.arbitro?.nombre }}</td>
              <td class="p-2 text-slate-600">{{ a.arbitro?.categoria }}</td>
              <td class="p-2">
                <span
                  :class="[
                    'font-bold',
                    a.estadoAsistencia === 'PRESENTE' && 'text-emerald-700',
                    a.estadoAsistencia === 'AUSENTE' && 'text-rose-700',
                    a.estadoAsistencia === 'JUSTIFICADO' && 'text-amber-700'
                  ]"
                >
                  {{ a.estadoAsistencia }}
                </span>
              </td>
              <td class="p-2 text-slate-700 italic">
                {{ a.observacion || '-' }}
              </td>
              <td class="p-2 text-center font-mono">
                {{ a.disponibleSabado ? 'S' : '-' }} / {{ a.disponibleDomingo ? 'D' : '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Formal Signatures -->
      <div class="pt-16 grid grid-cols-2 gap-12 text-center font-sans text-xs">
        <div class="border-t border-slate-400 pt-2">
          <div class="font-bold text-slate-900">Secretario Técnico</div>
          <div class="text-slate-500">Colegio de Árbitros</div>
        </div>
        <div class="border-t border-slate-400 pt-2">
          <div class="font-bold text-slate-900">Presidente del Colegio</div>
          <div class="text-slate-500">Asociación Oficial</div>
        </div>
      </div>
    </div>

    <!-- Modal Nuevo / Editar Tema -->
    <ModalNuevoTema
      :isOpen="isModalTemaOpen"
      :temaEditar="temaAEditar"
      @close="isModalTemaOpen = false"
      @save="handleSaveTema"
    />

    <!-- Modal Agregar Árbitros del Padrón -->
    <ModalAgregarArbitros
      :isOpen="isModalAgregarArbitrosOpen"
      :arbitrosPadron="arbitros"
      :asistenciasActuales="reunion?.asistencias || []"
      @close="isModalAgregarArbitrosOpen = false"
      @agregar="handleAgregarArbitro"
      @agregarMultiples="handleAgregarMultiples"
    />
  </div>

  <!-- Loading / Not Found -->
  <div v-else class="text-center py-16">
    <ShieldAlert class="w-12 h-12 mx-auto text-amber-500 mb-3" />
    <h2 class="text-lg font-bold text-slate-900">Reunión no encontrada</h2>
    <p class="text-xs text-slate-500 mt-1">El identificador de la reunión no corresponde a ningún registro activo.</p>
    <router-link
      to="/"
      class="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
    >
      <ArrowLeft class="w-4 h-4" />
      <span>Volver al listado</span>
    </router-link>
  </div>
</template>
