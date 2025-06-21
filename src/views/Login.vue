<template>
  <ion-page>
    <ion-content class="ion-padding login-content">
      <div class="login-container">
        <!-- Logo y Título -->
        <img src="@/assets/logo-login.png" alt="Logo Biblioteca" class="logo" />
        <h2 class="login-title">BiblioApp</h2>

        <!-- Campos de entrada -->
        <ion-input v-model="email" type="email" placeholder="Correo"></ion-input>
        <p v-if="errores.email" class="error-text">{{ errores.email }}</p>

        <ion-input v-model="password" type="password" placeholder="Contraseña"></ion-input>
        <p v-if="errores.password" class="error-text">{{ errores.password }}</p>

        <!-- Botón -->
        <div class="button-group">
          <ion-button size="small" @click="login">Iniciar Sesión</ion-button>
        </div>

        <!-- Enlaces -->
        <p>
          ¿No tienes cuenta? <router-link to="/register">Regístrate</router-link>
        </p>
        <p>
          <router-link to="/forgot-password">¿Olvidaste tu contraseña?</router-link>
        </p>

        <!-- Toast para errores-->
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
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { IonPage, IonContent, IonInput, IonButton, IonToast } from '@ionic/vue';
import { useRouter } from 'vue-router';

export default {
    components: { IonPage, IonContent, IonInput, IonButton, IonToast },
  setup() {
    const email = ref('');
    const password = ref('');
    const errores = ref({ email: '', password: '' });
    const mostrarError = ref(false);
    const mensajeError = ref('');
    const router = useRouter();

    const validarFormulario = () => {
      errores.value = {};

      if (!email.value.trim()) {
        errores.value.email = 'El correo es obligatorio';
      }
      if (!password.value.trim()) {
        errores.value.password = 'La contraseña es obligatoria';
      }

      return Object.keys(errores.value).length === 0;
    };

    const login = async () => {
      if (!validarFormulario()) {
        mensajeError.value = 'Por favor, corrige los errores antes de continuar';
        mostrarError.value = true;
        return;
      }

      try {
        await signInWithEmailAndPassword(auth, email.value, password.value);
        router.push('/app');
      } catch (error) {
        console.error('Error al iniciar sesión:', error.message);
        mensajeError.value = 'Error: ' + error.message;
        mostrarError.value = true;
      }
    };

    return { email, password, login, errores, mostrarError, mensajeError };
  }
};
</script>

<style scoped>
.login-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%; /* Asegura centrado vertical */
}

.login-container {
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

.login-title {
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


