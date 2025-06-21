<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-buttons>
        <ion-button @click="router.push('/app/gestion-bibliotecas')">← Volver</ion-button>
      </ion-buttons>
      <h2>Historial de Reservas de {{ nombreBiblioteca }}</h2>
      <ion-searchbar
        v-model="busqueda"
        placeholder="Buscar en reservas..."
        debounce="300">
      </ion-searchbar>
      <ion-spinner v-if="cargando" name="crescent"></ion-spinner>

      <div v-else>
        <div v-if="reservasFiltradas.length > 0">
          <ion-card v-for="(reserva, index) in reservasFiltradas" :key="index">
            <ion-card-header>
              <ion-card-title>
                {{ reserva.tipo === 'puesto' ? 'Reserva de Puesto' : 'Reserva de Sala' }}
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p><strong>Usuario:</strong> {{ reserva.usuarioNombre }} {{ reserva.usuarioApellidos }}</p>
              <p><strong>{{ reserva.tipo === 'puesto' ? 'Puesto' : 'Sala' }}:</strong> {{ reserva.nombre }}</p>
              <p><strong>Planta:</strong> {{ reserva.planta }}</p>
              <p v-if="reserva.capacidad"><strong>Capacidad:</strong> {{ reserva.capacidad }}</p>
              <p><strong>Fecha:</strong> {{ formatFecha(reserva.fecha) }}</p>
              <p><strong>Hora:</strong> {{ reserva.horaInicio }}</p>
              <p><strong>Duración:</strong> {{ formatDuracion(reserva.duracion) }}</p>
              <p v-if="reserva.estado === 'cancelada'" style="color: red;"><strong>Estado:</strong> Cancelada</p>

              <ion-button v-if="reserva.estado !== 'cancelada'" size="small" fill="clear" color="danger" @click="confirmarCancelacion(reserva)" title="Cancelar reserva">❌</ion-button>
            </ion-card-content>
          </ion-card>
        </div>
        <div v-else>
          <p>No se encontraron reservas.</p>
        </div>
      </div>

      <ion-alert
        :is-open="mostrarAlerta"
        header="Cancelar reserva"
        message="¿Estás seguro de que deseas cancelar esta reserva?"
        :buttons="[
          { text: 'No', role: 'cancel', handler: () => mostrarAlerta = false },
          { text: 'Sí', role: 'confirm', handler: cancelarReservaConfirmada  }
        ]"
        @didDismiss="mostrarAlerta = false"
      ></ion-alert>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonButtons, IonBackButton,
  IonSpinner, IonSearchbar, IonButton, IonAlert
} from '@ionic/vue';

import { defineComponent, ref, onMounted, watch } from 'vue';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, query, where, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { useRoute, useRouter } from 'vue-router';

