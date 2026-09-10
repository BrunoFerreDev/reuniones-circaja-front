<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import {
  reuniones,
  arbitros,
  loading,
  error,
  reunionesPagination,
  loadReuniones,
  buscarReunionesPorFechas,
  loadArbitros,
  eliminarReunion,
  getMetricasReunion,
} from "../stores/reunionesStore";
import StatCard from "../components/StatCard.vue";
import BadgeEstado from "../components/BadgeEstado.vue";
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  MapPin,
  Users,
  PlusCircle,
  Search,
  BookOpen,
  ArrowRight,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  Server,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from "lucide-vue-next";

const router = useRouter();
const searchQuery = ref("");
const statusFilter = ref("TODAS"); // 'TODAS' | 'ACTIVAS' | 'FINALIZADAS'

// Filtro por rango de fechas (/reuniones/buscar)
const fechaInicio = ref("");
const fechaFin = ref("");
const filtroFechasActivo = ref(false);
const searchingDates = ref(false);

onMounted(() => {
  loadReuniones(0, 10);
  loadArbitros(0, 100);
});

async function handleBuscarPorFechas() {
  if (!fechaInicio.value && !fechaFin.value) return;
  filtroFechasActivo.value = true;
  searchingDates.value = true;
  try {
    await buscarReunionesPorFechas(
      fechaInicio.value,
      fechaFin.value,
      0,
      reunionesPagination.value.size
    );
  } catch (err) {
    console.error("Error al buscar reuniones por fecha:", err);
  } finally {
    searchingDates.value = false;
  }
}

async function handleLimpiarFiltroFechas() {
  fechaInicio.value = "";
  fechaFin.value = "";
  filtroFechasActivo.value = false;
  await loadReuniones(0, reunionesPagination.value.size);
}

function recargar() {
  if (filtroFechasActivo.value) {
    buscarReunionesPorFechas(
      fechaInicio.value,
      fechaFin.value,
      reunionesPagination.value.page,
      reunionesPagination.value.size
    );
  } else {
    loadReuniones(reunionesPagination.value.page, reunionesPagination.value.size);
  }
  loadArbitros(0, 100);
}

function cambiarPagina(delta) {
  const nueva = reunionesPagination.value.page + delta;
  if (nueva >= 0 && nueva < reunionesPagination.value.totalPages) {
    if (filtroFechasActivo.value) {
      buscarReunionesPorFechas(
        fechaInicio.value,
        fechaFin.value,
        nueva,
        reunionesPagination.value.size
      );
    } else {
      loadReuniones(nueva, reunionesPagination.value.size);
    }
  }
}

const statsGlobales = computed(() => {
  const totalReuniones =
    reunionesPagination.value.totalElements || reuniones.value.length;
  const totalArbitrosActivos = arbitros.value.filter(
    (a) => a.estadoSistema !== false,
  ).length;

  let sumPorcentaje = 0;
  reuniones.value.forEach((r) => {
    const m = getMetricasReunion(r);
    sumPorcentaje += m.porcentajeAsistencia;
  });
  const asistenciaMedia =
    reuniones.value.length > 0
      ? Math.round(sumPorcentaje / reuniones.value.length)
      : 0;
  const reunionesEnCurso = reuniones.value.filter((r) => r.editable).length;

  return {
    totalReuniones,
    totalArbitrosActivos,
    asistenciaMedia,
    reunionesEnCurso,
  };
});

const reunionesFiltradas = computed(() => {
  return reuniones.value.filter((r) => {
    const matchSearch =
      (r.titulo || "")
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase()) ||
      (r.lugar || "").toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (r.temas &&
        r.temas.some((t) =>
          (t.titulo || "")
            .toLowerCase()
            .includes(searchQuery.value.toLowerCase()),
        ));

    if (!matchSearch) return false;

    if (statusFilter.value === "ACTIVAS") return r.editable;
    if (statusFilter.value === "FINALIZADAS") return !r.editable;
    return true;
  });
});

