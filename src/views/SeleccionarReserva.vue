<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding centered">
        <ion-card>
            <ion-toolbar>
                <ion-buttons>
                    <ion-button @click="router.push(`/ver-biblioteca-reservas/${idBiblioteca}`)">← Volver</ion-button>
                </ion-buttons>
            </ion-toolbar>
            <ion-card-header>
                <ion-card-title>Reserva</ion-card-title>
            </ion-card-header>
            <h6>¿Qué quieres reservar?</h6>
            <ion-card-content>
                <div class="button-group">
                    <ion-button color="primary" @click="irAPuestoEstudio">Puesto de estudio</ion-button>
                    <ion-button color="primary" @click="irASalaGrupo">Sala de grupo</ion-button>
                </div>
            </ion-card-content>
        </ion-card>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonContent, IonButton, IonButtons
} from '@ionic/vue';
import { useRoute, useRouter } from 'vue-router';

export default {
  components: {
    IonPage, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonContent, IonButton, IonButtons
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const idBiblioteca = route.params.id;

    const irAPuestoEstudio = () => {
      router.push(`/reservar-puesto/${idBiblioteca}`);
    };

    const irASalaGrupo = () => {
      router.push(`/reservar-sala/${idBiblioteca}`);
    };


    return { irAPuestoEstudio, irASalaGrupo, router, idBiblioteca };
  }
};
</script>

<style scoped>
.centered {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 3rem;
}

.button-group {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 15px;
}
</style>
