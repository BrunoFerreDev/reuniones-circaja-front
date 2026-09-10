<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  subtext: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'slate' // 'slate' | 'emerald' | 'rose' | 'amber'
  }
});
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
    <div class="flex items-center justify-between">
      <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">{{ label }}</span>
      <slot name="icon"></slot>
    </div>
    <div class="mt-2 flex items-baseline gap-2">
      <span
        :class="[
          'text-2xl font-bold tracking-tight font-mono',
          variant === 'emerald' && 'text-emerald-700',
          variant === 'rose' && 'text-rose-700',
          variant === 'amber' && 'text-amber-700',
          variant === 'slate' && 'text-slate-900'
        ]"
      >
        {{ value }}
      </span>
      <span v-if="subtext" class="text-xs text-slate-500">{{ subtext }}</span>
    </div>
  </div>
</template>
