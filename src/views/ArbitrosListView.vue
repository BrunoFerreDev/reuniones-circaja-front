<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { arbitros, reuniones } from "../stores/reunionesStore";
import { apiGetArbitros } from "../services/api";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Server,
} from "lucide-vue-next";

const searchQuery = ref("");
const categoriaFilter = ref("TODAS");

// Paginación y control
const currentPage = ref(0);
const pageSize = ref(10);
const isApiConnected = ref(false);
const isLoading = ref(false);

const apiError = ref(null);

async function cargarArbitrosDesdeApi() {
  isLoading.value = true;
  apiError.value = null;
  try {
    const data = await apiGetArbitros(0, 100);
    if (data && Array.isArray(data.content)) {
      // Ignorar todos los que su estadoSistema es false
      arbitros.value = data.content.filter(a => a.estadoSistema !== false);
      isApiConnected.value = true;
    } else if (Array.isArray(data)) {
      arbitros.value = data.filter(a => a.estadoSistema !== false);
      isApiConnected.value = true;
    } else {
      arbitros.value = [];
    }
  } catch (err) {
    isApiConnected.value = false;
    arbitros.value = [];
    apiError.value = `No se pudo conectar con el backend (${err.message}). Verifica que el servidor Spring Boot esté corriendo en ${import.meta.env.VITE_BASE_URL || "http://localhost:8081/"}.`;
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  cargarArbitrosDesdeApi();
});

watch([searchQuery, categoriaFilter, pageSize], () => {
  currentPage.value = 0;
});

// Modal to create referee
const isModalOpen = ref(false);
const nuevoArbitro = ref({
  nombre: "",
  documento: "",
  categoria: "Principal Provincial",
  email: "",
  telefono: "",
  activo: true,
});

const categoriasList = computed(() => {
  const set = new Set(arbitros.value.map(a => a.categoria).filter(Boolean));
  if (set.size === 0) {
    return ['ASISTENTE', 'AVANZADO', 'PRINCIPAL_1', 'PRINCIPAL_2'];
  }
  return Array.from(set);
});

const arbitrosFiltrados = computed(() => {
  return arbitros.value.filter(a => {
    // Ignorar si estadoSistema es false
    if (a.estadoSistema === false) return false;

    const q = searchQuery.value.toLowerCase();
    const fullName = `${a.nombre || ''} ${a.apellido || ''}`.toLowerCase();
    const matchSearch =
      fullName.includes(q) ||
      (a.categoria || '').toLowerCase().includes(q) ||
      (a.whatsapp || '').includes(q) ||
      (a.documento || '').includes(q);

    if (!matchSearch) return false;

    if (categoriaFilter.value !== 'TODAS' && a.categoria !== categoriaFilter.value) {
      return false;
    }

    return true;
  });
});

const totalElements = computed(() => arbitrosFiltrados.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(arbitrosFiltrados.value.length / pageSize.value)));

const arbitrosPaginados = computed(() => {
  const start = currentPage.value * pageSize.value;
  return arbitrosFiltrados.value.slice(start, start + pageSize.value);
});

function getStatsArbitro(idArbitro) {
  let convocatorias = 0;
  let presentes = 0;
  let justificados = 0;
  let ausentes = 0;

  reuniones.value.forEach((r) => {
    const registro = r.asistencias?.find(
      (as) => as.arbitro?.idArbitro === idArbitro,
    );
    if (registro) {
      convocatorias++;
      if (registro.estadoAsistencia === "PRESENTE") presentes++;
      else if (registro.estadoAsistencia === "JUSTIFICADO") justificados++;
      else ausentes++;
    }
  });

  const porcentaje =
    convocatorias > 0 ? Math.round((presentes / convocatorias) * 100) : 0;
  return { convocatorias, presentes, justificados, ausentes, porcentaje };
}


