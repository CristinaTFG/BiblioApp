<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
            <ion-card-title>Bibliotecarios asignados</ion-card-title>
          </ion-card-header>

        <ion-card-content>
          <ion-spinner v-if="cargando" name="crescent"></ion-spinner>
          <p v-if="cargando">Cargando bibliotecarios...</p>

          <template v-else>
            <ion-searchbar
              v-model="filtroBusqueda"
              placeholder="Buscar bibliotecario"
              class="ion-margin-bottom"
            />
            <div class="tabla-scroll-wrapper margen-left">
              <table>
                <thead>
                  <tr>
                    <th @click="ordenarPor('seleccionado')">
                      Asignados {{ orden.campo === 'seleccionado' ? (orden.asc ? '▲' : '▼') : '' }}
                    </th>
                    <th @click="ordenarPor('nombre')">
                      Nombre {{ orden.campo === 'nombre' ? (orden.asc ? '▲' : '▼') : '' }}
                    </th>
                    <th @click="ordenarPor('apellidos')">
                      Apellidos {{ orden.campo === 'apellidos' ? (orden.asc ? '▲' : '▼') : '' }}
                    </th>
                    <th @click="ordenarPor('correo')">
                      Correo electrónico {{ orden.campo === 'correo' ? (orden.asc ? '▲' : '▼') : '' }}
                    </th>

                  </tr>
                </thead>
                <tbody>
                  <tr v-for="b in bibliotecariosPagina" :key="b.id">
                    <td><input type="checkbox" v-model="seleccionados" :value="b.id" /></td>
                    <td>{{ b.nombre }}</td>
                    <td>{{ b.apellidos }}</td>
                    <td>{{ b.correo }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="paginacion">
                <ion-button fill="clear" @click="paginaActual--" :disabled="paginaActual === 1">⬅️ Anterior</ion-button>
                <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
                <ion-button fill="clear" @click="paginaActual++" :disabled="paginaActual >= totalPaginas">Siguiente ➡️</ion-button>
              </div>
            </div>

            <div class="button-group">
              <ion-button color="primary" @click="guardarSeleccion">Guardar</ion-button>
              <ion-button color="danger" @click="cancelar">Cancelar</ion-button>
            </div>
          </template>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonButtons, IonButton, IonSpinner, IonSearchbar
} from '@ionic/vue';
import { onMounted, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { collection, getDocs, query, where, doc, addDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

export default {
  components: {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonButtons, IonButton, IonSpinner, IonSearchbar
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const idBiblioteca = route.query.idBiblioteca || '';

    const cargando = ref(true);

    const filtroBusqueda = ref('');
    const bibliotecariosOriginales = ref([]); // todos desde Firestore
    const orden = ref({ campo: 'nombre', asc: true });
    const paginaActual = ref(1);
    const itemsPorPagina = 5;

    const seleccionados = ref([]); // para checkboxes


    const cargarBibliotecarios = async () => {
      const snapshot = await getDocs(query(
        collection(db, 'usuarios'),
        where('tipoUsuarioRef', '==', doc(db, 'tipoUsuario', '3'))
      ));

      const biblios = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      bibliotecariosOriginales.value = biblios;
      cargando.value = false;
    };

    const cargarRelacionados = async () => {
      const relSnapshot = await getDocs(query(
        collection(db, 'relUsuarioBiblioteca'),
        where('idBiblioteca', '==', idBiblioteca)
      ));

      seleccionados.value = relSnapshot.docs.map(doc => doc.data().idUsuario);
    };

    const bibliotecariosProcesados = computed(() => {
      const texto = filtroBusqueda.value.toLowerCase();

      // 1. Filtrado seguro
      let lista = bibliotecariosOriginales.value.filter(b =>
        (b.nombre?.toLowerCase() || '').includes(texto) ||
        (b.apellidos?.toLowerCase() || '').includes(texto)||
        (b.correo?.toLowerCase() || '').includes(texto)
      );

      // 2. Ordenamiento seguro
      lista.sort((a, b) => {
        let valorA, valorB;

        if (orden.value.campo === 'seleccionado') {
          valorA = seleccionados.value.includes(a.id) ? 1 : 0;
          valorB = seleccionados.value.includes(b.id) ? 1 : 0;
        } else {
          valorA = a[orden.value.campo]?.toLowerCase?.() || '';
          valorB = b[orden.value.campo]?.toLowerCase?.() || '';
        }

        if (valorA < valorB) return orden.value.asc ? -1 : 1;
        if (valorA > valorB) return orden.value.asc ? 1 : -1;
        return 0;
      });


      return lista;
    });


    const totalPaginas = computed(() =>
      Math.ceil(bibliotecariosProcesados.value.length / itemsPorPagina)
    );

    const bibliotecariosPagina = computed(() => {
      const start = (paginaActual.value - 1) * itemsPorPagina;
      return bibliotecariosProcesados.value.slice(start, start + itemsPorPagina);
    });

    const ordenarPor = campo => {
      if (orden.value.campo === campo) {
        orden.value.asc = !orden.value.asc;
      } else {
        orden.value = { campo, asc: true };
      }
      paginaActual.value = 1;
    };




    const guardarSeleccion = async () => {
      // Elimina primero todas las relaciones existentes
      const relQuery = query(
      collection(db, 'relUsuarioBiblioteca'),
      where('idBiblioteca', '==', idBiblioteca)
      );
      const relSnapshot = await getDocs(relQuery);
      const batch = writeBatch(db);
      relSnapshot.forEach(docRel => {
      batch.delete(doc(db, 'relUsuarioBiblioteca', docRel.id));
      });
      await batch.commit();

      // Luego agrega las nuevas
      for (const idUsuario of seleccionados.value) {
      const data = {
          idBiblioteca: idBiblioteca,
          idUsuario: idUsuario
      };
      await addDoc(collection(db, 'relUsuarioBiblioteca'), data);
      }

      router.push({ path: '/app/visualizar-biblioteca', query: { idBiblioteca } });
    };

    const cancelar = () => {
        router.push({ path: '/app/visualizar-biblioteca', query: { idBiblioteca } });
    };

    onMounted(() => {
        cargarRelacionados();
        cargarBibliotecarios();
    });

    return {
        bibliotecariosOriginales, seleccionados, totalPaginas, paginaActual, bibliotecariosPagina,
        cargarBibliotecarios, guardarSeleccion, cancelar, cargando, ordenarPor,
        filtroBusqueda, orden, cargarRelacionados
    };
    }
};
</script>

<style scoped>

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

.button-group {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 20px;
  }
</style>
