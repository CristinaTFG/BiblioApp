<template>
  <ion-page>
    <ion-content class="ion-padding forgotPassword-content">
      <div class="forgotPassword-container">
        <img src="@/assets/logo-login.png" alt="Logo Biblioteca" class="logo" />
        <h2 class="forgotPassword-title">BiblioApp</h2>
        <h4>¿Tienes problemas para iniciar sesión?</h4>
        <h6>Introduce tu correo electrónico y te enviaremos un enlace para que vuelvas a entrar en tu cuenta.</h6>

        <ion-input v-model="email" type="email" placeholder="Correo"></ion-input>
        <p v-if="error" class="error-text">{{ error }}</p>

        <div class="button-group">
          <ion-button size="small" @click="resetPassword">Enviar Enlace</ion-button>
        </div>

        <p>
          <router-link to="/login">Volver al inicio de sesión</router-link>
        </p>

        <!-- Toast para notificaciones -->
        <ion-toast
          :is-open="mostrarMensaje"
          :message="mensaje"
          :duration="2000"
          :color="tipoMensaje"
          @didDismiss="mostrarMensaje = false"
        ></ion-toast>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref } from 'vue';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { IonPage, IonContent, IonInput, IonButton, IonToast } from '@ionic/vue';

export default {
  components: { IonPage, IonContent, IonInput, IonButton, IonToast },
  setup() {
    const email = ref('');
    const error = ref('');
    const mostrarMensaje = ref(false);
    const mensaje = ref('');
    const tipoMensaje = ref('success'); // Puede ser "success" o "danger"

    const resetPassword = async () => {
      error.value = '';

      if (!email.value.trim()) {
        error.value = 'El correo es obligatorio';
        return;
      }

      try {
        await sendPasswordResetEmail(auth, email.value);
        mensaje.value = 'Correo de recuperación enviado. Revisa tu bandeja de entrada.';
        tipoMensaje.value = 'success';
      } catch (err) {
        console.error('Error al recuperar contraseña:', err.message);
        mensaje.value = 'Error: ' + err.message;
        tipoMensaje.value = 'danger';
      }
      
      mostrarMensaje.value = true;
    };

    return { email, resetPassword, error, mostrarMensaje, mensaje, tipoMensaje };
  }
};
</script>

<style scoped>
.forgotPassword-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%; /* Asegura centrado vertical */
}

.forgotPassword-container {
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

.forgotPassword-title {
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
