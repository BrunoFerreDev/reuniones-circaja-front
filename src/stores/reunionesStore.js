import { ref } from 'vue';
import {
  apiGetReuniones,
  apiBuscarReuniones,
  apiGetReunion,
  apiCrearReunion,
  apiActualizarReunion,
  apiEliminarReunion,
  apiActualizarTemas,
  apiRegistrarAsistenciaBatch,
  apiGetDisponibilidadFinde,
  apiGetArbitros
} from '../services/api';

// Reactive states
export const reuniones = ref([]);
export const reunionActual = ref(null);
export const arbitros = ref([]);
export const loading = ref(false);
export const error = ref(null);

// Pagination states for reuniones
export const reunionesPagination = ref({
  page: 0,
  size: 10,
  totalPages: 1,
  totalElements: 0
});

// Pagination states for arbitros
export const arbitrosPagination = ref({
  page: 0,
  size: 10,
  totalPages: 1,
  totalElements: 0
});

// 1. Cargar lista de reuniones (GET /reuniones?page=&size=)
export async function loadReuniones(page = 0, size = 10) {
  loading.value = true;
  error.value = null;
  try {
    const data = await apiGetReuniones(page, size);
    if (data && Array.isArray(data.content)) {
      reuniones.value = data.content;
      reunionesPagination.value = {
        page: data.number ?? data.pageNumber ?? page,
        size: data.size ?? data.pageSize ?? size,
        totalPages: data.totalPages ?? 1,
        totalElements: data.totalElements ?? data.content.length
      };
    } else if (Array.isArray(data)) {
      reuniones.value = data;
      reunionesPagination.value.totalElements = data.length;
    } else {
      reuniones.value = [];
    }
  } catch (err) {
    error.value = err.message || 'Error al cargar reuniones desde API';
    reuniones.value = [];
  } finally {
    loading.value = false;
  }
}

// 1b. Buscar reuniones por fechas (GET /reuniones/buscar?fechaIncio=&fechaFin=)
export async function buscarReunionesPorFechas(fechaInicio, fechaFin, page = 0, size = 10) {
  loading.value = true;
  error.value = null;
  try {
    const data = await apiBuscarReuniones(fechaInicio, fechaFin, page, size);
    if (data && Array.isArray(data.content)) {
      reuniones.value = data.content;
      reunionesPagination.value = {
        page: data.number ?? data.pageNumber ?? page,
        size: data.size ?? data.pageSize ?? size,
        totalPages: data.totalPages ?? 1,
        totalElements: data.totalElements ?? data.content.length
      };
    } else if (Array.isArray(data)) {
      reuniones.value = data;
      reunionesPagination.value = {
        page: 0,
        size: data.length,
        totalPages: 1,
        totalElements: data.length
      };
    } else {
      reuniones.value = [];
      reunionesPagination.value = {
        page: 0,
        size,
        totalPages: 1,
        totalElements: 0
      };
    }
    return data;
  } catch (err) {
    error.value = err.message || 'Error al buscar reuniones por fecha en API';
    reuniones.value = [];
    throw err;
  } finally {
    loading.value = false;
  }
}

// 2. Cargar detalle de reunión (GET /reuniones/{idReunion})
export async function loadReunionDetalle(idReunion) {
  loading.value = true;
  error.value = null;
  try {
    const data = await apiGetReunion(idReunion);
    reunionActual.value = data;
    return data;
  } catch (err) {
    error.value = err.message || 'Error al cargar detalle de reunión desde API';
    reunionActual.value = null;
    throw err;
  } finally {
    loading.value = false;
  }
}

// 3. Crear reunión (POST /reuniones)
export async function crearReunion(datos) {
  loading.value = true;
  error.value = null;
  try {
    const creada = await apiCrearReunion(datos);
    await loadReuniones(0, reunionesPagination.value.size);
    return creada;
  } catch (err) {
    error.value = err.message || 'Error al crear reunión en API';
    throw err;
  } finally {
    loading.value = false;
  }
}

// 4. Actualizar reunión general (PUT /reuniones/{idReunion})
export async function actualizarReunion(idReunion, datos) {
  loading.value = true;
  error.value = null;
  try {
    const actualizada = await apiActualizarReunion(idReunion, datos);
    reunionActual.value = actualizada;
    return actualizada;
  } catch (err) {
    error.value = err.message || 'Error al actualizar reunión en API';
    throw err;
  } finally {
    loading.value = false;
  }
}

// 5. Eliminar reunión (DELETE /reuniones/{idReunion})
export async function eliminarReunion(idReunion) {
  loading.value = true;
  error.value = null;
  try {
    await apiEliminarReunion(idReunion);
    reuniones.value = reuniones.value.filter((r) => r.idReunion !== Number(idReunion));
  } catch (err) {
    error.value = err.message || 'Error al eliminar reunión en API';
    throw err;
  } finally {
    loading.value = false;
  }
}

