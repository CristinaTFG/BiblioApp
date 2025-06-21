<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-title class="ion-margin-top">Notificaciones</ion-title>

      <ion-spinner v-if="cargando" name="crescent" color="primary"></ion-spinner>
      <p v-if="cargando">Cargando datos...</p>

      <ion-list v-if="notificaciones.length">
        <ion-item
          v-for="noti in notificaciones"
          :key="noti.id"
          :color="noti.leida ? '' : 'light'"
        >
          <ion-label>
            <h2>{{ noti.mensaje }}</h2>
            <p>{{ formatFecha(noti.fecha) }}</p>
          </ion-label>
          <ion-button
            v-if="!noti.leida"
            slot="end"
            fill="clear"
            title="Marcar como leída"
            @click="marcarComoLeida(noti.id)">
            👁️
          </ion-button>
        </ion-item>
      </ion-list>
      <div v-else class="ion-text-center ion-padding">
        No tienes notificaciones.
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
  IonButton, IonList
} from '@ionic/vue';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/firebase';
import { onMounted, ref } from 'vue';

export default {
    components: {
        IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
        IonButton, IonList
  },
  name: 'Notificaciones',
  setup() {
    const notificaciones = ref([]);
    const auth = getAuth();
    const cargando = ref(true);

    const cargarNotificaciones = () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, 'notificaciones'),
        where('idUsuario', '==', user.uid)
      );

      onSnapshot(q, (snapshot) => {
        notificaciones.value = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })).sort((a, b) => b.fecha?.seconds - a.fecha?.seconds); // más recientes arriba
      });

      cargando.value = false;
    };

    const marcarComoLeida = async (id) => {
      await updateDoc(doc(db, 'notificaciones', id), {
        leida: true,
      });
    };

    const formatFecha = (fecha) => {
      return fecha?.toDate().toLocaleString('es-ES') || '';
    };

    onMounted(() => {
      cargarNotificaciones();
    });

    return { notificaciones, marcarComoLeida, formatFecha, cargando
    };
  },
};
</script>