function handleGuardarArbitro() {
  if (!nuevoArbitro.value.nombre.trim() || !nuevoArbitro.value.documento.trim())
    return;

  arbitros.value.push({
    idArbitro: Date.now(),
    ...nuevoArbitro.value,
  });

  nuevoArbitro.value = {
    nombre: "",
    documento: "",
    categoria: "Principal Provincial",
    email: "",
    telefono: "",
    activo: true,
  };
  isModalOpen.value = false;
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <div
          class="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1"
        >
          <span>Colegio de Árbitros</span>
          <span>•</span>
          <span>Padrón Oficial</span>
        </div>
        <h1
          class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900"
        >
          Plantel de Árbitros
        </h1>
        <p class="text-sm text-slate-600 mt-1 max-w-2xl">
          Nómina de colegiados habilitados, categorías federativas y
          estadísticas históricas de asistencia a reuniones técnicas.
        </p>
      </div>

      <button
        @click="isModalOpen = true"
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition-colors self-start sm:self-auto"
      >
        <Plus class="w-4 h-4" />
        <span>Registrar Árbitro</span>
      </button>
    </div>

    <!-- Toolbar Filters -->
    <div
      class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between"
    >
      <div class="relative w-full sm:w-80">
        <Search
          class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nombre, DNI o categoría..."
          class="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-slate-900"
        />
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <select
          v-model="categoriaFilter"
          class="w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-700"
        >
          <option value="TODAS">Todas las Categorías</option>
          <option v-for="cat in categoriasList" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
      </div>
    </div>

    <!-- Referees Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="arb in arbitrosPaginados"
        :key="arb.idArbitro"
        class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
      >
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div
                class="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-sm flex items-center justify-center shrink-0"
              >
                {{
                  (((arb.nombre || '')[0] || '') + ((arb.apellido || '')[0] || '')).toUpperCase() || 'AR'
                }}
              </div>
              <div>
                <h3
                  class="font-bold text-slate-900 text-sm sm:text-base leading-snug"
                >
                  {{ arb.nombre + " " + (arb.apellido || '') }}
                </h3>
                <span class="text-xs font-mono text-slate-500"
                  >WhatsApp: {{ arb.whatsapp || 'Sin registrar' }}</span
                >
              </div>
            </div>

            <span
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold"
              title="Árbitro activo en el sistema"
            >
              <UserCheck class="w-3.5 h-3.5 text-emerald-600" />
              <span>Activo</span>
            </span>
          </div>

          <!-- Category Badge -->
          <div>
            <span
              class="inline-block px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold"
            >
              {{ arb.categoria }}
            </span>
          </div>

          <!-- Contact Details -->
          <div
            class="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100"
          >
            <div v-if="arb.email" class="flex items-center gap-2 truncate">
              <Mail class="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span class="truncate">{{ arb.email }}</span>
            </div>
            <div v-if="arb.telefono" class="flex items-center gap-2">
              <Phone class="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{{ arb.telefono }}</span>
            </div>
          </div>
        </div>

        <!-- Attendance Stats in Meetings -->
        <div
          class="pt-3 border-t border-slate-100 bg-slate-50/60 -mx-5 -mb-5 p-4 rounded-b-xl"
        >
          <div class="flex items-center justify-between text-xs mb-1.5">
            <span class="font-medium text-slate-600"
              >Asistencia a Sesiones:</span
            >
            <span class="font-mono font-bold text-emerald-700">
              {{ getStatsArbitro(arb.idArbitro).porcentaje }}%
            </span>
          </div>
          <div
            class="flex items-center gap-2 text-[11px] text-slate-500 font-mono"
          >
            <span class="text-emerald-700 font-bold"
              >✓ {{ getStatsArbitro(arb.idArbitro).presentes }} P</span
            >
            <span>•</span>
            <span class="text-rose-700 font-bold"
              >✗ {{ getStatsArbitro(arb.idArbitro).ausentes }} A</span
            >
            <span>•</span>
            <span class="text-amber-700 font-bold"
              >! {{ getStatsArbitro(arb.idArbitro).justificados }} J</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Paginación (Page<GetArbitroDTO>) & Estado API -->
    <div
      class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      <div class="flex items-center gap-2 text-xs text-slate-500">
        <span
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium"
          :class="
            isApiConnected
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          "
        >
          <Server class="w-3 h-3" />
          <span>{{
            isApiConnected
              ? "API Conectada: /arbitros"
              : "Modo Offline / LocalStorage"
          }}</span>
        </span>
        <span
          >Total:
          <strong class="text-slate-800 font-mono">{{ totalElements }}</strong>
          colegiados</span
        >
      </div>

      <div class="flex items-center gap-3">
        <!-- Page size selector -->
        <div class="flex items-center gap-1.5 text-xs text-slate-600">
          <span>Filas:</span>
          <select
            v-model.number="pageSize"
            class="px-2 py-1 rounded border border-slate-200 text-xs bg-slate-50 font-mono"
          >
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
          </select>
        </div>

        <!-- Page switcher -->
        <div class="flex items-center gap-1">
          <button
            @click="currentPage = Math.max(0, currentPage - 1)"
            :disabled="currentPage === 0 || isLoading"
            class="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            title="Página anterior"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>

          <span class="px-2 text-xs font-mono font-medium text-slate-700">
            Pág. {{ currentPage + 1 }} / {{ Math.max(1, totalPages) }}
          </span>

          <button
            @click="currentPage = Math.min(totalPages - 1, currentPage + 1)"
            :disabled="currentPage >= totalPages - 1 || isLoading"
            class="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            title="Página siguiente"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Registrar Árbitro -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      @click.self="isModalOpen = false"
    >
      <div
        class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200"
      >
        <h3 class="font-bold text-slate-900 text-lg mb-1">
          Registrar Nuevo Árbitro
        </h3>
        <p class="text-xs text-slate-500 mb-4">
          Incorporar colegiado al padrón del colegio arbitral.
        </p>

        <form @submit.prevent="handleGuardarArbitro" class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1"
              >Nombre y Apellido *</label
            >
            <input
              v-model="nuevoArbitro.nombre"
              type="text"
              required
              placeholder="Ej: Germán Delfino"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1"
              >Documento de Identidad (DNI) *</label
            >
            <input
              v-model="nuevoArbitro.documento"
              type="text"
              required
              placeholder="Ej: 35.120.944"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1"
              >Categoría Arbitral *</label
            >
            <select
              v-model="nuevoArbitro.categoria"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option v-for="cat in categoriasList" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1"
              >Correo Electrónico</label
            >
            <input
              v-model="nuevoArbitro.email"
              type="email"
              placeholder="arbitro@ejemplo.org"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1"
              >Teléfono</label
            >
            <input
              v-model="nuevoArbitro.telefono"
              type="text"
              placeholder="+54 9 11 ..."
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div
            class="pt-4 flex items-center justify-end gap-2 border-t border-slate-100"
          >
            <button
              type="button"
              @click="isModalOpen = false"
              class="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              Registrar Árbitro
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
