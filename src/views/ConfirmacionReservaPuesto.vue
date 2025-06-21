<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Reserva Confirmada</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card v-if="reserva && puesto && biblioteca">
        <ion-card-header>
          <ion-card-title>✅ ¡Tu reserva fue exitosa!</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p><strong>Biblioteca:</strong> {{ biblioteca.nombre }}</p>
          <p><strong>Puesto:</strong> {{ puesto.nombre }}</p>
          <p><strong>Planta:</strong> {{ puesto.planta }}</p>
          <p><strong>Fecha:</strong> {{ formatFechaCorta(reserva.fecha) }}</p>
          <p><strong>Hora de inicio:</strong> {{ reserva.horaInicio }}</p>
          <p><strong>Duración:</strong> {{ formatDuracion(reserva.duracion) }}</p>
        </ion-card-content>
      </ion-card>
      <ion-card-content v-else>
        <ion-spinner name="crescent"></ion-spinner> Cargando datos de la reserva...
      </ion-card-content>

      <div class="button-group">
        <ion-button size="small" @click="volver">
          Volver al inicio
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonButton, IonButtons, IonBackButton, IonSpinner
} from '@ionic/vue';

import { defineComponent, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default defineComponent({
  name: 'ConfirmacionReservaPuesto',
  components: {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonButton, IonButtons, IonBackButton, IonSpinner
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const idReserva = route.params.idReserva;

    const reserva = ref(null);
    const puesto = ref(null);
    const biblioteca = ref(null);

    const volver = () => {
      router.push('/app');
    };

    const formatFechaCorta = (fechaStr) => {
      if (!fechaStr) return '';
      const [año, mes, dia] = fechaStr.split('-'); // Formato original es YYYY-MM-DD
      return `${dia}-${mes}-${año}`;
    };

    const formatDuracion = (minutos) => {
      if (minutos === 60) return '1 hora';
      if (minutos === 120) return '2 horas';
      return `${minutos} min`;
    };

    onMounted(async () => {
      if (idReserva) {
        const reservaDoc = await getDoc(doc(db, 'reservasPuestoEstudio', idReserva));
        if (reservaDoc.exists()) {
          const data = reservaDoc.data();
          reserva.value = {
            ...data,
            creadaEn: data.creadaEn?.seconds
              ? new Date(data.creadaEn.seconds * 1000)
              : new Date(data.creadaEn)
          };

          // Cargar datos del puesto
          const puestoDoc = await getDoc(doc(db, 'puestosEstudio', data.idPuesto));
          if (puestoDoc.exists()) {
            puesto.value = puestoDoc.data();
          }

          // Cargar datos de la biblioteca
          const biblioDoc = await getDoc(doc(db, 'bibliotecas', data.idBiblioteca));
          if (biblioDoc.exists()) {
            biblioteca.value = biblioDoc.data();
          }
        }
      }
    });

    return {
      reserva, puesto, biblioteca, formatFechaCorta, formatDuracion, volver
    };
  }
});
</script>

<style scoped>
ion-card-title {
  font-size: 1.3rem;
  color: green;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 15px;
}
</style>
