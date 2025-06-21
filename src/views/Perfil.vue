<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Perfil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding fullscreen">
      <h2>Perfil de Usuario</h2>
      <ion-card v-if="userData">
        <ion-card-content class="texto-izquierda">
          <p><strong>Nombre:</strong> {{ userData.nombre }}</p>
          <p><strong>Apellidos:</strong> {{ userData.apellidos }}</p>
          <p><strong>Correo:</strong> {{ userData.correo }}</p>
        </ion-card-content>
      </ion-card>
      <p v-else>Cargando datos...</p>

      <!-- Botón para eliminar la cuenta -->
      <div class="button-group">
        <ion-button size="small" color="danger" @click="mostrarModalConfirmacion = true">
          Eliminar Cuenta
        </ion-button>
      </div>
    </ion-content>

    <!-- Modal de Confirmación -->
    <ion-modal :is-open="mostrarModalConfirmacion">
      <ion-header>
        <ion-toolbar>
          <ion-title>Confirmar Eliminación</ion-title>
          <ion-buttons slot="end">
            <ion-button size="small" @click="cerrarModalConfirmacion">Cancelar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <p>¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.</p>
        <div class="button-group">
          <ion-button size="small" color="danger" @click="eliminarCuenta">Eliminar</ion-button>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Modal de Éxito -->
    <ion-modal :is-open="mostrarModalExito">
      <ion-header>
        <ion-toolbar>
          <ion-title>Cuenta Eliminada</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <p>Tu cuenta ha sido eliminada correctamente.</p>
        <div class="button-group">
          <ion-button size="small" color="primary" @click="redirigirLogin">Aceptar</ion-button>
        </div>
      </ion-content>
    </ion-modal>

  </ion-page>
</template>

<script>
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonModal, IonCard, IonCardContent, IonButtons } from "@ionic/vue";
import { getDoc, doc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged, deleteUser } from "firebase/auth";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

export default {
  components: { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonModal, IonCard, IonCardContent, IonButtons },
  setup() {
    const userData = ref(null);
    const user = ref(null);
    const router = useRouter();

    const mostrarModalConfirmacion = ref(false);
    const mostrarModalExito = ref(false);

    const fetchUserData = async (userId) => {
      try {
        const userDoc = await getDoc(doc(db, "usuarios", userId));
        if (userDoc.exists()) {
          userData.value = userDoc.data();
        } else {
          console.log("No se encontró el usuario en Firestore");
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
      }
    };

    const cerrarModalConfirmacion = () => {
      mostrarModalConfirmacion.value = false;
    };

    const eliminarCuenta = async () => {
      try {
        if (!user.value) return;

        // 1️ Eliminar usuario de Firestore
        await deleteDoc(doc(db, "usuarios", user.value.uid));

        // 2️ Eliminar usuario de Authentication
        await deleteUser(user.value);

        // 3 Mostrar modal de éxito
        mostrarModalConfirmacion.value = false;
        mostrarModalExito.value = true;
      } catch (error) {
        console.error("Error al eliminar cuenta:", error);
      }
    };

    const redirigirLogin = () => {
      mostrarModalExito.value = false;
      router.push("/login"); // Redirigir al login después de eliminar la cuenta
    };

    onMounted(() => {
      onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          user.value = currentUser;
          fetchUserData(currentUser.uid);
        }
      });
    });

    return { userData, mostrarModalConfirmacion, mostrarModalExito, cerrarModalConfirmacion, eliminarCuenta, redirigirLogin };
  }
};
</script>

<style scoped>
.fullscreen {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.texto-izquierda {
  text-align: center;
}

/* Diseño adaptable para los botones */
.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center; /* Centra los botones */
  margin-top: 15px;
}
</style>
