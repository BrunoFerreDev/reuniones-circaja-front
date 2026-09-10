<script setup>
import { computed } from 'vue';
import { CheckCircle2, XCircle, AlertCircle, Clock, Check } from 'lucide-vue-next';

const props = defineProps({
  estado: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'md' // 'sm' | 'md' | 'lg'
  }
});

const config = computed(() => {
  const norm = (props.estado || '').toUpperCase();
  switch (norm) {
    case 'PRESENTE':
      return {
        label: 'Presente',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-600/20',
        dot: 'bg-emerald-500',
        icon: CheckCircle2
      };
    case 'AUSENTE':
      return {
        label: 'Ausente',
        bg: 'bg-rose-50 text-rose-800 border-rose-200 ring-rose-600/20',
        dot: 'bg-rose-500',
        icon: XCircle
      };
    case 'JUSTIFICADO':
      return {
        label: 'Justificado',
        bg: 'bg-amber-50 text-amber-900 border-amber-200 ring-amber-600/20',
        dot: 'bg-amber-500',
        icon: AlertCircle
      };
    case 'EN_CURSO':
    case 'ACTIVA':
      return {
        label: 'En Curso',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-emerald-600/20',
        dot: 'bg-emerald-500 animate-pulse',
        icon: Clock
      };
    case 'FINALIZADA':
      return {
        label: 'Finalizada',
        bg: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10',
        dot: 'bg-slate-400',
        icon: Check
      };
    default:
      return {
        label: props.estado,
        bg: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10',
        dot: 'bg-slate-400',
        icon: null
      };
  }
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-2 py-0.5 text-xs';
    case 'lg':
      return 'px-3.5 py-1 text-sm';
    default:
      return 'px-2.5 py-1 text-xs';
  }
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 font-medium rounded-md border ring-1 ring-inset transition-colors',
      config.bg,
      sizeClasses
    ]"
  >
    <span :class="['w-1.5 h-1.5 rounded-full shrink-0', config.dot]"></span>
    <span>{{ config.label }}</span>
  </span>
</template>
