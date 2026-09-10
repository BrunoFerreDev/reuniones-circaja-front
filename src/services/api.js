const BASE_URL = (import.meta.env.VITE_BASE_URL || 'http://localhost:8081/').replace(/\/$/, '');

function getHeaders() {
  const token = localStorage.getItem('circaja_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...(options.headers || {})
      }
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP ${res.status}: ${res.statusText}`);
    }

    // Return text if body is plain string or empty
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await res.json();
    }
    return await res.text();
  } catch (err) {
    console.warn(`[API] Fallo en ${options.method || 'GET'} ${url}:`, err.message);
    throw err;
  }
}

// 1. Árbitros
export async function apiGetArbitros(page = 0, size = 10) {
  return request(`/arbitros?page=${page}&size=${size}`);
}

// 2. Reuniones
export async function apiGetReuniones(page = 0, size = 10) {
  return request(`/reuniones?page=${page}&size=${size}`);
}

export async function apiBuscarReuniones(fechaInicio, fechaFin, page = 0, size = 10) {
  const params = new URLSearchParams();
  if (fechaInicio) {
    params.append('fechaIncio', fechaInicio);
    params.append('fechaInicio', fechaInicio);
  }
  if (fechaFin) {
    params.append('fechaFin', fechaFin);
  }
  if (page !== undefined && page !== null) {
    params.append('page', page);
  }
  if (size !== undefined && size !== null) {
    params.append('size', size);
  }
  return request(`/reuniones/buscar?${params.toString()}`);
}

export async function apiGetReunion(idReunion) {
  return request(`/reuniones/${idReunion}`);
}

export async function apiCrearReunion(data) {
  return request('/reuniones', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function apiActualizarReunion(idReunion, data) {
  return request(`/reuniones/${idReunion}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function apiEliminarReunion(idReunion) {
  return request(`/reuniones/${idReunion}`, {
    method: 'DELETE'
  });
}

export async function apiActualizarTemas(idReunion, temas) {
  return request(`/reuniones/${idReunion}/temas`, {
    method: 'PUT',
    body: JSON.stringify(temas)
  });
}

export async function apiRegistrarAsistenciaBatch(idReunion, batchData) {
  return request(`/reuniones/${idReunion}/asistencia`, {
    method: 'POST',
    body: JSON.stringify(batchData)
  });
}

export async function apiGetDisponibilidadFinde(idReunion) {
  return request(`/reuniones/${idReunion}/disponibilidad-finde`);
}

// 3. Autenticación
export async function apiLogin(credentials) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
}

export async function apiLogout() {
  return request('/auth/logout', {
    method: 'POST'
  });
}
