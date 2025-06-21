<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Formulario de edición de usuario -->
      <ion-item>
        <ion-label position="floating">Nombre</ion-label>
        <ion-input v-model="usuarioEditado.nombre" type="text" style="margin-top: 10px;"></ion-input>
      </ion-item>
      <p v-if="errores.nombre" class="error-text">{{ errores.nombre }}</p>

      <ion-item>
        <ion-label position="floating">Apellidos</ion-label>
        <ion-input v-model="usuarioEditado.apellidos" type="text" style="margin-top: 10px;"></ion-input>
      </ion-item>
      <p v-if="errores.apellidos" class="error-text">{{ errores.apellidos }}</p>

      <!-- Mostrar el correo en un campo no editable -->
      <ion-item>
        <ion-label position="floating">Correo</ion-label>
        <ion-input :value="usuarioEditado.correo" readonly style="margin-top: 10px;"></ion-input>
      </ion-item>

      <!-- Selección del tipo de usuario -->
      <ion-item>
        <ion-label>Tipo de Usuario</ion-label>
        <ion-select v-model="usuarioEditado.tipoUsuarioRef" placeholder="Selecciona el tipo de usuario">
          <ion-select-option value="1">Administrador</ion-select-option>
          <ion-select-option value="2">General</ion-select-option>
          <ion-select-option value="3">Bibliotecario</ion-select-option>
        </ion-select>
      </ion-item>
      <p v-if="errores.tipoUsuarioRef" class="error-text">{{ errores.tipoUsuarioRef }}</p>

      <!-- Botones de acción -->
      <div class="button-group">
        <ion-button size="small" @click="guardarCambios">Guardar</ion-button>
        <ion-button size="small" color="danger" @click="cancelarEdicion">Cancelar</ion-button>
      </div>

      <ion-toast
        :is-open="mostrarError"
        :message="mensajeError"
        :duration="2000"
        color="danger"
        @didDismiss="mostrarError = false"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, onMounted } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput,
   IonButton, IonSelect, IonSelectOption, IonToast
} from '@ionic/vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default {
  components: { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, 
    IonButton, IonSelect, IonSelectOption, IonToast
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const usuarioEditado = ref({ nombre: '', apellidos: '', correo: '', tipoUsuarioRef: '' });
    const errores = ref({ nombre: '', apellidos: '', tipoUsuarioRef: '' });
    const mostrarError = ref(false);
    const mensajeError = ref('');
    const idUsuario = route.params.id;

    // Obtener los datos del usuario para editar
    const obtenerUsuario = async () => {
      const usuarioDoc = await getDoc(doc(db, 'usuarios', idUsuario));
      if (usuarioDoc.exists()) {
        const usuarioData = usuarioDoc.data();
        usuarioEditado.value = {
          nombre: usuarioData.nombre,
          apellidos: usuarioData.apellidos,
          correo: usuarioData.correo, // No se podrá modificar este campo
          tipoUsuarioRef: usuarioData.tipoUsuarioRef ? usuarioData.tipoUsuarioRef.id : '' // Obtener el id del tipoUsuarioRef
        };
      } else {
        console.log('Usuario no encontrado');
      }
    };

    const validarFormulario = () => {
      errores.value = {};

      if (!usuarioEditado.value.nombre.trim()) {
        errores.value.nombre = 'El nombre es obligatorio';
      }
      if (!usuarioEditado.value.apellidos.trim()) {
        errores.value.apellidos = 'Los apellidos son obligatorios';
      }
      if (!usuarioEditado.value.tipoUsuarioRef) {
        errores.value.tipoUsuarioRef = 'Debe seleccionar un tipo de usuario';
      }

      return Object.keys(errores.value).length === 0;
    };

    // Guardar los cambios del usuario
    const guardarCambios = async () => {
      if (!validarFormulario()) {
        mensajeError.value = 'Por favor, corrige los errores antes de guardar';
        mostrarError.value = true;
        return;
      }

      const tipoUsuarioRef = doc(db, 'tipoUsuario', usuarioEditado.value.tipoUsuarioRef);// Referencia al tipo de usuario
      const usuarioActualizado = {
        nombre: usuarioEditado.value.nombre,
        apellidos: usuarioEditado.value.apellidos,
        tipoUsuarioRef: tipoUsuarioRef
      };

      await updateDoc(doc(db, 'usuarios', idUsuario), usuarioActualizado);
      router.push('/app/admin'); // Regresar a la lista de usuarios
    };

    // Cancelar edición y volver a la pantalla de administración
    const cancelarEdicion = () => {
      router.push('/app/admin');
    };

    onMounted(obtenerUsuario);

    return { usuarioEditado, guardarCambios, cancelarEdicion, errores, mostrarError, mensajeError };
  }
};
</script>

<style scoped>
.error-text {
  color: red;
  font-size: 14px;
  margin-left: 16px;
}
.button-group {
  display: flex;
  flex-wrap: wrap; /* Se adapta si no hay espacio */
  gap: 10px;
  margin-top: 20px;
  justify-content: center; /* Centra los botones */
}
</style>