export default defineComponent({
  name: 'HistorialReservasPorBiblioteca',
  components: {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonButtons, IonBackButton,
    IonSpinner, IonSearchbar, IonButton, IonAlert
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    
    const idBiblioteca = route.params.idBiblioteca;

    const reservas = ref([]);
    const reservasFiltradas = ref([]);
    const cargando = ref(true);
    const busqueda = ref('');
    const nombreBiblioteca = ref('');

    const reservaSeleccionada = ref(null);
    const mostrarAlerta = ref(false);

    const formatFecha = (fechaStr) => {
      if (!fechaStr) return '';
      const [año, mes, dia] = fechaStr.split('-');
      return `${dia}-${mes}-${año}`;
    };

    const cargarNombreBiblioteca = async () => {
      const biblioDoc = await getDoc(doc(db, 'bibliotecas', idBiblioteca));
      if (biblioDoc.exists()) {
        nombreBiblioteca.value = biblioDoc.data().nombre || '';
      }
    };

    const cargarReservas = async () => {
      const todas = [];

      // Puestos
      const qPuestos = query(collection(db, 'reservasPuestoEstudio'), where('idBiblioteca', '==', idBiblioteca));
      const resPuestos = await getDocs(qPuestos);
      for (const docRes of resPuestos.docs) {
        const data = docRes.data();
        const puestoDoc = await getDoc(doc(db, 'puestosEstudio', data.idPuesto));
        const usuarioDoc = await getDoc(doc(db, 'usuarios', data.idUsuario));

        todas.push({
          id: docRes.id,
          tipo: 'puesto',
          nombre: puestoDoc.data()?.nombre || 'Desconocido',
          planta: puestoDoc.data()?.planta || 'N/A',
          bibliotecaNombre: nombreBiblioteca.value,
          usuarioNombre: usuarioDoc.data()?.nombre || 'Usuario',
          usuarioApellidos: usuarioDoc.data()?.apellidos || '',
          idUsuario: data.idUsuario,
          fecha: data.fecha,
          horaInicio: data.horaInicio,
          duracion: data.duracion
        });
      }

      // Salas
      const qSalas = query(collection(db, 'reservasSalaGrupo'), where('idBiblioteca', '==', idBiblioteca));
      const resSalas = await getDocs(qSalas);
      for (const docRes of resSalas.docs) {
        const data = docRes.data();
        const salaDoc = await getDoc(doc(db, 'salasGrupo', data.idSala));
        const usuarioDoc = await getDoc(doc(db, 'usuarios', data.idUsuario));

        todas.push({
          id: docRes.id,
          tipo: 'sala',
          nombre: salaDoc.data()?.nombre || 'Desconocida',
          planta: salaDoc.data()?.planta || 'N/A',
          capacidad: salaDoc.data()?.capacidad || null,
          bibliotecaNombre: nombreBiblioteca.value,
          usuarioNombre: usuarioDoc.data()?.nombre || 'Usuario',
          usuarioApellidos: usuarioDoc.data()?.apellidos || '',
          idUsuario: data.idUsuario,
          fecha: data.fecha,
          horaInicio: data.horaInicio,
          duracion: data.duracion
        });
      }

      reservas.value = todas.sort((a, b) => b.fecha.localeCompare(a.fecha));
      reservasFiltradas.value = reservas.value;
      cargando.value = false;
    };

    const filtrarReservas = () => {
      const texto = busqueda.value.toLowerCase();
      reservasFiltradas.value = reservas.value.filter((r) =>
        Object.values(r).some((val) =>
          String(val).toLowerCase().includes(texto)
        )
      );
    };

    watch(busqueda, filtrarReservas);

    const confirmarCancelacion = (reserva) => {
      reservaSeleccionada.value = reserva;
      mostrarAlerta.value = true;
    };

    
    const formatDuracion = (minutos) => {
      if (minutos === 60) return '1 hora';
      if (minutos === 120) return '2 horas';
      return `${minutos} min`;
    };

    const cancelarReservaConfirmada = async () => {
      const docSnap = await getDoc(doc(db, 'bibliotecas', idBiblioteca));

      const reserva = reservaSeleccionada.value;
      if (!reserva) return;

      const coleccion = reserva.tipo === 'puesto' ? 'reservasPuestoEstudio' : 'reservasSalaGrupo';

      // 1. Cancelar la reserva
      const docRef = doc(db, coleccion, reserva.id);
      await updateDoc(docRef, { estado: 'cancelada' });

      // 2. Crear notificación de cancelación
      const mensaje = `Tu ${reserva.tipo === 'puesto' ? 'reserva de puesto de estudio' : 'reserva de sala de grupo'} "${reserva.nombre}" en ${docSnap.data().nombre} para el día ${formatFecha(reserva.fecha)} a las ${reserva.horaInicio} ha sido cancelada.`;
      const idUsuario = reservaSeleccionada.value.idUsuario;

      await addDoc(collection(db, 'notificaciones'), {
        idUsuario,
        mensaje,
        leida: false,
        fecha: new Date()
      });

      // 3. Actualizar la UI local
      reserva.estado = 'cancelada';
      filtrarReservas();
      mostrarAlerta.value = false;
    };

    onMounted(async () => {
      await cargarNombreBiblioteca();
      await cargarReservas();
    });

    return {
      reservasFiltradas, cargando, busqueda, formatFecha, confirmarCancelacion, mostrarAlerta, 
      filtrarReservas, nombreBiblioteca, router, formatDuracion, cancelarReservaConfirmada
    };
  }
});
</script>

<style scoped>
ion-card-title {
  font-size: 1.2rem;
  color: #2c3e50;
}
</style>
