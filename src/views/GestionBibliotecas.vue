<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Gestión de Bibliotecas</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <h2>Administrar bibliotecas</h2>

      <div class="button-group">
        <ion-buttons slot="end">
          <ion-button v-if="!isBibliotecario"
            size="default" class="boton-verde-oscuro"
            @click="router.push('/agregar-biblioteca')" 
            title="Agregar nueva biblioteca">
            <ion-icon slot="icon-only" :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </div>
      
      <!-- Mostrar "Cargando datos..." mientras se cargan los usuarios -->
      <ion-spinner v-if="cargando" name="crescent"></ion-spinner>
      <p v-if="cargando">Cargando datos...</p>

      <ion-list v-if="!cargando && bibliotecas.length > 0">
        <ion-item v-for="biblioteca in bibliotecas" :key="biblioteca.id"  style="margin-top:10px;">
          <ion-img v-if="biblioteca.imagenes && biblioteca.imagenes.length"
            :src="biblioteca.imagenes[0]"
            alt="Imagen de biblioteca"
            class="miniatura-biblioteca">
          </ion-img>
          <ion-label style="margin-left: 10px;">
            <ion-label>
              <strong>{{ biblioteca.nombre }}</strong>
            </ion-label>
            <p><strong>Dirección:</strong> {{ biblioteca.direccion }}</p>
            <p><strong>Puestos de Estudio:</strong> {{ biblioteca.numPuestos }}</p>
            <p><strong>Salas de Grupo:</strong> {{ biblioteca.numSalas }}</p>
          </ion-label>

          <ion-buttons slot="end">
            <!-- Ver detalles -->
            <ion-button fill="clear" color="primary" @click="irAVisualizarBiblioteca(biblioteca)" title="Ver biblioteca">👁️</ion-button>
            <!-- Editar -->
            <ion-button fill="clear" color="warning" @click="editarBiblioteca(biblioteca)" title="Editar biblioteca">✏️</ion-button>
            <!-- Eliminar -->
            <ion-button fill="clear" color="danger" @click="confirmarEliminacion(biblioteca.id)" title="Eliminar biblioteca">🗑️</ion-button>
            <!-- Historial de Reservas -->
            <ion-button fill="clear" @click="irHistorialReservas(biblioteca.id)"  title="Historial de Reservas">📅</ion-button>
          </ion-buttons>
        </ion-item>
      </ion-list>

      <!-- Mensaje si no hay bibliotecas -->
      <p v-if="!cargando && bibliotecas.length === 0">No hay bibliotecas disponibles.</p>

      <!-- Modal de Confirmación para Eliminar -->
      <ion-alert
        :is-open="showConfirmDelete"
        header="Confirmar Eliminación"
        message="¿Estás seguro de que deseas eliminar esta biblioteca? Esta acción no se puede deshacer."
        :buttons="[
          { text: 'Cancelar', role: 'cancel', handler: () => (showConfirmDelete = false) },
          { text: 'Eliminar', role: 'destructive', handler: eliminarBiblioteca }
        ]"
      />
    </ion-content>
  </ion-page>
</template>

<script>
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonList, IonItem, IonLabel, IonAlert, IonSpinner, IonIcon, IonButtons, IonImg
} from '@ionic/vue';
import { addOutline} from 'ionicons/icons';
import { ref, onMounted } from 'vue';
import { db, auth} from '../firebase';
import { collection, getDocs, query, where, deleteDoc, doc, writeBatch, getDoc } from 'firebase/firestore';
import { useRouter } from 'vue-router';

