<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script>
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import 'leaflet/dist/leaflet.css';

export default {
  components: { IonApp, IonRouterOutlet },
};
</script>