function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function handleDelete(id, titulo) {
  if (confirm(`¿Eliminar reunión "${titulo}" mediante API?`)) {
    try {
      await eliminarReunion(id);
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    }
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <div
          class="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1"
        >
          <span>Colegio de Árbitros</span>
          <span>•</span>
          <span>Gestión de Asambleas</span>
        </div>
        <h1
          class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900"
        >
          Reuniones Técnicas
        </h1>
        <p class="text-sm text-slate-600 mt-1 max-w-2xl">
          Registro de actas, temáticas reglamentarias IFAB debatidas y control
          de asistencia con observaciones individuales.
        </p>
      </div>

      <router-link
        to="/reuniones/nueva"
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition-colors self-start sm:self-auto"
      >
        <PlusCircle class="w-4 h-4" />
        <span>Nueva Reunión</span>
      </router-link>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Reuniones"
        :value="statsGlobales.totalReuniones"
        subtext="en historial"
        variant="slate"
      >
        <template #icon>
          <Calendar class="w-4 h-4 text-slate-400" />
        </template>
      </StatCard>

      <StatCard
        label="Sesiones en Curso"
        :value="statsGlobales.reunionesEnCurso"
        subtext="abiertas"
        variant="emerald"
      >
        <template #icon>
          <Clock class="w-4 h-4 text-emerald-600" />
        </template>
      </StatCard>

      <StatCard
        label="Padrón Árbitros"
        :value="statsGlobales.totalArbitrosActivos"
        subtext="colegiados activos"
        variant="slate"
      >
        <template #icon>
          <Users class="w-4 h-4 text-slate-400" />
        </template>
      </StatCard>

      <StatCard
        label="Asistencia Promedio"
        :value="`${statsGlobales.asistenciaMedia}%`"
        subtext="quórum medio"
        variant="emerald"
      >
        <template #icon>
          <CheckCircle2 class="w-4 h-4 text-emerald-600" />
        </template>
      </StatCard>
    </div>

    <!-- Filters & Search Bar -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
      <div class="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div class="relative w-full md:w-80">
          <Search
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar reunión o tema tratado..."
            class="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 bg-slate-50/50"
          />
        </div>

        <div class="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto justify-start md:justify-end">
          <button
            @click="statusFilter = 'TODAS'"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              statusFilter === 'TODAS'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100',
            ]"
          >
            Todas ({{ reuniones.length }})
          </button>
          <button
            @click="statusFilter = 'ACTIVAS'"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              statusFilter === 'ACTIVAS'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100',
            ]"
          >
            En Curso
          </button>
          <button
            @click="statusFilter = 'FINALIZADAS'"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              statusFilter === 'FINALIZADAS'
                ? 'bg-slate-700 text-white'
                : 'text-slate-600 hover:bg-slate-100',
            ]"
          >
            Finalizadas
          </button>
        </div>
      </div>

      <!-- Date Range Search Bar (/reuniones/buscar) -->
      <form
        @submit.prevent="handleBuscarPorFechas"
        class="pt-3 border-t border-slate-100 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5"
      >
        <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-600 shrink-0">
          <CalendarRange class="w-4 h-4 text-emerald-600" />
          <span>Buscar por fecha:</span>
        </div>

        <div class="flex items-center gap-2 flex-1 sm:flex-initial">
          <div class="relative flex-1 sm:w-40">
            <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Desde</span>
            <input
              v-model="fechaInicio"
              type="date"
              class="w-full pl-14 pr-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
            />
          </div>

          <span class="text-slate-300 text-xs font-medium">—</span>

          <div class="relative flex-1 sm:w-40">
            <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hasta</span>
            <input
              v-model="fechaFin"
              type="date"
              class="w-full pl-14 pr-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="submit"
            :disabled="(!fechaInicio && !fechaFin) || searchingDates"
            class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Loader2 v-if="searchingDates" class="w-3.5 h-3.5 animate-spin" />
            <Search v-else class="w-3.5 h-3.5" />
            <span>Buscar</span>
          </button>

          <button
            v-if="filtroFechasActivo || fechaInicio || fechaFin"
            type="button"
            @click="handleLimpiarFiltroFechas"
            class="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium transition-colors"
            title="Limpiar filtro de fechas"
          >
            <X class="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        </div>

        <!-- Tag indicador de filtro activo -->
        <div
          v-if="filtroFechasActivo"
          class="sm:ml-auto flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md"
        >
          <span>Filtrado:</span>
          <strong class="font-mono">{{ fechaInicio || '*' }}</strong>
          <span>a</span>
          <strong class="font-mono">{{ fechaFin || '*' }}</strong>
        </div>
      </form>
    </div>

    <!-- Meetings List Cards -->
    <div class="space-y-4">
      <div
        v-for="reunion in reunionesFiltradas"
        :key="reunion.idReunion"
        class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all group"
      >
        <div
          class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <!-- Main Meeting Info -->
          <div class="space-y-2 flex-1">
            <div class="flex items-center flex-wrap gap-2">
              <BadgeEstado
                :estado="reunion.editable ? 'EN_CURSO' : 'FINALIZADA'"
              />
              <span
                class="text-xs font-medium text-slate-500 flex items-center gap-1"
              >
                <CalendarDays class="w-3.5 h-3.5" />
                {{ formatDate(reunion.fecha) }}
              </span>
            </div>

            <h2
              class="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors"
            >
              <router-link :to="`/reuniones/${reunion.idReunion}`">
                {{ reunion.titulo }}
              </router-link>
            </h2>

            <div class="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin class="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{{ reunion.lugar }}</span>
            </div>

            <!-- Temas tratados preview -->
            <div
              v-if="reunion.temas && reunion.temas.length"
              class="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 items-center"
            >
              <span
                class="text-xs font-medium text-slate-500 flex items-center gap-1"
              >
                <BookOpen class="w-3 h-3 text-emerald-600" />
                {{ reunion.temas.length }} temas:
              </span>
              <span
                v-for="tema in reunion.temas.slice(0, 3)"
                :key="tema.idTema"
                class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium truncate max-w-xs"
              >
                {{ tema.titulo }}
              </span>
              <span
                v-if="reunion.temas.length > 3"
                class="text-xs text-slate-400"
              >
                +{{ reunion.temas.length - 3 }} más
              </span>
            </div>
          </div>

          <!-- Attendance Stats & Actions -->
          <div
            class="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100"
          >
            <!-- Attendance Counters Pill -->
            <div class="w-full sm:w-auto">
              <div class="flex items-center gap-3 text-xs">
                <div class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span class="font-mono font-bold text-slate-900">
                    {{ getMetricasReunion(reunion).presentes }}
                  </span>
                  <span class="text-slate-500">presentes</span>
                </div>

                <div class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span class="font-mono font-bold text-slate-900">
                    {{ getMetricasReunion(reunion).ausentes }}
                  </span>
                  <span class="text-slate-500">ausentes</span>
                </div>

                <div class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span class="font-mono font-bold text-slate-900">
                    {{ getMetricasReunion(reunion).justificados }}
                  </span>
                  <span class="text-slate-500">justif.</span>
                </div>
              </div>

              <!-- Quorum Progress Bar -->
              <div
                class="mt-2 w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden flex"
              >
                <div
                  class="bg-emerald-500 transition-all duration-300"
                  :style="{
                    width: `${getMetricasReunion(reunion).porcentajeAsistencia}%`,
                  }"
                ></div>
                <div
                  class="bg-amber-400 transition-all duration-300"
                  :style="{
                    width: `${(getMetricasReunion(reunion).justificados / (getMetricasReunion(reunion).total || 1)) * 100}%`,
                  }"
                ></div>
                <div
                  class="bg-rose-400 transition-all duration-300"
                  :style="{
                    width: `${(getMetricasReunion(reunion).ausentes / (getMetricasReunion(reunion).total || 1)) * 100}%`,
                  }"
                ></div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                @click="handleDelete(reunion.idReunion, reunion.titulo)"
                class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Eliminar reunión"
              >
                <Trash2 class="w-4 h-4" />
              </button>

              <router-link
                :to="`/reuniones/${reunion.idReunion}`"
                :class="[
                  'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors',
                  reunion.editable
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800',
                ]"
              >
                <span>{{
                  reunion.editable
                    ? "Tomar Asistencia & Temas"
                    : "Ver Acta Completa"
                }}</span>
                <ArrowRight class="w-3.5 h-3.5" />
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="reunionesFiltradas.length === 0"
        class="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center"
      >
        <div
          class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3"
        >
          <CalendarDays class="w-6 h-6" />
        </div>
        <h3 class="text-base font-semibold text-slate-900">
          No se encontraron reuniones
        </h3>
        <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No hay registros que coincidan con la búsqueda. Puedes programar una
          nueva sesión técnica.
        </p>
        <router-link
          to="/reuniones/nueva"
          class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
        >
          <PlusCircle class="w-4 h-4" />
          <span>Crear Nueva Reunión</span>
        </router-link>
      </div>
    </div>

    <!-- Paginación de Reuniones (Page<GetReunionResumenDTO>) -->
    <div
      class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      <div class="flex items-center gap-2 text-xs text-slate-500">
        <span
          :class="[
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border',
            filtroFechasActivo
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200',
          ]"
        >
          <Server class="w-3 h-3" />
          <span>{{ filtroFechasActivo ? 'API: /reuniones/buscar' : 'API: /reuniones' }}</span>
        </span>
        <span
          >Total:
          <strong class="text-slate-800 font-mono">{{
            reunionesPagination.totalElements
          }}</strong>
          reuniones</span
        >
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="cambiarPagina(-1)"
          :disabled="reunionesPagination.page === 0 || loading"
          class="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
          title="Página anterior"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>

        <span class="px-2 text-xs font-mono font-medium text-slate-700">
          Pág. {{ reunionesPagination.page + 1 }} /
          {{ Math.max(1, reunionesPagination.totalPages) }}
        </span>

        <button
          @click="cambiarPagina(1)"
          :disabled="
            reunionesPagination.page >= reunionesPagination.totalPages - 1 ||
            loading
          "
          class="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
          title="Página siguiente"
        >
          <ChevronRight class="w-4 h-4" />
        </button>

        <button
          @click="recargar"
          :disabled="loading"
          class="ml-2 p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          title="Recargar desde API"
        >
          <RotateCw :class="['w-4 h-4', loading && 'animate-spin']" />
        </button>
      </div>
    </div>
  </div>
</template>