export default {
  components: {IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonList, IonItem, IonLabel, IonAlert, IonSpinner, IonButtons, IonImg
  },

  setup() {
    const cargando = ref(true);
    const bibliotecas = ref([]);
    const router = useRouter();
    const showConfirmDelete = ref(false);
    const bibliotecaIdAEliminar = ref(null);
    const usuarioActual = ref(null);
    const isBibliotecario = ref(false);

    const cargarBibliotecas = async () => {
      await cargarUsuarioActual();

      if (usuarioActual.value?.tipoUsuarioRef.id == 3) {
        isBibliotecario.value = true;
        // Bibliotecario → obtener bibliotecas asignadas
        const relSnap = await getDocs(query(collection(db, 'relUsuarioBiblioteca'),
          where('idUsuario', '==', usuarioActual.value.id)
        ));

        const idsBibliotecas = relSnap.docs.map(doc => doc.data().idBiblioteca);

        if (idsBibliotecas.length === 0) {
          bibliotecas.value = [];
          cargando.value = false;
          return;
        }

        // Cargar solo las bibliotecas correspondientes
        const promises = idsBibliotecas.map(id => getDoc(doc(db, 'bibliotecas', id)));
        const bibliotecaDocs = await Promise.all(promises);

        const bibliotecasConContadores = [];

        for (const docBiblioteca of bibliotecaDocs) {
          if (!docBiblioteca.exists()) continue;

          const bibliotecaData = { id: docBiblioteca.id, ...docBiblioteca.data() };

          // Contar puestos de estudio relacionados
          const puestosQuery = query(collection(db, 'puestosEstudio'), where('idBiblioteca', '==', bibliotecaData.id));
          const puestosSnapshot = await getDocs(puestosQuery);
          bibliotecaData.numPuestos = puestosSnapshot.size;

          // Contar salas de grupo relacionadas
          const salasQuery = query(collection(db, 'salasGrupo'), where('idBiblioteca', '==', bibliotecaData.id));
          const salasSnapshot = await getDocs(salasQuery);
          bibliotecaData.numSalas = salasSnapshot.size;

          bibliotecasConContadores.push(bibliotecaData);
        }

        bibliotecas.value = bibliotecasConContadores;

      } else {
        // Admin → obtener todas las bibliotecas
        bibliotecas.value = [];
        const querySnapshot = await getDocs(collection(db, 'bibliotecas'));

        for (const docBiblioteca of querySnapshot.docs) {
          const bibliotecaData = { id: docBiblioteca.id, ...docBiblioteca.data() };

          // Contar puestos de estudio relacionados
          const puestosQuery = query(collection(db, 'puestosEstudio'), where('idBiblioteca', '==', bibliotecaData.id));
          const puestosSnapshot = await getDocs(puestosQuery);
          bibliotecaData.numPuestos = puestosSnapshot.size;

          // Contar salas de grupo relacionadas
          const salasQuery = query(collection(db, 'salasGrupo'), where('idBiblioteca', '==', bibliotecaData.id));
          const salasSnapshot = await getDocs(salasQuery);
          bibliotecaData.numSalas = salasSnapshot.size;

          bibliotecas.value.push(bibliotecaData);
        }
      }
      
      cargando.value = false;
    };

    const cargarUsuarioActual = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
      usuarioActual.value = { id: user.uid, ...userDoc.data() };
    };

    const irAVisualizarBiblioteca = (biblioteca) => {
      router.push({ name: 'VisualizarBiblioteca', query: { idBiblioteca: biblioteca.id } });
    };

    const editarBiblioteca = (biblioteca) => {
      router.push({ path: '/agregar-biblioteca', query: { id: biblioteca.id } });
    };

    const confirmarEliminacion = (id) => {
      bibliotecaIdAEliminar.value = id;
      showConfirmDelete.value = true;
    };

    const eliminarBiblioteca = async () => {
      if (!bibliotecaIdAEliminar.value) return;

      // Eliminar reservas puestos de estudio
      const reservasPuestoQuery = query(collection(db, 'reservasPuestoEstudio'), where('idBiblioteca', '==', bibliotecaIdAEliminar.value));
      const reservasPuestoSnapshot = await getDocs(reservasPuestoQuery);
      for (const reservasPuestoDoc of reservasPuestoSnapshot.docs) {
        await deleteDoc(doc(db, 'reservasPuestoEstudio', reservasPuestoDoc.id));
      }

      // Eliminar reservas salas de grupo
      const reservasSalaQuery = query(collection(db, 'reservasSalaGrupo'), where('idBiblioteca', '==', bibliotecaIdAEliminar.value));
      const reservasSalaSnapshot = await getDocs(reservasSalaQuery);
      for (const reservasSalaDoc of reservasSalaSnapshot.docs) {
        await deleteDoc(doc(db, 'reservasSalaGrupo', reservasSalaDoc.id));
      }

      // Eliminar puestos de estudio relacionados
      const puestosQuery = query(collection(db, 'puestosEstudio'), where('idBiblioteca', '==', bibliotecaIdAEliminar.value));
      const puestosSnapshot = await getDocs(puestosQuery);
      for (const puestoDoc of puestosSnapshot.docs) {
        await deleteDoc(doc(db, 'puestosEstudio', puestoDoc.id));
      }

      // Eliminar salas de grupo relacionadas
      const salasQuery = query(collection(db, 'salasGrupo'), where('idBiblioteca', '==', bibliotecaIdAEliminar.value));
      const salasSnapshot = await getDocs(salasQuery);
      for (const salaDoc of salasSnapshot.docs) {
        await deleteDoc(doc(db, 'salasGrupo', salaDoc.id));
      }
      
      // Eliminar la relación de bibliotecarios con la biblioteca
      const q = query(collection(db, "relUsuarioBiblioteca"), where("idBiblioteca", "==", bibliotecaIdAEliminar.value));
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      // Eliminar biblioteca
      await deleteDoc(doc(db, 'bibliotecas', bibliotecaIdAEliminar.value));

      // Actualizar lista
      await cargarBibliotecas();
      showConfirmDelete.value = false;
    };

    const irHistorialReservas = (idBiblioteca) => {
      router.push(`/historial-reservas-por-biblioteca/${idBiblioteca}`);
    };

    onMounted(cargarBibliotecas);

    return { bibliotecas, router, irAVisualizarBiblioteca, editarBiblioteca, confirmarEliminacion, eliminarBiblioteca, 
      showConfirmDelete, cargando, addOutline, isBibliotecario, irHistorialReservas };
  }
};
</script>

<style scoped>
.button-group {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;
}

ion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

ion-button {
  margin-left: 10px;
}

.boton-verde-oscuro {
  color: #2e7d32; /* Verde oscuro */;
}

.miniatura-biblioteca {
  width: 10%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
}
</style>
