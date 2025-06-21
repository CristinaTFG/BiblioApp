<template>
  <ion-page>
    <ion-content class="ion-padding register-content">
      <div class="register-container">
        <img src="@/assets/logo-login.png" alt="Logo Biblioteca" class="logo" />
        <h2 class="register-title">BiblioApp</h2>

        <ion-input v-model="nombre" type="nombre" placeholder="Nombre"></ion-input>
        <p v-if="errores.nombre" class="error-text">{{ errores.nombre }}</p>

        <ion-input v-model="apellidos" type="apellidos" placeholder="Apellidos"></ion-input>
        <p v-if="errores.apellidos" class="error-text">{{ errores.apellidos }}</p>
          
        <ion-input v-model="email" type="email" placeholder="Correo"></ion-input>
        <p v-if="errores.email" class="error-text">{{ errores.email }}</p>
        
        <ion-input v-model="password" type="password" placeholder="Contraseña"></ion-input>
        <p v-if="errores.password" class="error-text">{{ errores.password }}</p>

        <div class="button-group">
          <ion-button size="small" @click="register">Crear Cuenta</ion-button>
        </div>

        <p>
          ¿Ya tienes cuenta? <router-link to="/login">Inicia sesión</router-link>
        </p>

        <!-- Toast para errores -->
        <ion-toast
          :is-open="mostrarError"
          :message="mensajeError"
          :duration="2000"
          color="danger"
          @didDismiss="mostrarError = false"
        ></ion-toast>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref } from 'vue';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { IonPage, IonContent, IonInput, IonButton, IonToast } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { collection, addDoc, setDoc, doc } from "firebase/firestore";

export default {
    components: { IonPage, IonContent, IonInput, IonButton, IonToast },
  setup() {
    const email = ref('');
    const password = ref('');
    const nombre = ref('');
    const apellidos = ref('');
    const errores = ref({ nombre: '', apellidos: '', email: '', password: '' });
    const mostrarError = ref(false);
    const mensajeError = ref('');
    const router = useRouter();

    const validarFormulario = () => {
      errores.value = {};

      if (!nombre.value.trim()) {
        errores.value.nombre = 'El nombre es obligatorio';
      }
      if (!apellidos.value.trim()) {
        errores.value.apellidos = 'Los apellidos son obligatorios';
      }
      if (!email.value.trim()) {
        errores.value.email = 'El correo es obligatorio';
      }
      if (!password.value.trim()) {
        errores.value.password = 'La contraseña es obligatoria';
      } else if (password.value.length < 6) {
        errores.value.password = 'La contraseña debe tener al menos 6 caracteres';
      }

      return Object.keys(errores.value).length === 0;
    };

    const register = async () => {
      if (!validarFormulario()) {
        mensajeError.value = 'Por favor, corrige los errores antes de continuar';
        mostrarError.value = true;
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
        const user = userCredential.user;

        // Crear una referencia al tipo de usuario
        const tipoUsuarioRef = doc(db, "tipoUsuario", "2");

        // Guardar datos en Firestore con el UID como clave
        await setDoc(doc(db, "usuarios", user.uid), {
          nombre: nombre.value,
          apellidos: apellidos.value,
          correo: email.value,
          tipoUsuarioRef
        });

        router.push('/app');
      } catch (error) {
        console.error('Error al registrarse:', error.message);
        mensajeError.value = 'Error: ' + error.message;
        mostrarError.value = true;
      }
    };

    return { email, password, nombre, apellidos, register, errores, mostrarError, mensajeError };
  }
};
</script>

<style scoped>
.register-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%; /* Asegura centrado vertical */
}

.register-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 400px;
  padding: 20px;
  margin: auto;
}

.logo {
  width: 100px; /* Ajusta el tamaño a tu gusto */
  margin-bottom: 15px;
}

.register-title {
  font-size: 28px;
  font-weight: bold;
  color: #97bdca; /* Azul claro */
  margin-bottom: 5px;
}

ion-input {
  width: 100%;
  margin-top: 10px;
}

.error-text {
  color: red;
  font-size: 14px;
  width: 100%;
  text-align: left;
  margin: 4px 0 0 2px;
}

.button-group {
  margin-top: 15px;
}
</style>
