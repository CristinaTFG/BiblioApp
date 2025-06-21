<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="ion-padding">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Puesto de Estudio</ion-card-title>
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
              <ion-label position="floating">Descripción</ion-label>
              <ion-textarea v-model="descripcion" class="margen-top"></ion-textarea>
            </ion-item>
  
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
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent, IonCardHeader, IonCardTitle, 
    IonItem, IonLabel, IonInput, IonButton, IonButtons, IonCheckbox, IonTextarea, IonToast 
  } from '@ionic/vue';
  
  import { ref, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
  import { db } from '../firebase';
  
  export default {
    components: {
      IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent,IonCardHeader, IonCardTitle,
      IonItem, IonLabel, IonInput, IonButton, IonButtons, IonCheckbox, IonTextarea, IonToast
    },
    setup() {
      const router = useRouter();
      const route = useRoute();
      const bibliotecaId = route.query.idBiblioteca || '';
      const idPuesto = route.query.idPuesto || null;
  
      const nombre = ref('');
      const planta = ref('');
      const descripcion = ref('');
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
            descripcion: descripcion.value,
            enchufe: enchufe.value,
            ethernet: ethernet.value,
            monitor: monitor.value,
            idBiblioteca: bibliotecaId
          };

          if (idPuesto) {
            await updateDoc(doc(db, 'puestosEstudio', idPuesto), data);
          } else {
            await addDoc(collection(db, 'puestosEstudio'), data);
          }
                    
          router.push({ name: 'VisualizarBiblioteca', query: { idBiblioteca: bibliotecaId } });
        } catch (error) {
          mensajeError.value = 'Error al guardar: ' + error.message;
          mostrarError.value = true;
        }
      };
  
      const volver = () => {
        router.push({ name: 'VisualizarBiblioteca', query: { idBiblioteca: bibliotecaId } });
      };

      const cargarPuesto = async () => {
        if (!idPuesto) return;
        const docRef = doc(db, 'puestosEstudio', idPuesto);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          nombre.value = data.nombre;
          planta.value = data.planta;
          descripcion.value = data.descripcion;
          enchufe.value = data.enchufe;
          ethernet.value = data.ethernet;
          monitor.value = data.monitor;
        }
      };

      onMounted(() => {
        if (idPuesto) cargarPuesto();
      });
  
      return {
        nombre, planta, descripcion, enchufe, ethernet, monitor, guardar, volver,
        errores, mostrarError, mensajeError
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

  .margen-top{
    margin-top: 10px;
  }
  </style>
  