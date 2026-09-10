<script setup>
import { useRoute } from 'vue-router';
import Navbar from './components/Navbar.vue';

const route = useRoute();
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
    <Navbar v-if="route.name !== 'login'" />

    <main :class="route.name === 'login' ? 'flex-1 flex items-center justify-center p-0' : 'flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'">
      <router-view />
    </main>

    <footer v-if="route.name !== 'login'" class="no-print border-t border-slate-200 bg-white py-6 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-800">CIRCAJA</span>
          <span>•</span>
          <span>Colegio de Árbitros de Fútbol</span>
        </div>
        <div>
          Sistema de Registro de Minutas, Análisis Reglamentario IFAB y Planilla de Asistencia.
        </div>
      </div>
    </footer>
  </div>
</template>