// 6. Actualizar temas (PUT /reuniones/{idReunion}/temas)
export async function guardarTemas(idReunion, temas) {
  loading.value = true;
  error.value = null;
  try {
    const resp = await apiActualizarTemas(idReunion, temas);
    if (resp && resp.temas) {
      reunionActual.value.temas = resp.temas;
    }
    return resp;
  } catch (err) {
    error.value = err.message || 'Error al guardar temas en API';
    throw err;
  } finally {
    loading.value = false;
  }
}

// 7. Registrar asistencias en lote (POST /reuniones/{idReunion}/asistencia)
export async function guardarAsistenciasBatch(idReunion, batchData) {
  loading.value = true;
  error.value = null;
  try {
    const resp = await apiRegistrarAsistenciaBatch(idReunion, batchData);
    if (resp && resp.asistencias) {
      reunionActual.value.asistencias = resp.asistencias;
      reunionActual.value.totalPresentes = resp.totalPresentes;
      reunionActual.value.totalAusentes = resp.totalAusentes;
      reunionActual.value.totalJustificados = resp.totalJustificados;
      reunionActual.value.disponiblesSabado = resp.disponiblesSabado;
      reunionActual.value.disponiblesDomingo = resp.disponiblesDomingo;
    }
    return resp;
  } catch (err) {
    error.value = err.message || 'Error al registrar asistencias en API';
    throw err;
  } finally {
    loading.value = false;
  }
}

// 8. Cargar disponibilidad finde (GET /reuniones/{idReunion}/disponibilidad-finde)
export async function loadDisponibilidadFinde(idReunion) {
  loading.value = true;
  error.value = null;
  try {
    return await apiGetDisponibilidadFinde(idReunion);
  } catch (err) {
    error.value = err.message || 'Error al obtener reporte de disponibilidad';
    throw err;
  } finally {
    loading.value = false;
  }
}

// 9. Cargar padrón de árbitros (GET /arbitros?page=&size=)
export async function loadArbitros(page = 0, size = 100) {
  loading.value = true;
  error.value = null;
  try {
    const data = await apiGetArbitros(page, size);
    if (data && Array.isArray(data.content)) {
      // Ignorar todos los que su estadoSistema es false
      const activos = data.content.filter(a => a.estadoSistema !== false);
      arbitros.value = activos;
      arbitrosPagination.value = {
        page: data.number ?? data.pageNumber ?? page,
        size: data.size ?? data.pageSize ?? size,
        totalPages: data.totalPages ?? 1,
        totalElements: activos.length
      };
    } else if (Array.isArray(data)) {
      const activos = data.filter(a => a.estadoSistema !== false);
      arbitros.value = activos;
      arbitrosPagination.value.totalElements = activos.length;
    } else {
      arbitros.value = [];
    }
  } catch (err) {
    error.value = err.message || 'Error al cargar árbitros desde API';
    arbitros.value = [];
  } finally {
    loading.value = false;
  }
}

// Cálculo de métricas puras
export function getMetricasReunion(reunion) {
  if (!reunion) {
    return {
      total: 0,
      presentes: 0,
      ausentes: 0,
      justificados: 0,
      porcentajeAsistencia: 0,
      disponiblesSabado: 0,
      disponiblesDomingo: 0,
      disponiblesAmbos: 0,
      noDisponibles: 0
    };
  }

  // Si el DTO resumen o detalle ya trae los totales calculados
  if (reunion.totalPresentes !== undefined && (!reunion.asistencias || reunion.asistencias.length === 0)) {
    const total = (reunion.totalPresentes || 0) + (reunion.totalAusentes || 0) + (reunion.totalJustificados || 0);
    const porcentaje = total > 0 ? Math.round((reunion.totalPresentes / total) * 100) : 0;
    return {
      total,
      presentes: reunion.totalPresentes || 0,
      ausentes: reunion.totalAusentes || 0,
      justificados: reunion.totalJustificados || 0,
      porcentajeAsistencia: porcentaje,
      disponiblesSabado: reunion.disponiblesSabado || 0,
      disponiblesDomingo: reunion.disponiblesDomingo || 0,
      disponiblesAmbos: 0,
      noDisponibles: 0
    };
  }

  const asistencias = reunion.asistencias || [];
  const total = asistencias.length;
  let presentes = 0;
  let ausentes = 0;
  let justificados = 0;
  let dispSab = 0;
  let dispDom = 0;
  let dispAmbos = 0;
  let noDisp = 0;

  for (const a of asistencias) {
    if (a.estadoAsistencia === 'PRESENTE') presentes++;
    else if (a.estadoAsistencia === 'JUSTIFICADO') justificados++;
    else ausentes++;

    if (a.disponibleSabado && a.disponibleDomingo) {
      dispAmbos++;
    } else if (a.disponibleSabado) {
      dispSab++;
    } else if (a.disponibleDomingo) {
      dispDom++;
    } else {
      noDisp++;
    }
  }

  const porcentajeAsistencia = total > 0 ? Math.round((presentes / total) * 100) : 0;

  return {
    total,
    presentes,
    ausentes,
    justificados,
    porcentajeAsistencia,
    disponiblesSabado: dispSab + dispAmbos,
    disponiblesDomingo: dispDom + dispAmbos,
    disponiblesAmbos: dispAmbos,
    noDisponibles: noDisp
  };
}
