import { ref, computed } from 'vue';
import { apiLogin, apiLogout } from '../services/api';

const TOKEN_KEY = 'circaja_auth_token';
const USER_KEY = 'circaja_user';

export const token = ref(localStorage.getItem(TOKEN_KEY) || null);
export const user = ref(JSON.parse(localStorage.getItem(USER_KEY) || 'null'));
export const isAuthenticated = computed(() => !!token.value);
export const authLoading = ref(false);
export const authError = ref(null);

export async function login(whatsapp, password) {
  authLoading.value = true;
  authError.value = null;
  try {
    const payload = {
      whatsapp: whatsapp.trim(),
      username: whatsapp.trim(),
      password: password,
      contrasenia: password
    };
    
    const resp = await apiLogin(payload);
    
    // Guardar token si viene en la respuesta
    const authToken = resp?.token || resp?.jwt || (typeof resp === 'string' ? resp : 'dummy-session-token');
    token.value = authToken;
    localStorage.setItem(TOKEN_KEY, authToken);

    // Guardar datos de usuario
    const userData = {
      whatsapp: whatsapp.trim(),
      username: resp?.username || whatsapp.trim(),
      roles: resp?.roles || ['ARBITRO']
    };
    user.value = userData;
    localStorage.setItem(USER_KEY, JSON.stringify(userData));

    return { ok: true, data: resp };
  } catch (err) {
    authError.value = err.message || 'Credenciales inválidas. Verifica tu WhatsApp y contraseña.';
    return { ok: false, error: authError.value };
  } finally {
    authLoading.value = false;
  }
}

export async function logout() {
  try {
    await apiLogout().catch(() => {});
  } finally {
    token.value = null;
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
