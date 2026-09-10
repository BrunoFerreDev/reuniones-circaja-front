<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { reuniones } from '../stores/reunionesStore';
import { token, user, logout } from '../stores/authStore';
import { 
  Shield, 
  CalendarDays, 
  Users, 
  PlusCircle,
  LogIn,
  LogOut,
  UserCheck
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

const reunionesActivas = computed(() => {
  return reuniones.value.filter(r => r.editable).length;
});

async function handleLogout() {
  await logout();
  router.push('/login');
}
</script>

<template>
  <header class="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo & Branding -->
        <router-link to="/" class="flex items-center gap-3 group">
          <div class="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 font-bold shadow-xs group-hover:scale-105 transition-transform">
            <Shield class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-900 tracking-tight text-base sm:text-lg">CIRCAJA</span>
              <span class="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Árbitros</span>
            </div>
            <p class="text-xs text-slate-500 hidden sm:block">Actas Técnicas & Control de Asistencias</p>
          </div>
        </router-link>

        <!-- Navigation Links -->
        <nav class="flex items-center gap-1 sm:gap-2">
          <router-link
            to="/"
            :class="[
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
              route.name === 'reuniones' || route.name === 'reunion-detalle'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            ]"
          >
            <CalendarDays class="w-4 h-4 text-emerald-600" />
            <span>Reuniones</span>
            <span v-if="reunionesActivas > 0" class="ml-1 px-1.5 py-0.2 rounded-full text-xs font-semibold bg-emerald-600 text-white">
              {{ reunionesActivas }}
            </span>
          </router-link>

          <router-link
            to="/arbitros"
            :class="[
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
              route.name === 'arbitros'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            ]"
          >
            <Users class="w-4 h-4 text-slate-500" />
            <span>Padrón</span>
          </router-link>
        </nav>

        <!-- Actions & Session Controls -->
        <div class="flex items-center gap-2 sm:gap-3">
          <router-link
            to="/reuniones/nueva"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-colors"
          >
            <PlusCircle class="w-4 h-4" />
            <span class="hidden sm:inline">Nueva Reunión</span>
          </router-link>

          <!-- User session / Login link -->
          <div v-if="token" class="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div class="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono">
              <UserCheck class="w-3.5 h-3.5 text-emerald-600" />
              <span>{{ user?.whatsapp || user?.username }}</span>
            </div>
            <button
              @click="handleLogout"
              class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut class="w-4 h-4" />
            </button>
          </div>

          <router-link
            v-else
            to="/login"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            <LogIn class="w-4 h-4 text-emerald-600" />
            <span>Ingresar</span>
          </router-link>
        </div>
      </div>
    </div>
  </header>
</template>
