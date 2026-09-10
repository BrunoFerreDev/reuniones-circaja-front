<script setup>
import { ref, computed } from 'vue';
import {
  X,
  Search,
  Users,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Filter
} from 'lucide-vue-next';

const props = defineProps({
  isOpen: Boolean,
  arbitrosPadron: {
    type: Array,
    default: () => []
  },
  asistenciasActuales: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'agregar', 'agregarMultiples']);

const searchQuery = ref('');
const categoriaFilter = ref('TODAS');

const arbitrosPadronActivos = computed(() => {
  return props.arbitrosPadron.filter(a => a.estadoSistema !== false);
});

const arbitrosEnReunionIds = computed(() => {
  return new Set(props.asistenciasActuales.map(a => a.arbitro?.idArbitro).filter(Boolean));
});

const categoriasList = computed(() => {
  const set = new Set(arbitrosPadronActivos.value.map(a => a.categoria).filter(Boolean));
  return Array.from(set);
});

const arbitrosProcesados = computed(() => {
  return arbitrosPadronActivos.value.map(arb => {
    const yaRegistrado = arbitrosEnReunionIds.value.has(arb.idArbitro);
    const fullName = `${arb.nombre || ''} ${arb.apellido || ''}`.trim();
    return {
      ...arb,
      fullName,
      yaRegistrado
    };
  });
});

const arbitrosFiltrados = computed(() => {
  return arbitrosProcesados.value.filter(arb => {
    const q = searchQuery.value.toLowerCase();
    const matchSearch =
      arb.fullName.toLowerCase().includes(q) ||
      (arb.categoria || '').toLowerCase().includes(q) ||
      (arb.whatsapp || '').includes(q);

    if (!matchSearch) return false;

    if (categoriaFilter.value !== 'TODAS' && arb.categoria !== categoriaFilter.value) {
      return false;
    }

    return true;
  });
});

const arbitrosPendientes = computed(() => {
  return arbitrosProcesados.value.filter(a => !a.yaRegistrado);
});

function handleAgregar(arbitro, estado) {
  emit('agregar', { arbitro, estado });
}

function handleAgregarTodosRestantes(estado = 'AUSENTE') {
  if (arbitrosPendientes.value.length === 0) return;
  if (confirm(`¿Incorporar ${arbitrosPendientes.value.length} árbitros pendientes como ${estado}?`)) {
    emit('agregarMultiples', {
      arbitros: arbitrosPendientes.value,
      estado
    });
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/35 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] overflow-hidden">
      
      <!-- Modal Header -->
      <div class="px-6 py-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200/70">
            <Users class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-slate-900 text-base sm:text-lg">
              Incorporar Árbitros a la Sesión
            </h3>
            <p class="text-xs text-slate-500">
              Selecciona colegiados del padrón oficial para sumarlos a la planilla de asistencia.
            </p>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Quick Action Toolbar -->
      <div class="p-6 pb-3 space-y-3 shrink-0 bg-white">
        <div class="flex flex-col sm:flex-row gap-2.5">
          <div class="relative flex-1">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por apellido, nombre o WhatsApp..."
              class="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-600 bg-white text-slate-900 placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          <select
            v-model="categoriaFilter"
            class="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-600 shadow-2xs"
          >
            <option value="TODAS">Todas las categorías</option>
            <option v-for="cat in categoriasList" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>

        <!-- Mass Add Helper -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 text-xs gap-2">
          <span class="text-emerald-950 font-medium">
            Pendientes por convocar: <strong class="text-slate-900 font-mono font-bold">{{ arbitrosPendientes.length }}</strong> de {{ arbitrosPadronActivos.length }}
          </span>

          <div class="flex items-center gap-1.5">
            <button
              type="button"
              @click="handleAgregarTodosRestantes('PRESENTE')"
              :disabled="arbitrosPendientes.length === 0"
              class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 font-bold text-[11px] transition-colors shadow-2xs flex items-center gap-1"
            >
              <CheckCircle2 class="w-3.5 h-3.5" />
              <span>Sumar todos Presentes</span>
            </button>
            <button
              type="button"
              @click="handleAgregarTodosRestantes('AUSENTE')"
              :disabled="arbitrosPendientes.length === 0"
              class="px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 disabled:opacity-40 font-semibold text-[11px] transition-colors shadow-2xs flex items-center gap-1"
            >
              <XCircle class="w-3.5 h-3.5" />
              <span>Sumar todos Ausentes</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Referees List Body -->
      <div class="overflow-y-auto divide-y divide-slate-100 flex-1 px-6 py-2">
        <div
          v-for="arb in arbitrosFiltrados"
          :key="arb.idArbitro"
          :class="[
            'py-3 px-3 flex items-center justify-between gap-3 rounded-xl transition-colors',
            arb.yaRegistrado ? 'opacity-65 bg-slate-50/70' : 'hover:bg-emerald-50/30'
          ]"
        >
          <!-- Arbitro Info -->
          <div class="flex items-center gap-3 min-w-0">
            <div
              :class="[
                'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0',
                arb.yaRegistrado
                  ? 'bg-slate-100 text-slate-500 border border-slate-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              ]"
            >
              {{ ((arb.nombre?.[0] || '') + (arb.apellido?.[0] || '')).toUpperCase() || 'AR' }}
            </div>
            <div class="min-w-0">
              <div class="font-bold text-xs sm:text-sm text-slate-900 truncate">
                {{ arb.fullName }}
              </div>
              <div class="flex items-center gap-2 text-[11px] text-slate-500">
                <span class="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-medium border border-slate-200/60">
                  {{ arb.categoria }}
                </span>
                <span v-if="arb.whatsapp" class="font-mono text-slate-600">📱 {{ arb.whatsapp }}</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="shrink-0">
            <span
              v-if="arb.yaRegistrado"
              class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-md border border-emerald-200/80"
            >
              <UserCheck class="w-3.5 h-3.5 text-emerald-700" />
              <span>En planilla</span>
            </span>

            <div v-else class="flex items-center gap-1">
              <button
                type="button"
                @click="handleAgregar(arb, 'PRESENTE')"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                title="Agregar e ingresar como Presente"
              >
                <CheckCircle2 class="w-3.5 h-3.5" />
                <span>+ Presente</span>
              </button>

              <button
                type="button"
                @click="handleAgregar(arb, 'AUSENTE')"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold transition-colors"
                title="Agregar como Ausente"
              >
                <XCircle class="w-3.5 h-3.5" />
                <span>+ Ausente</span>
              </button>

              <button
                type="button"
                @click="handleAgregar(arb, 'JUSTIFICADO')"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-colors"
                title="Agregar como Justificado"
              >
                <AlertCircle class="w-3.5 h-3.5" />
                <span>+ Justif.</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="arbitrosFiltrados.length === 0" class="py-8 text-center text-xs text-slate-500">
          No se encontraron árbitros en el padrón con los filtros ingresados.
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3.5 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between shrink-0">
        <span class="text-xs text-slate-500">
          Mostrando {{ arbitrosFiltrados.length }} árbitros del padrón
        </span>
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 rounded-lg text-xs font-bold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 shadow-2xs transition-colors"
        >
          Listo / Volver a la Planilla
        </button>
      </div>

    </div>
  </div>
</template>
