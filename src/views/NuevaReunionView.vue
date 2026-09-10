<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { crearReunion, arbitros, loadArbitros, loading, error } from '../stores/reunionesStore';
import {
  Calendar,
  MapPin,
  FileText,
  Plus,
  Trash2,
  ArrowLeft,
  Users,
  CheckCircle2,
  Loader2
} from 'lucide-vue-next';

const router = useRouter();

onMounted(() => {
  loadArbitros(0, 100);
});

// Default date/time: today at current hour + 00 minutes
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const defaultDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`;

const form = ref({
  titulo: '',
  fecha: defaultDate,
  lugar: 'Sede Central Colegio de Árbitros - Aula Técnica',
  observaciones: 'Sesión ordinaria de actualización reglamentaria y designaciones para el fin de semana.',
  sincronizarArbitrosActivos: true,
  temas: [
    {
      idTema: Date.now(),
      titulo: 'Criterio disciplinario y control de incidentes',
      descripcion: 'Análisis de jugadas de la fecha anterior e instrucciones para árbitros principales y asistentes.',
      orden: 1,
      tiempoMinutos: 30,
      urlMaterial: '',
      conclusiones: ''
    }
  ]
});

const arbitrosActivos = computed(() => arbitros.value.filter(a => a.estadoSistema !== false));

function agregarTema() {
  form.value.temas.push({
    idTema: Date.now() + Math.random(),
    titulo: '',
    descripcion: '',
    orden: form.value.temas.length + 1,
    tiempoMinutos: 20,
    urlMaterial: '',
    conclusiones: ''
  });
}

function eliminarTema(index) {
  form.value.temas.splice(index, 1);
  form.value.temas.forEach((t, i) => (t.orden = i + 1));
}

async function guardarReunion() {
  if (!form.value.titulo.trim()) return;

  const validTemas = form.value.temas
    .filter(t => t.titulo.trim())
    .map((t, idx) => ({
      titulo: t.titulo,
      descripcion: t.descripcion || '',
      orden: idx + 1,
      tiempoMinutos: t.tiempoMinutos || 20,
      urlMaterial: t.urlMaterial || '',
      conclusiones: t.conclusiones || ''
    }));

  try {
    const nueva = await crearReunion({
      titulo: form.value.titulo,
      fecha: form.value.fecha,
      lugar: form.value.lugar,
      observaciones: form.value.observaciones,
      sincronizarArbitrosActivos: form.value.sincronizarArbitrosActivos,
      temas: validTemas
    });

    if (nueva && nueva.idReunion) {
      router.push(`/reuniones/${nueva.idReunion}`);
    } else {
      router.push('/');
    }
  } catch (err) {
    alert(`Error al crear reunión: ${err.message}`);
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Top Navigation -->
    <div class="flex items-center justify-between">
      <router-link
        to="/"
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        <span>Volver a Reuniones</span>
      </router-link>
    </div>

    <!-- Main Card -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <!-- Card Header -->
      <div class="p-6 border-b border-slate-100 bg-slate-50/50">
        <div class="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
          <span>Nueva Convocatoria</span>
          <span>•</span>
          <span>Colegio de Árbitros</span>
        </div>
        <h1 class="text-2xl font-bold text-slate-900">Programar Sesión Arbitral</h1>
        <p class="text-sm text-slate-500 mt-1">
          Configura fecha, sede y temario inicial. La nómina de {{ arbitrosActivos.length }} árbitros activos se asociará automáticamente a la planilla de asistencia.
        </p>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="guardarReunion" class="p-6 space-y-6">
        <!-- General Details -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-slate-700 mb-1.5">
              Título de la Reunión *
            </label>
            <input
              v-model="form.titulo"
              type="text"
              required
              placeholder="Ej: Reunión Técnica Semanal - Fecha 9 Torneo Oficial"
              class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Calendar class="w-3.5 h-3.5 text-slate-400" />
              <span>Fecha y Hora *</span>
            </label>
            <input
              v-model="form.fecha"
              type="datetime-local"
              required
              class="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <MapPin class="w-3.5 h-3.5 text-slate-400" />
              <span>Lugar / Sede *</span>
            </label>
            <input
              v-model="form.lugar"
              type="text"
              required
              placeholder="Ej: Sede Central Colegio de Árbitros"
              class="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <FileText class="w-3.5 h-3.5 text-slate-400" />
              <span>Observaciones Generales de la Convocatoria</span>
            </label>
            <textarea
              v-model="form.observaciones"
              rows="2"
              placeholder="Notas generales, recordatorios de indumentaria, plazos de entrega de informes..."
              class="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
            ></textarea>
          </div>
        </div>

        <!-- Initial Topics Section -->
        <div class="pt-4 border-t border-slate-100">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="text-sm font-bold text-slate-900">Temario Inicial (Orden del Día)</h3>
              <p class="text-xs text-slate-500">Puedes sumar más temas durante el transcurso de la reunión.</p>
            </div>
            <button
              type="button"
              @click="agregarTema"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Agregar Tema</span>
            </button>
          </div>

          <div class="space-y-3">
            <div
              v-for="(tema, idx) in form.temas"
              :key="tema.idTema"
              class="p-4 rounded-xl bg-slate-50 border border-slate-200 relative group space-y-2"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                  Tema #{{ idx + 1 }}
                </span>
                <button
                  type="button"
                  @click="eliminarTema(idx)"
                  class="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                  title="Eliminar tema"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div class="sm:col-span-2">
                  <input
                    v-model="tema.titulo"
                    type="text"
                    required
                    placeholder="Título del tema (ej. Análisis de Fuera de Juego)"
                    class="w-full px-3 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>
                <div>
                  <input
                    v-model.number="tema.tiempoMinutos"
                    type="number"
                    placeholder="Minutos"
                    class="w-full px-3 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500 bg-white font-mono"
                  />
                </div>
              </div>

              <textarea
                v-model="tema.descripcion"
                rows="2"
                placeholder="Puntos a debatir y material a proyectar..."
                class="w-full px-3 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500 bg-white"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Automatic Referees Notice -->
        <div class="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
          <Users class="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div class="text-xs text-emerald-900">
            <span class="font-bold">Asignación automática de padrón:</span>
            Se incluirán los <strong>{{ arbitrosActivos.length }} árbitros activos</strong> registrados en el sistema, listos para marcar asistencia (Presente, Ausente, Justificado) y registrar observaciones individuales al iniciar la sesión.
          </div>
        </div>

        <!-- Submit Buttons -->
        <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <router-link
            to="/"
            class="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </router-link>
          <button
            type="submit"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition-colors"
          >
            <CheckCircle2 class="w-4 h-4" />
            <span>Crear Reunión y Abrir Planilla</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
