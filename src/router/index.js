import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import ReunionesListView from '../views/ReunionesListView.vue';
import ReunionDetalleView from '../views/ReunionDetalleView.vue';
import NuevaReunionView from '../views/NuevaReunionView.vue';
import ArbitrosListView from '../views/ArbitrosListView.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView
  },
  {
    path: '/',
    name: 'reuniones',
    component: ReunionesListView
  },
  {
    path: '/reuniones/nueva',
    name: 'nueva-reunion',
    component: NuevaReunionView
  },
  {
    path: '/reuniones/:id',
    name: 'reunion-detalle',
    component: ReunionDetalleView,
    props: true
  },
  {
    path: '/arbitros',
    name: 'arbitros',
    component: ArbitrosListView
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

export default router;
