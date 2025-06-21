import { createRouter, createWebHistory } from '@ionic/vue-router';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Home from '../views/Home.vue';
import HomeContent from '../views/HomeContent.vue';
import Perfil from '../views/Perfil.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import ForgotPassword from '../views/ForgotPassword.vue';
import GestionUsuarios from '../views/GestionUsuarios.vue';
import EditarUsuario from '../views/EditarUsuario.vue';
import GestionBibliotecas from '../views/GestionBibliotecas.vue'; 
import AgregarBiblioteca from '../views/AgregarBiblioteca.vue';
import VisualizarBiblioteca from '@/views/VisualizarBiblioteca.vue';
import AgregarPuestoEstudio from '@/views/AgregarPuestoEstudio.vue';
import AgregarSalaGrupo from '@/views/AgregarSalaGrupo.vue';
import AgregarBibliotecarios from '../views/AgregarBibliotecarios.vue';
import AgregarVariosPuestoEstudio from '../views/AgregarVariosPuestoEstudio.vue';
import VerBibliotecaReservas from '../views/VerBibliotecaReservas.vue';
import SeleccionarReserva from '../views/SeleccionarReserva.vue';
import ReservarPuesto from '../views/ReservarPuesto.vue';
import ConfirmacionReservaPuesto from '../views/ConfirmacionReservaPuesto.vue';
import ReservarSala from '../views/ReservarSala.vue';
import ConfirmacionReservaSala from '../views/ConfirmacionReservaSala.vue';
import HistorialReservasUsuario from '../views/HistorialReservasUsuario.vue';
import HistorialReservasPorBiblioteca from '../views/HistorialReservasPorBiblioteca.vue';
import Notificaciones from '../views/Notificaciones.vue';


const routes = [
  { path: '/', redirect: '/app' },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/forgot-password', component: ForgotPassword },
  {
    path: '/app',
    component: Home,
    meta: { requiresAuth: true },
    children: [
      { path: '', component: HomeContent },
      { path: 'profile', component: Perfil },
      { path: 'admin', component: GestionUsuarios, meta: { requiresAdmin: true } }, // Solo para Admin
      { path: '/editar-usuario/:id', name: 'editarUsuario', component: EditarUsuario, meta: { requiresAdmin: true } },
      { path: 'gestion-bibliotecas', component: GestionBibliotecas , meta: { requiresAdminOrBibliotecario: true } }, // Admin o Bibliotecario
      { path: '/agregar-biblioteca', component: AgregarBiblioteca },
      { path: 'visualizar-biblioteca', name: 'VisualizarBiblioteca', component: VisualizarBiblioteca },
      { path: 'agregar-puesto-estudio', name: 'AgregarPuestoEstudio', component: AgregarPuestoEstudio },
      { path: 'agregar-varios-puesto-estudio', name: 'AgregarVariosPuestoEstudio', component: AgregarVariosPuestoEstudio },
      { path: 'agregar-sala-grupo', name: 'AgregarSalaGrupo', component: AgregarSalaGrupo },
      { path: 'agregar-bibliotecarios', name: 'AgregarBibliotecarios', component: AgregarBibliotecarios },
      { path: '/ver-biblioteca-reservas/:id', name: 'VerBibliotecaReservas', component: VerBibliotecaReservas },
      { path: '/seleccionar-reserva/:id', name: 'SeleccionarReserva', component: SeleccionarReserva },
      { path: '/reservar-puesto/:id', name: 'ReservarPuesto', component: ReservarPuesto },
      { path: '/confirmacion-reserva-puesto/:idReserva', name: 'ConfirmacionReservaPuesto', component: ConfirmacionReservaPuesto },
      { path: '/reservar-sala/:id', name: 'ReservarSala', component: ReservarSala },
      { path: '/confirmacion-reserva-sala/:idReserva', name: 'ConfirmacionReservaSala', component: ConfirmacionReservaSala },
      { path: 'reservasUsuario', name: 'HistorialReservasUsuario', component: HistorialReservasUsuario },
      { path: '/historial-reservas-por-biblioteca/:idBiblioteca', name: 'HistorialReservasPorBiblioteca', component: HistorialReservasPorBiblioteca },
      { path: '/notificaciones', name: 'Notificaciones', component: Notificaciones }

    ]
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

let isAuthChecked = false;

router.beforeEach((to, from, next) => {
  if (!isAuthChecked) {
    onAuthStateChanged(auth, async (user) => {
      isAuthChecked = true;
      if (user) {
        const userRef = doc(db, 'usuarios', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const tipoUsuarioRef = userDoc.data().tipoUsuarioRef;
          if (tipoUsuarioRef) {
            const tipoUsuarioDoc = await getDoc(tipoUsuarioRef);
            user.tipoUsuario = tipoUsuarioDoc.exists() ? tipoUsuarioDoc.data().tipo : null;
          }
        }
      }

      // Protege la ruta "Gestión de Usuarios" solo para Admin
      if (to.matched.some(record => record.meta.requiresAdmin) && user.tipoUsuario !== 'Administrador') {
        next('/app');
      }
      // Protege "Gestión de Bibliotecas" solo para Admin o Bibliotecario
      else if (to.matched.some(record => record.meta.requiresAdminOrBibliotecario) && !['Administrador', 'Bibliotecario'].includes(user.tipoUsuario)) {
        next('/app');
      }
      // Protege rutas que requieren autenticación
      else if (to.matched.some(record => record.meta.requiresAuth) && !user) {
        next('/login');
      } else {
        next();
      }
    });
  } else {
    next();
  }
});

export default router;