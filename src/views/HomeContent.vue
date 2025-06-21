<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Buscador -->
      <ion-searchbar
        v-model="busqueda"
        placeholder="Buscar biblioteca..."
        debounce="300"
      ></ion-searchbar>

      <!-- Spinner de carga -->
      <ion-spinner v-if="cargando" name="crescent"></ion-spinner>
      <p v-if="cargando">Cargando datos...</p>
      

      <!-- Lista de bibliotecas -->
      <ion-grid v-else>
        <ion-row>
          <ion-col
            size="12"
            size-sm="6"
            size-md="4"
            v-for="biblioteca in bibliotecasFiltradas"
            :key="biblioteca.id"
          >
            <ion-card @click="verBiblioteca(biblioteca.id)" button>
              <img
                v-if="biblioteca.imagenes && biblioteca.imagenes.length"
                :src="biblioteca.imagenes[0]"
                alt="Imagen biblioteca"
              />
              <ion-card-header>
                <ion-card-title>{{ biblioteca.nombre }}</ion-card-title>
              </ion-card-header>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol,
  IonCard, IonCardHeader, IonCardTitle, IonSearchbar, IonSpinner
} from '@ionic/vue';
import { ref, onMounted, watch } from 'vue';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useRouter } from 'vue-router';

export default {
  components: {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol,
    IonCard, IonCardHeader, IonCardTitle, IonSearchbar, IonSpinner
  },
  setup() {
    const bibliotecas = ref([]);
    const bibliotecasFiltradas = ref([]);
    const busqueda = ref('');
    const cargando = ref(true);
    const router = useRouter();

    const cargarBibliotecas = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'bibliotecas'));
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        bibliotecas.value = data;
        bibliotecasFiltradas.value = data;
      } catch (error) {
        console.error('Error cargando bibliotecas:', error);
      } finally {
        cargando.value = false;
      }
    };

    // Watch para búsqueda reactiva
    watch(busqueda, (nuevoValor) => {
      const texto = nuevoValor.toLowerCase();
      bibliotecasFiltradas.value = bibliotecas.value.filter(b =>
        b.nombre.toLowerCase().includes(texto)
      );
    });

    const verBiblioteca = (id) => {
      router.push(`/ver-biblioteca-reservas/${id}`);
    };

    onMounted(() => {
      cargarBibliotecas();
    });

    return {
      busqueda, bibliotecas, bibliotecasFiltradas, cargando, verBiblioteca
    };
  }
};
</script>

<style scoped>
img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 8px 8px 0 0;
}
ion-card {
  cursor: pointer;
  transition: transform 0.2s ease;
}
ion-card:hover {
  transform: scale(1.02);
}
ion-card-title {
  text-align: center;
  font-size: 18px;
}
.spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}
</style>
