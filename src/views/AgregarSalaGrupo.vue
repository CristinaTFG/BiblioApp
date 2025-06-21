<template>
  <ion-page>
    <ion-header>
      <ion-toolbar></ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Sala de Grupo</ion-card-title>
        </ion-card-header>
        <ion-card-content>

          <ion-item>
            <ion-label position="floating">Nombre</ion-label>
            <ion-input v-model="nombre" required class="margen-top"></ion-input>
          </ion-item>
          <p v-if="errores.nombre" class="error-text">{{ errores.nombre }}</p>

          <ion-item>
            <ion-label position="floating">Planta</ion-label>
            <ion-input v-model="planta" type="number" required inputmode="numeric" class="margen-top"></ion-input>
          </ion-item>
          <p v-if="errores.planta" class="error-text">{{ errores.planta }}</p>

          <ion-item>
            <ion-label position="floating">Capacidad</ion-label>
            <ion-input v-model="capacidad" type="number" required inputmode="numeric" class="margen-top"></ion-input>
          </ion-item>
          <p v-if="errores.capacidad" class="error-text">{{ errores.capacidad }}</p>

          <ion-item>
            <ion-label>Enchufe</ion-label>
            <ion-checkbox slot="start" v-model="enchufe"></ion-checkbox>
          </ion-item>

          <ion-item>
            <ion-label>Conexión Ethernet</ion-label>
            <ion-checkbox slot="start" v-model="ethernet"></ion-checkbox>
          </ion-item>

          <ion-item>
            <ion-label>Monitor</ion-label>
            <ion-checkbox slot="start" v-model="monitor"></ion-checkbox>
          </ion-item>

          <div class="button-group">
            <ion-button color="primary" @click="guardar">Guardar</ion-button>
            <ion-button color="danger" @click="volver">Cancelar</ion-button>
          </div>

        </ion-card-content>
      </ion-card>

      <ion-toast :is-open="mostrarError" :message="mensajeError" color="danger" :duration="2000" @didDismiss="mostrarError = false"></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage, IonHeader, IonToolbar, IonContent, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonItem, IonLabel, IonInput, IonButton, IonCheckbox, IonToast
} from '@ionic/vue';

import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default {
  components: {
    IonPage, IonHeader, IonToolbar, IonContent, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonItem, IonLabel, IonInput, IonButton, IonCheckbox, IonToast
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const idBiblioteca = route.query.idBiblioteca || '';
    const idSala = route.query.idSala || null;

    const nombre = ref('');
    const planta = ref('');
    const capacidad = ref('');
    const enchufe = ref(false);
    const ethernet = ref(false);
    const monitor = ref(false);
    const errores = ref({});
    const mostrarError = ref(false);
    const mensajeError = ref('');

    const validar = () => {
      errores.value = {};
      if (!nombre.value.trim()) errores.value.nombre = 'El nombre es obligatorio';
      if (!planta.value.trim()) errores.value.planta = 'La planta es obligatoria';
      if (!capacidad.value.trim()) errores.value.capacidad = 'La capacidad es obligatoria';
      return Object.keys(errores.value).length === 0;
    };

    const guardar = async () => {
      if (!validar()) {
        mensajeError.value = 'Completa los campos obligatorios';
        mostrarError.value = true;
        return;
      }

      try {
        const data = {
          nombre: nombre.value,
          planta: planta.value,
          capacidad: capacidad.value,
          enchufe: enchufe.value,
          ethernet: ethernet.value,
          monitor: monitor.value,
          idBiblioteca: idBiblioteca
        };

        if (idSala) {
          await updateDoc(doc(db, 'salasGrupo', idSala), data);
        } else {
          await addDoc(collection(db, 'salasGrupo'), data);
        }

        router.push({ name: 'VisualizarBiblioteca', query: { idBiblioteca: idBiblioteca } });
      } catch (error) {
        mensajeError.value = 'Error al guardar: ' + error.message;
        mostrarError.value = true;
      }
    };

    const volver = () => {
      router.push({ name: 'VisualizarBiblioteca', query: { idBiblioteca: idBiblioteca } });
    };

    const cargarSala = async () => {
      if (!idSala) return;
      const docRef = doc(db, 'salasGrupo', idSala);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        nombre.value = data.nombre;
        planta.value = data.planta;
        capacidad.value = data.capacidad;
        enchufe.value = data.enchufe;
        ethernet.value = data.ethernet;
        monitor.value = data.monitor;
      }
    };

    onMounted(() => {
      if (idSala) cargarSala();
    });

    return {
      nombre, planta, capacidad, enchufe, ethernet, monitor,
      guardar, volver, errores, mostrarError, mensajeError
    };
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
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}
.margen-top {
  margin-top: 10px;
}
</style>
