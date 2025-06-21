<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Agregar varios Puestos de Estudio</ion-card-title>
        </ion-card-header>

        <ion-card-content>
          <ion-item>
            <ion-label position="floating">Nombre</ion-label>
            <ion-input v-model="nombreBase" class="margen-top"></ion-input>
            <p v-if="errores.nombreBase" class="error-text">{{ errores.nombreBase }}</p>
          </ion-item>

          <ion-item>
            <ion-label position="floating">Planta</ion-label>
            <ion-input v-model="planta" class="margen-top"></ion-input>
            <p v-if="errores.planta" class="error-text">{{ errores.planta }}</p>
          </ion-item>

          <ion-item>
            <ion-label position="floating">Descripción</ion-label>
            <ion-textarea v-model="descripcion" class="margen-top"></ion-textarea>
          </ion-item>

          <ion-item>
            <ion-label>Enchufe</ion-label>
            <ion-checkbox v-model="enchufe" slot="start"></ion-checkbox>
          </ion-item>

          <ion-item>
            <ion-label>Ethernet</ion-label>
            <ion-checkbox v-model="ethernet" slot="start"></ion-checkbox>
          </ion-item>

          <ion-item>
            <ion-label>Monitor</ion-label>
            <ion-checkbox v-model="monitor" slot="start"></ion-checkbox>
          </ion-item>

          <ion-item>
            <ion-label position="floating">Número comienzo secuencia</ion-label>
            <ion-input type="number" v-model.number="numeroComienzoSecuencia" class="margen-top"></ion-input>
            <p v-if="errores.numeroComienzoSecuencia" class="error-text">{{ errores.numeroComienzoSecuencia }}</p>
          </ion-item>

          <ion-item>
            <ion-label position="floating">Cantidad</ion-label>
            <ion-input type="number" v-model.number="cantidad" class="margen-top"></ion-input>
            <p v-if="errores.cantidad" class="error-text">{{ errores.cantidad }}</p>
          </ion-item>

          <div class="button-group">
            <ion-button color="primary" @click="guardarPuestos">Guardar</ion-button>
            <ion-button color="danger" @click="cancelar">Cancelar</ion-button>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonTextarea, IonCheckbox, IonButton
} from '@ionic/vue';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default {
  components: {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonInput, IonTextarea, IonCheckbox, IonButton
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const idBiblioteca = route.query.idBiblioteca || '';

    const nombreBase = ref('');
    const planta = ref('');
    const descripcion = ref('');
    const enchufe = ref(false);
    const ethernet = ref(false);
    const monitor = ref(false);
    const numeroComienzoSecuencia = ref(null);
    const cantidad = ref(null);

    const errores = ref({});

    const validar = () => {
      errores.value = {};
      if (!nombreBase.value) errores.value.nombreBase = 'El nombre es obligatorio';
      if (!planta.value) errores.value.planta = 'La planta es obligatoria';
      if (numeroComienzoSecuencia.value == null || numeroComienzoSecuencia.value < 0)
        errores.value.numeroComienzoSecuencia = 'Número de comienzo inválido';
      if (cantidad.value == null || cantidad.value < 1)
        errores.value.cantidad = 'La cantidad debe ser al menos 1';
      return Object.keys(errores.value).length === 0;
    };

    const guardarPuestos = async () => {
      if (!validar()) return;

      for (let i = 0; i < cantidad.value; i++) {
        const nombre = `${nombreBase.value} ${numeroComienzoSecuencia.value + i}`;
        const nuevoPuesto = {
          nombre,
          planta: planta.value,
          descripcion: descripcion.value || '',
          enchufe: enchufe.value,
          ethernet: ethernet.value,
          monitor: monitor.value,
          idBiblioteca
        };
        await addDoc(collection(db, 'puestosEstudio'), nuevoPuesto);
      }

      router.push({ path: '/app/visualizar-biblioteca', query: { idBiblioteca } });
    };

    const cancelar = () => {
      router.push({ path: '/app/visualizar-biblioteca', query: { idBiblioteca } });
    };

    return {
      nombreBase, planta, descripcion, enchufe, ethernet, monitor,
      numeroComienzoSecuencia, cantidad, guardarPuestos, cancelar,
      errores
    };
  }
};
</script>

<style scoped>
.error-text {
  color: red;
  font-size: 14px;
  margin-top: 4px;
}
.button-group {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 15px;
}

.margen-top{
    margin-top: 10px;
  }
</style>
