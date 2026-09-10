<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { login, authLoading, authError } from '../stores/authStore';
import {
  Shield,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  CalendarCheck,
  FileSpreadsheet,
  Award,
  Loader2
} from 'lucide-vue-next';

const router = useRouter();

const whatsapp = ref('');
const password = ref('');
const showPassword = ref(false);
const recordarme = ref(true);

async function handleLogin() {
  if (!whatsapp.value.trim() || !password.value) return;

  const res = await login(whatsapp.value, password.value);
  if (res.ok) {
    router.push('/');
  }
}
</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-slate-100/70 p-4 sm:p-6 lg:p-8">
    <div class="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      
      <!-- Left Panel: Institutional Identity & Authority (5 cols) -->
      <div class="lg:col-span-5 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
        <!-- Pitch subtle background lines -->
        <div class="absolute inset-0 opacity-5 pointer-events-none">
          <div class="w-96 h-96 rounded-full border-2 border-white absolute -top-20 -left-20"></div>
          <div class="w-full h-px bg-white absolute top-1/2 left-0"></div>
          <div class="w-32 h-32 rounded-full border-2 border-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div class="relative z-10 space-y-8">
          <!-- Logo & Brand Header -->
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-emerald-400 shadow-inner">
              <Shield class="w-6 h-6" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-extrabold tracking-tight text-xl text-white">CIRCAJA</span>
                <span class="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Árbitros
                </span>
              </div>
              <p class="text-xs text-slate-400">Colegio de Árbitros de Fútbol</p>
            </div>
          </div>

          <!-- Pitch Authority Description -->
          <div class="space-y-3">
            <h2 class="text-2xl font-bold tracking-tight text-white leading-snug">
              Portal Oficial de Sesiones Técnicas & Control Arbitral
            </h2>
            <p class="text-xs text-slate-300 leading-relaxed">
              Plataforma institucional para el registro de actas, análisis de directivas IFAB y verificación de disponibilidades de fin de semana.
            </p>
          </div>

          <!-- Feature Pillars -->
          <div class="space-y-3 pt-2">
            <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <CalendarCheck class="w-4 h-4" />
              </div>
              <div>
                <h3 class="text-xs font-bold text-white">Control de Asistencias & Quórum</h3>
                <p class="text-[11px] text-slate-400">Registro oficial de presentes, inasistencias y observaciones médicas/laborales.</p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <FileSpreadsheet class="w-4 h-4" />
              </div>
              <div>
                <h3 class="text-xs font-bold text-white">Disponibilidad para Designaciones</h3>
                <p class="text-[11px] text-slate-400">Declaración de disponibilidad sábado y domingo para designación de ternas.</p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <Award class="w-4 h-4" />
              </div>
              <div>
                <h3 class="text-xs font-bold text-white">Actas & Análisis Reglamentario</h3>
                <p class="text-[11px] text-slate-400">Temas debatidos, criterios disciplinarios y material de capacitación IFAB.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Seal -->
        <div class="relative z-10 pt-6 mt-6 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Sistema Federativo Seguro</span>
          <span class="font-mono text-emerald-400">v1.0 • 2026</span>
        </div>
      </div>

      <!-- Right Panel: Login Form (7 cols) -->
      <div class="lg:col-span-7 p-8 sm:p-12 lg:p-16 flex flex-col justify-between bg-white">
        <div>
          <!-- Header title -->
          <div class="space-y-1 mb-8">
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-700">Acceso a la Plataforma</span>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Iniciar Sesión
            </h1>
            <p class="text-xs sm:text-sm text-slate-500">
              Ingresa tus credenciales autorizadas por la Secretaría del Colegio.
            </p>
          </div>

          <!-- Error Message Banner -->
          <div
            v-if="authError"
            class="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-900 text-xs animate-in fade-in duration-200"
          >
            <AlertCircle class="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div class="font-bold">Error de Autenticación</div>
              <div class="text-rose-700 mt-0.5">{{ authError }}</div>
            </div>
          </div>

          <!-- Login Form -->
          <form @submit.prevent="handleLogin" class="space-y-5">
            <!-- WhatsApp Input -->
            <div class="space-y-1.5">
              <label for="whatsapp" class="block text-xs font-bold text-slate-700">
                Número de WhatsApp *
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone class="w-4 h-4 text-emerald-600" />
                </div>
                <input
                  id="whatsapp"
                  v-model="whatsapp"
                  type="text"
                  required
                  autocomplete="tel"
                  placeholder="Ej: 5493743568868"
                  class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 font-mono tracking-wide placeholder:font-sans placeholder:text-slate-400 transition-all bg-slate-50/40 focus:bg-white"
                />
              </div>
              <p class="text-[11px] text-slate-500">
                Ingresa tu número registrado con código de país y área (sin espacios ni guiones).
              </p>
            </div>

            <!-- Password Input -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label for="password" class="block text-xs font-bold text-slate-700">
                  Contraseña *
                </label>
              </div>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock class="w-4 h-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  autocomplete="current-password"
                  placeholder="••••••••"
                  class="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 font-mono transition-all bg-slate-50/40 focus:bg-white"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                  :title="showPassword ? 'Ocultar clave' : 'Mostrar clave'"
                >
                  <EyeOff v-if="showPassword" class="w-4 h-4" />
                  <Eye v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Remember me & help link -->
            <div class="flex items-center justify-between text-xs pt-1">
              <label class="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                <input
                  v-model="recordarme"
                  type="checkbox"
                  class="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span>Recordar sesión</span>
              </label>

              <span class="text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer" title="Contacta al Administrador de CIRCAJA para restablecer tu clave">
                ¿Olvidaste tu contraseña?
              </span>
            </div>

            <!-- Submit Button -->
            <div class="pt-2">
              <button
                type="submit"
                :disabled="authLoading"
                class="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Loader2 v-if="authLoading" class="w-4 h-4 animate-spin" />
                <template v-else>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight class="w-4 h-4" />
                </template>
              </button>
            </div>
          </form>
        </div>

        <!-- Technical support note -->
        <div class="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
          ¿No tienes una cuenta colegiada?
          <span class="text-emerald-700 font-semibold ml-1">
            Comunícate con Secretaría Técnica para dar de alta tu número.
          </span>
        </div>
      </div>

    </div>
  </div>
</template>
