<script setup>
import { ref, watch } from 'vue';
import { X, BookOpen, Clock, Link, CheckSquare } from 'lucide-vue-next';

const props = defineProps({
  isOpen: Boolean,
  temaEditar: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'save']);

const form = ref({
  titulo: '',
  tiempoMinutos: 20,
  descripcion: '',
  conclusiones: '',
  urlMaterial: ''
});

watch(
  () => props.temaEditar,
  (val) => {
    if (val) {
      form.value = {
        titulo: val.titulo || '',
        tiempoMinutos: val.tiempoMinutos || 20,
        descripcion: val.descripcion || '',
        conclusiones: val.conclusiones || '',
        urlMaterial: val.urlMaterial || ''
      };
    } else {
      form.value = {
        titulo: '',
        tiempoMinutos: 20,
        descripcion: '',
        conclusiones: '',
        urlMaterial: ''
      };
    }
  },
  { immediate: true }
);

function handleSubmit() {
  if (!form.value.titulo.trim()) return;
  emit('save', { ...form.value });
  emit('close');
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-lg bg-emerald-50 text-emerald-700">
            <BookOpen class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-slate-900 text-lg">
              {{ temaEditar ? 'Editar Tema de Reunión' : 'Registrar Nuevo Tema' }}
            </h3>
            <p class="text-xs text-slate-500">Orden del día y conclusiones técnicas</p>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="mt-5 space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Título del Tema *
          </label>
          <input
            v-model="form.titulo"
            type="text"
            required
            placeholder="Ej: Análisis de Manos en el Área (Regla 12)"
            class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Clock class="w-3.5 h-3.5 text-slate-400" />
            <span>Tiempo dedicado estimado (minutos)</span>
          </label>
          <input
            v-model.number="form.tiempoMinutos"
            type="number"
            min="5"
            max="180"
            step="5"
            class="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 font-mono"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Desarrollo de la Charla / Puntos Tratados
          </label>
          <textarea
            v-model="form.descripcion"
            rows="3"
            placeholder="Detalles expuestos por el instructor o colegiados. Criterios debatidos..."
            class="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
          ></textarea>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <CheckSquare class="w-3.5 h-3.5 text-emerald-600" />
            <span>Conclusiones / Criterio Unificado</span>
          </label>
          <textarea
            v-model="form.conclusiones"
            rows="2"
            placeholder="Acuerdo final del cuerpo arbitral para las próximas fechas..."
            class="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
          ></textarea>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Link class="w-3.5 h-3.5 text-slate-400" />
            <span>Enlace a Material o Video de Jugadas (Opcional)</span>
          </label>
          <input
            v-model="form.urlMaterial"
            type="url"
            placeholder="https://..."
            class="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
          />
        </div>

        <!-- Buttons -->
        <div class="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            {{ temaEditar ? 'Guardar Cambios' : 'Agregar Tema' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
