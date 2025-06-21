<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/app"></ion-back-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <h2>Historial de Reservas</h2>
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
              <p><strong>Biblioteca:</strong> {{ reserva.bibliotecaNombre }}</p>
              <p><strong>{{ reserva.tipo === 'puesto' ? 'Puesto' : 'Sala' }}:</strong> {{ reserva.nombre }}</p>
              <p><strong>Planta:</strong> {{ reserva.planta }}</p>
              <p v-if="reserva.capacidad"><strong>Capacidad:</strong> {{ reserva.capacidad }}</p>
              <p><strong>Fecha:</strong> {{ formatFecha(reserva.fecha) }}</p>
              <p><strong>Hora:</strong> {{ reserva.horaInicio }}</p>
              <p><strong>Duración:</strong> {{ formatDuracion(reserva.duracion) }}</p>
              <p v-if="reserva.estado === 'cancelada'" style="color: red;"><strong>Estado:</strong> Cancelada</p>

              <ion-button size="small" fill="clear" color="primary" @click="irAVerBiblioteca(reserva.idBiblioteca)" title="Ver biblioteca">📚</ion-button>
              <ion-button size="small" fill="clear" color="danger" @click="confirmarEliminacion(reserva)" title="Eliminar">🗑️</ion-button>
            </ion-card-content>
          </ion-card>
        </div>
        <div v-else>
          <p>No se encontraron reservas.</p>
        </div>
      </div>

      <ion-alert
        :is-open="mostrarAlerta"
        header="Eliminar reserva"
        message="¿Estás seguro de que deseas eliminar esta reserva?"
        :buttons="[
          { text: 'Cancelar', role: 'cancel', handler: () => mostrarAlerta = false },
          { text: 'Eliminar', role: 'confirm', handler: eliminarReservaConfirmada }
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
import { useRouter } from 'vue-router';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, query, where, deleteDoc, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default defineComponent({
  name: 'HistorialReservas',
  components: {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonButtons, IonBackButton,
    IonSpinner, IonSearchbar, IonButton, IonAlert
  },
  setup() {
    const router = useRouter();
    const auth = getAuth();
    const user = auth.currentUser;
    const reservas = ref([]);
    const reservasFiltradas = ref([]);
    const cargando = ref(true);
    const busqueda = ref('');

    const reservaSeleccionada = ref(null);
    const mostrarAlerta = ref(false);

    const formatFecha = (fechaStr) => {
      if (!fechaStr) return '';
      const [año, mes, dia] = fechaStr.split('-');
      return `${dia}-${mes}-${año}`;
    };

    const cargarReservas = async () => {
      if (!user) return;

      const uid = user.uid;
      const todas = [];

      // Puestos
      const qPuestos = query(collection(db, 'reservasPuestoEstudio'), where('idUsuario', '==', uid));
      const resPuestos = await getDocs(qPuestos);
      for (const docRes of resPuestos.docs) {
        const data = docRes.data();
        const puestoDoc = await getDoc(doc(db, 'puestosEstudio', data.idPuesto));
        const bibliotecaDoc = await getDoc(doc(db, 'bibliotecas', data.idBiblioteca));

        todas.push({
          id: docRes.id,
          tipo: 'puesto',
          nombre: puestoDoc.data()?.nombre || 'Desconocido',
          planta: puestoDoc.data()?.planta || 'N/A',
          bibliotecaNombre: bibliotecaDoc.data()?.nombre || 'Desconocida',
          idBiblioteca: data.idBiblioteca,
          fecha: data.fecha,
          horaInicio: data.horaInicio,
          duracion: data.duracion,
          estado: data.estado
        });
      }

      // Salas
      const qSalas = query(collection(db, 'reservasSalaGrupo'), where('idUsuario', '==', uid));
      const resSalas = await getDocs(qSalas);
      for (const docRes of resSalas.docs) {
        const data = docRes.data();
        const salaDoc = await getDoc(doc(db, 'salasGrupo', data.idSala));
        const bibliotecaDoc = await getDoc(doc(db, 'bibliotecas', data.idBiblioteca));

        todas.push({
          id: docRes.id,
          tipo: 'sala',
          nombre: salaDoc.data()?.nombre || 'Desconocida',
          planta: salaDoc.data()?.planta || 'N/A',
          capacidad: salaDoc.data()?.capacidad || null,
          bibliotecaNombre: bibliotecaDoc.data()?.nombre || 'Desconocida',
          idBiblioteca: data.idBiblioteca,
          fecha: data.fecha,
          horaInicio: data.horaInicio,
          duracion: data.duracion,
          estado: data.estado
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

    const confirmarEliminacion = (reserva) => {
      reservaSeleccionada.value = reserva;
      mostrarAlerta.value = true;
    };

    const eliminarReservaConfirmada = async () => {
      const reserva = reservaSeleccionada.value;
      if (!reserva) return;

      const coleccion = reserva.tipo === 'puesto' ? 'reservasPuestoEstudio' : 'reservasSalaGrupo';
      await deleteDoc(doc(db, coleccion, reserva.id));

      const docSnap = await getDoc(doc(db, 'bibliotecas', reserva.idBiblioteca));
      // Crear notificacion
      const mensaje = `Tu ${reserva.tipo === 'puesto' ? 'reserva de puesto de estudio' : 'reserva de sala de grupo'} "${reserva.nombre}" en ${docSnap.data().nombre} para el día ${formatFecha(reserva.fecha)} a las ${reserva.horaInicio} ha sido eliminado.`;
      await addDoc(collection(db, 'notificaciones'), {
        idUsuario: user.uid,
        mensaje,
        fecha: new Date(),
        leida: false,
      });

      // Actualizar localmente
      reservas.value = reservas.value.filter(r => r.id !== reserva.id);
      filtrarReservas();
      mostrarAlerta.value = false;
    };

    const formatDuracion = (minutos) => {
      if (minutos === 60) return '1 hora';
      if (minutos === 120) return '2 horas';
      return `${minutos} min`;
    };

    const irAVerBiblioteca = (idBiblioteca) => {
      router.push(`/ver-biblioteca-reservas/${idBiblioteca}`);
    };

    onMounted(() => {
      cargarReservas();
    });

    return {
      reservasFiltradas,
      cargando,
      busqueda,
      formatFecha,
      confirmarEliminacion,
      mostrarAlerta,
      filtrarReservas,
      eliminarReservaConfirmada,
      formatDuracion,
      irAVerBiblioteca
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
