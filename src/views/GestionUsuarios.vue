<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <h2>Administrar usuarios</h2>

      <!-- Mostrar "Cargando datos..." mientras se cargan los usuarios -->
      <ion-spinner v-if="cargando" name="crescent"></ion-spinner>
      <p v-if="cargando">Cargando datos...</p>

      <!-- Lista de usuarios -->
      <ion-list v-if="!cargando && usuarios.length > 0">
        <ion-item v-for="usuario in usuarios" :key="usuario.id">
          <ion-label>
            <h2>{{ usuario.nombre }} {{ usuario.apellidos }}</h2>
            <p>Correo: {{ usuario.correo }}</p>
            <p>Tipo: {{ usuario.tipoUsuario }}</p>
          </ion-label>
          <ion-buttons slot="end">
            <ion-button fill="clear" color="primary" @click="editarUsuario(usuario)" title="Editar usuario">✏️</ion-button>
          </ion-buttons>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, onMounted } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonButton, 
        IonList, IonLabel, IonModal, IonButtons, IonSpinner } from '@ionic/vue';
import { db } from '../firebase';
import { collection, getDocs, getDoc } from 'firebase/firestore';
import { useRouter } from 'vue-router';

export default {
  components: { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonButton, 
                IonList, IonLabel, IonModal, IonButtons, IonSpinner },
  setup() {
    const cargando = ref(true);
    const usuarios = ref([]);
    const router = useRouter(); // Usamos el enrutador de Vue
    const mostrarModal = ref(false); // Para controlar la visibilidad del modal

    const coleccionUsuarios = collection(db, 'usuarios');

    // Obtener usuarios de Firestore con su tipo de usuario
    const obtenerUsuarios = async () => {
      const consulta = await getDocs(coleccionUsuarios);
      const datosUsuarios = [];

      for (const usuarioDoc of consulta.docs) {
        let usuario = { id: usuarioDoc.id, ...usuarioDoc.data() };

        // Si hay una referencia al tipo de usuario, obtener su información
        if (usuario.tipoUsuarioRef) {
          const tipoUsuarioDoc = await getDoc(usuario.tipoUsuarioRef);
          usuario.tipoUsuario = tipoUsuarioDoc.exists() ? tipoUsuarioDoc.data().tipo : 'Desconocido';
        } else {
          usuario.tipoUsuario = 'Desconocido';
        }

        datosUsuarios.push(usuario);
      }

      usuarios.value = datosUsuarios;
      cargando.value = false;
    };

    // Navegar a la pantalla de edición del usuario
    const editarUsuario = (usuario) => {
      router.push({ name: 'editarUsuario', params: { id: usuario.id } });
    };

    // Cerrar modal
    const cerrarModal = () => {
      mostrarModal.value = false; // Cerrar el modal
    };

    onMounted(obtenerUsuarios);

    return { usuarios, editarUsuario, mostrarModal, cerrarModal, cargando };
  }
};
</script>
