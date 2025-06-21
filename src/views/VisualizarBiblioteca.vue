<template>
  <ion-page>
    <ion-header>
      <ion-toolbar></ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-toolbar>
          <ion-buttons>
            <ion-button @click="router.push('/app/gestion-bibliotecas')">← Volver</ion-button>
          </ion-buttons>
        </ion-toolbar>

        <ion-card-header>
          <ion-card-title>Visualizar Biblioteca</ion-card-title>
        </ion-card-header>

        <ion-card-content>
          <ion-spinner v-if="cargando" name="crescent" class="ion-margin"></ion-spinner>
          <p v-if="cargando">Cargando datos...</p>
          
          <div v-else>
            <ion-item >
              <ion-label position="fixed">Nombre:</ion-label>
              <ion-text>{{ biblioteca.nombre }}</ion-text>
            </ion-item>

            <ion-item>
              <ion-label position="fixed">Dirección:</ion-label>
              <ion-text>{{ biblioteca.direccion }}</ion-text>
            </ion-item>
            
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
           
            <ion-card-title class="ion-margin-top margen-left">
              Puesto de estudio
              <ion-button fill="clear" size="default" class="boton-verde-oscuro"
                @click="router.push({ path: '/app/agregar-puesto-estudio', query: { idBiblioteca } })"
                title="Agregar puesto de estudio">
                <ion-icon slot="icon-only" :icon="addOutline"></ion-icon>
              </ion-button>
              <ion-button fill="clear" size="default" class="boton-verde-oscuro"
                @click="router.push({ path: '/app/agregar-varios-puesto-estudio', query: { idBiblioteca } })"
                title="Agregar varios puestos de estudio">
                <ion-icon slot="icon-only" :icon="duplicateOutline"></ion-icon>
              </ion-button>
            </ion-card-title>

            <template v-if="paginatedPuestos.length > 0">
              <div class="tabla-scroll-wrapper margen-left">
                <table class="tabla-puestos">
                  <thead>
                    <tr>
                      <th @click="changeSort('nombre')">Nombre</th>
                      <th @click="changeSort('planta')">Planta</th>
                      <th @click="changeSort('descripcion')">Descripción</th>
                      <th @click="changeSort('enchufe')">Enchufe</th>
                      <th @click="changeSort('ethernet')">Ethernet</th>
                      <th @click="changeSort('monitor')">Monitor</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="puesto in paginatedPuestos" :key="puesto.id">
                      <td>{{ puesto.nombre }}</td>
                      <td>{{ puesto.planta }}</td>
                      <td>{{ puesto.descripcion }}</td>
                      <td>{{ puesto.enchufe ? '✅' : '❌' }}</td>
                      <td>{{ puesto.ethernet ? '✅' : '❌' }}</td>
                      <td>{{ puesto.monitor ? '✅' : '❌' }}</td>
                      <td>
                        <ion-button size="small" fill="clear" color="primary"
                          @click="editarPuesto(puesto)" title="Editar puesto de estudio">✏️</ion-button>
                        <ion-button size="small" fill="clear" color="danger"
                          @click="confirmarEliminacion(puesto.id)" title="Eliminar puesto de estudio">🗑️</ion-button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              
                <!-- Paginación -->
                <div class="paginacion">
                  <ion-button fill="clear" @click="prevPage" :disabled="currentPage === 1">⬅️ Anterior</ion-button>
                  <span>Página {{ currentPage }} de {{ totalPages }}</span>
                  <ion-button fill="clear" @click="nextPage" :disabled="currentPage === totalPages">Siguiente ➡️</ion-button>
                </div>
              </div>
            </template>
            <template v-else>
              <p class="margen-left">No hay puestos de estudio registrados.</p>
            </template>


            <ion-card-title class="ion-margin-top margen-left">
              Sala de grupo
              <ion-button fill="clear" size="default" class="boton-verde-oscuro"
                @click="router.push({ path: '/app/agregar-sala-grupo', query: { idBiblioteca } })"
                title="Agregar sala de grupo">
                <ion-icon slot="icon-only" :icon="addOutline"></ion-icon>
              </ion-button>
            </ion-card-title>

            <template v-if="paginatedSalas.length > 0">
              <div class="tabla-scroll-wrapper margen-left">
                <table class="tabla-puestos">
                  <thead>
                    <tr>
                      <th @click="changeSortSalas('nombre')">Nombre</th>
                      <th @click="changeSortSalas('planta')">Planta</th>
                      <th @click="changeSortSalas('capacidad')">Capacidad</th>
                      <th @click="changeSortSalas('enchufe')">Enchufe</th>
                      <th @click="changeSortSalas('ethernet')">Ethernet</th>
                      <th @click="changeSortSalas('monitor')">Monitor</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="sala in paginatedSalas" :key="sala.id">
                      <td>{{ sala.nombre }}</td>
                      <td>{{ sala.planta }}</td>
                      <td>{{ sala.capacidad }}</td>
                      <td>{{ sala.enchufe ? '✅' : '❌' }}</td>
                      <td>{{ sala.ethernet ? '✅' : '❌' }}</td>
                      <td>{{ sala.monitor ? '✅' : '❌' }}</td>
                      <td>
                        <ion-button size="small" fill="clear" color="primary"
                          @click="editarSala(sala)" title="Editar sala de grupo">✏️</ion-button>
                        <ion-button size="small" fill="clear" color="danger"
                          @click="confirmarEliminacionSala(sala.id)" title="Eliminar sala de grupo">🗑️</ion-button>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- Paginación salas -->
                <div class="paginacion">
                  <ion-button fill="clear" @click="prevPageSalas" :disabled="currentPageSalas === 1">⬅️ Anterior</ion-button>
                  <span>Página {{ currentPageSalas }} de {{ totalPagesSalas }}</span>
                  <ion-button fill="clear" @click="nextPageSalas" :disabled="currentPageSalas === totalPagesSalas">Siguiente ➡️</ion-button>
                </div>
              </div>
            </template>
            <template v-else>
              <p class="margen-left">No hay salas de grupo registradas.</p>
            </template>

            <ion-card-title class="ion-margin-top margen-left">
              Bibliotecarios
              <ion-button fill="clear" size="default" class="boton-verde-oscuro"
                @click="router.push({ path: '/app/agregar-bibliotecarios', query: { idBiblioteca } })"
                title="Agregar bibliotecarios">
                <ion-icon slot="icon-only" :icon="addOutline"></ion-icon>
              </ion-button>
            </ion-card-title>


          </div>
        </ion-card-content>
      </ion-card>

      <!-- Modal de Confirmación para Eliminar Puesto de estudio -->
      <ion-alert
        :is-open="mostrarAlerta"
        header="Confirmar eliminación"
        message="¿Estás seguro de que deseas eliminar este puesto de estudio?"
        :buttons="[
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Eliminar', role: 'confirm', handler: eliminarPuesto }
        ]"
        @didDismiss="mostrarAlerta = false"
      />

      <!-- Modal de Confirmación para Eliminar Sala de grupo -->
      <ion-alert
        :is-open="mostrarAlertaEliminarSala"
        header="Confirmar eliminación"
        message="¿Estás seguro de que deseas eliminar esta sala de grupo?"
        :buttons="[
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Eliminar', role: 'confirm', handler: eliminarSala }
        ]"
        @didDismiss="mostrarAlertaEliminarSala"
      />

    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage, IonHeader, IonToolbar, IonContent, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonItem, IonLabel, IonText, IonButtons, IonButton, IonList, IonSpinner, IonIcon,
  IonAlert
} from '@ionic/vue';
import { addOutline, duplicateOutline} from 'ionicons/icons';
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default {
  components: {
    IonPage, IonHeader, IonToolbar, IonContent, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonItem, IonLabel, IonText, IonButtons, IonButton, IonList, IonSpinner, IonIcon,
    IonAlert
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const idBiblioteca = route.query.idBiblioteca || '';
    const biblioteca = ref({
      nombre: '',
      direccion: '',
      horarios: [],
      imagenes: []
    });

    //Puesto de estudio
    const puestos = ref([]);
    const cargando = ref(true);
    const mostrarAlerta = ref(false);
    const idPuestoEliminar = ref(null);

    const paginaActual = ref(1);
    const porPagina = 5;
    const currentPage = ref(1);
    const pageSize = ref(5);
    const sortBy = ref('');
    const sortDirection = ref('asc');

    //Salas de grupo
    const salas = ref([]);
    const sortBySalas = ref('');
    const sortDirectionSalas = ref('asc');
    const currentPageSalas = ref(1);
    const pageSizeSalas = ref(5);
    const idSalaEliminar = ref(null);
    const mostrarAlertaEliminarSala = ref(false);

    const cargarDatos = async () => {
      try {
        if (!idBiblioteca) return;
        const docRef = doc(db, 'bibliotecas', idBiblioteca);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          biblioteca.value = docSnap.data();
        }
        
      } finally {
        cargando.value = false;
      }
    };

    const cargarPuestos = async () => {
      const querySnapshot = await getDocs(query(collection(db, 'puestosEstudio'), where('idBiblioteca', '==', idBiblioteca)));
      puestos.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const cargarSalas = async () => {
      const querySnapshot = await getDocs(query(collection(db, 'salasGrupo'), where('idBiblioteca', '==', idBiblioteca)));
      salas.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };


    // Ordenar los puestos de estudio
    const sortedPuestos = computed(() => {
      let sorted = [...puestos.value];
      if (sortBy.value) {
        sorted.sort((a, b) => {
          const valA = a[sortBy.value];
          const valB = b[sortBy.value];

          if (valA < valB) return sortDirection.value === 'asc' ? -1 : 1;
          if (valA > valB) return sortDirection.value === 'asc' ? 1 : -1;
          return 0;
        });
      }
      return sorted;
    });

    // Paginación de Puestos de estudio
    const paginatedPuestos = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      return sortedPuestos.value.slice(start, start + pageSize.value);
    });

    const totalPages = computed(() =>
      Math.ceil(sortedPuestos.value.length / pageSize.value)
    );

    const changeSort = (campo) => {
      if (sortBy.value === campo) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
      } else {
        sortBy.value = campo;
        sortDirection.value = 'asc';
      }
    };

    const nextPage = () => {
      if (currentPage.value < totalPages.value) currentPage.value++;
    };
    const prevPage = () => {
      if (currentPage.value > 1) currentPage.value--;
    };

    //Acciones Puesto de estudio
    const editarPuesto = (puesto) => {
      router.push({
        path: '/app/agregar-puesto-estudio',
        query: { idBiblioteca, idPuesto: puesto.id }
      });
    };

    const confirmarEliminacion = (id) => {
      idPuestoEliminar.value = id;
      mostrarAlerta.value = true;
    };

    const eliminarPuesto = async () => {
      await deleteDoc(doc(db, 'puestosEstudio', idPuestoEliminar.value));
      await cargarPuestos();
      mostrarAlerta.value = false;
    };

    //Paginacion y ordenacion de Salas de grupo
    const sortedSalas = computed(() => {
      let sorted = [...salas.value];
      if (sortBySalas.value) {
        sorted.sort((a, b) => {
          const valA = a[sortBySalas.value];
          const valB = b[sortBySalas.value];
          if (valA < valB) return sortDirectionSalas.value === 'asc' ? -1 : 1;
          if (valA > valB) return sortDirectionSalas.value === 'asc' ? 1 : -1;
          return 0;
        });
      }
      return sorted;
    });

    const paginatedSalas = computed(() => {
      const start = (currentPageSalas.value - 1) * pageSizeSalas.value;
      return sortedSalas.value.slice(start, start + pageSizeSalas.value);
    });

    const totalPagesSalas = computed(() => 
      Math.ceil(sortedSalas.value.length / pageSizeSalas.value)
    );

    const changeSortSalas = (campo) => {
      if (sortBySalas.value === campo) {
        sortDirectionSalas.value = sortDirectionSalas.value === 'asc' ? 'desc' : 'asc';
      } else {
        sortBySalas.value = campo;
        sortDirectionSalas.value = 'asc';
      }
    };

    const nextPageSalas = () => {
      if (currentPageSalas.value < totalPagesSalas.value) currentPageSalas.value++;
    };

    const prevPageSalas = () => {
      if (currentPageSalas.value > 1) currentPageSalas.value--;
    };

    //Acciones salas de grupo
    const editarSala = (sala) => {
      router.push({
        path: '/app/agregar-sala-grupo',
        query: { idBiblioteca, idSala: sala.id }
      });
    };

    const confirmarEliminacionSala = (id) => {
      idSalaEliminar.value = id;
      mostrarAlertaEliminarSala.value = true;
    };

    const eliminarSala = async () => {
      await deleteDoc(doc(db, 'salasGrupo', idSalaEliminar.value));
      await cargarSalas();
      mostrarAlertaEliminarSala.value = false;
    };


    onMounted(async () => {
      await cargarDatos();
      await cargarPuestos();
      await cargarSalas();
    });

    return {biblioteca, router, idBiblioteca, cargando, paginaActual, porPagina, addOutline, duplicateOutline, editarPuesto,
      confirmarEliminacion, eliminarPuesto, mostrarAlerta, paginatedPuestos, currentPage, totalPages, changeSort,
      nextPage, prevPage, sortBy, sortDirection, salas, editarSala, confirmarEliminacionSala, eliminarSala, paginatedSalas,
      currentPageSalas, totalPagesSalas, changeSortSalas, nextPageSalas, prevPageSalas, sortBySalas, sortDirectionSalas,
      mostrarAlertaEliminarSala
    };
  }
};
</script>

<style scoped>
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

table {
  width: 100%;
  margin-top: 15px;
  border-collapse: collapse;
}
th {
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid #ccc;
  padding: 8px;
}
td {
  padding: 8px;
  border-bottom: 1px solid #eee;
}
.paginacion {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.tabla-scroll-wrapper {
  overflow-x: auto;
  width: 100%;
}

.tabla-puestos {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px; /* Evita que las columnas se encojan demasiado */
}

.tabla-puestos th,
.tabla-puestos td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #ccc;
  white-space: nowrap;
}

.margen-left {
  margin-left: 15px;
}

.boton-verde-oscuro {
  color: #2e7d32; 
}
</style>
