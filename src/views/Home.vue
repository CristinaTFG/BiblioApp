<template>
  <ion-page>
    <!-- Menú lateral -->
    <ion-menu content-id="main-content">
      <ion-header>
        <ion-toolbar class="home-toolbar">
          <ion-title>Menú</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-item @click="navigateTo('/app')">
            <ion-icon :icon="homeOutline" slot="start" />
            <ion-label>Inicio</ion-label>
          </ion-item>
          <ion-item @click="navigateTo('/app/profile')">
            <ion-icon :icon="personOutline" slot="start" />
            <ion-label>Perfil</ion-label>
          </ion-item>
          <ion-item @click="navigateTo('/app/reservasUsuario')">
            <ion-icon :icon="calendarOutline" slot="start" />
            <ion-label>Reservas</ion-label>
          </ion-item>
          
          <!-- Mostrar solo si el usuario es administrador -->
          <ion-item v-if="isAdmin" @click="navigateTo('/app/admin')">
            <ion-icon :icon="peopleOutline" slot="start" />
            <ion-label>Gestión de Usuarios</ion-label>
          </ion-item>
          <!-- Mostrar solo si el usuario es administrador o bibliotecario -->
          <ion-item v-if="isAdminOrBibliotecario" @click="navigateTo('/app/gestion-bibliotecas')">
            <ion-icon :icon="libraryOutline" slot="start" />
            <ion-label>Gestión de Bibliotecas</ion-label>
          </ion-item>

          <ion-item button @click="logout">
            <ion-icon :icon="logOutOutline" slot="start" />
            <ion-label>Cerrar Sesión</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>

    <!-- Contenido principal (main-content) -->
    <ion-page id="main-content">
      <ion-header>
        <ion-toolbar class="home-toolbar">
          <ion-buttons slot="start">
            <ion-menu-button />
          </ion-buttons>
          <img src="@/assets/logo-biblioteca.png" class="logo" alt="Logo" />
          <ion-title>BiblioApp</ion-title>
          <!-- Campanita -->
          <ion-buttons slot="end">
            <ion-button @click="irANotificaciones">
              <ion-icon :icon="notificationsOutline" />
              <!-- Punto rojo si hay no leídas -->
              <ion-badge
                color="danger"
                v-if="notificacionesSinLeer > 0"
                style="position: absolute; top: 8px; right: 6px;"
              >
                {{ notificacionesSinLeer }}
              </ion-badge>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <div class="main-content" id="main-content">
        <router-view />
      </div>
    </ion-page>
  </ion-page>
</template>

<script>
import { IonPage, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, 
      IonIcon, menuController, IonMenuButton, IonButtons, IonButton, IonBadge 
} from '@ionic/vue';
import { logOutOutline, homeOutline, personOutline ,listOutline, 
  peopleOutline, libraryOutline, calendarOutline, notificationsOutline } from 'ionicons/icons';

import { auth, db } from '../firebase';
import { signOut, getAuth  } from 'firebase/auth';
import { useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';

export default {
  components: { IonPage, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, 
      IonIcon, menuController, IonMenuButton, IonButtons, IonButton, IonBadge },
  setup() {
    const router = useRouter();
    const isAdmin = ref(false);
    const isAdminOrBibliotecario = ref(false);
    const notificacionesSinLeer = ref(0);
    const user = getAuth().currentUser;

    const checkUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'usuarios', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const tipoUsuarioRef = userDoc.data().tipoUsuarioRef;
          if (tipoUsuarioRef) {
            const tipoUsuarioDoc = await getDoc(tipoUsuarioRef);
            const userRole = tipoUsuarioDoc.exists() ? tipoUsuarioDoc.data().tipo : null;
            
            isAdmin.value = userRole === 'Administrador';
            isAdminOrBibliotecario.value = ['Administrador', 'Bibliotecario'].includes(userRole);
          }
        }
      }
    };

    checkUserRole();

    const navigateTo = async (path) => {
      await menuController.close(); // Cierra el menú antes de navegar
      router.push(path);
    };

    const logout = async () => {
      signOut(auth)
        .then(() => {
          console.log("✅ Sesión cerrada exitosamente.");
          router.replace('/login'); // Evita que el usuario regrese con "atrás"
        })
        .catch((error) => {
          console.error("❌ Error al cerrar sesión:", error);
        });

    };

    const cargarNotificaciones = () => {
      if (!user) return;

      const q = query(
        collection(db, 'notificaciones'),
        where('idUsuario', '==', user.uid),
        where('leida', '==', false)
      );

      onSnapshot(q, (snapshot) => {
        notificacionesSinLeer.value = snapshot.size;
      });
    };

    const irANotificaciones = () => {
      router.push('/notificaciones');
    };

    onMounted(() => {
      cargarNotificaciones();
    });

    return { logout, navigateTo, isAdmin, isAdminOrBibliotecario, logOutOutline, homeOutline, 
      personOutline, listOutline, peopleOutline, libraryOutline, calendarOutline,
      notificationsOutline, notificacionesSinLeer, irANotificaciones };
  }
};
</script>

<style scoped>
ion-menu {
  --width: 250px;
}

ion-toolbar {
  --min-height: 70px; 
}

ion-title {
  font-size: 1.4rem; 
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.home-toolbar {
  --background: #97bdca   ;
  --color: rgb(255, 255, 255);
}

.logo {
  height: 50px; /* ajusta según tu preferencia */
  vertical-align: middle;
}

ion-title {
  display: inline-block;
  vertical-align: middle;
}

</style>
