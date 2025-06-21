<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
        <ion-card>
            <ion-toolbar>
                <ion-buttons>
                    <ion-button @click="router.push('/app')">← Volver</ion-button>
                </ion-buttons>
            </ion-toolbar>

            <ion-card-content>
                <ion-spinner v-if="cargando" name="crescent" color="primary"></ion-spinner>
                <p v-if="cargando">Cargando datos...</p>

                <div v-else>
                    <h1>{{ biblioteca.nombre }}</h1>
                    <ion-item>
                        <ion-label position="fixed">Dirección:</ion-label>
                        <ion-text>{{ biblioteca.direccion }}</ion-text>
                    </ion-item>

                    <!-- Mapa Leaflet -->
                    <div id="map" class="mapa"></div>

                    <ion-card-title class="ion-margin-top margen-left">Horario</ion-card-title>
                    <ion-list>
                        <ion-item v-for="(dia, index) in biblioteca.horarios" :key="index">
                            <ion-label>
                            {{ dia.nombre }}:
                            <span v-if="dia.horaApertura && dia.horaCierre">
                                {{ dia.horaApertura }} - {{ dia.horaCierre }}
                            </span>
                            <span v-else>
                                Cerrado
                            </span>
                            </ion-label>
                        </ion-item>
                    </ion-list>

                    <ion-card-title class="ion-margin-top margen-left">Imágenes</ion-card-title>
                    <div class="imagen-preview margen-left">
                        <div v-for="(img, index) in biblioteca.imagenes" :key="index" class="preview-container">
                        <img :src="img" alt="Imagen Biblioteca" />
                        </div>
                    </div>

                    <div class="button-group">
                        <ion-button color="primary" class="ion-margin-top" @click="irASeleccionarReserva">Reservar</ion-button>
                        
                    </div>

                </div>
            </ion-card-content>
        </ion-card>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonImg, IonGrid,
  IonRow, IonCol, IonButton, IonButtons,IonCard, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonText, IonList
} from '@ionic/vue';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import L from 'leaflet';

// Configuración correcta de iconos para Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

export default {
  components: {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonImg, IonGrid,
    IonRow, IonCol, IonButton, IonButtons,IonCard, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonText, IonList
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const biblioteca = ref({});
    const cargando = ref(true);

    const cargarBiblioteca = async () => {
      
      const id = route.params.id;
      const docSnap = await getDoc(doc(db, 'bibliotecas', id));
      if (docSnap.exists()) {
        biblioteca.value = docSnap.data();
        setTimeout(() => {
          mostrarMapa();
        }, 300); // espera a que el DOM se actualice
      }
      cargando.value = false;
    };

    const mostrarMapa = () => {
      if (
        biblioteca.value.coordenadas &&
        biblioteca.value.coordenadas.lat &&
        biblioteca.value.coordenadas.lon
      ) {
        const map = L.map('map').setView(
          [biblioteca.value.coordenadas.lat, biblioteca.value.coordenadas.lon],
          15
        );
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        L.marker([biblioteca.value.coordenadas.lat, biblioteca.value.coordenadas.lon])
          .addTo(map)
          .bindPopup(biblioteca.value.nombre)
          .openPopup();
      }
    };

    const irASeleccionarReserva = () => {
      router.push(`/seleccionar-reserva/${route.params.id}`);
    };

    onMounted(() => {
      cargarBiblioteca();
    });

    return { biblioteca, cargando, router, irASeleccionarReserva
    };
  }
};
</script>

<style scoped>
h1 {
  text-align: center;
  margin-top: 20px;
}
.imagen-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}
.preview-container img {
  width: 300px;
  height: auto;
  border-radius: 8px;
}

.margen-left {
  margin-left: 15px;
}

.button-group {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 15px;
}

.mapa {
  width: 100%;
  height: 250px;
  margin: 20px 0;
  border-radius: 8px;
}
</style>
