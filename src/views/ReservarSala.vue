<template>
  <ion-page>
    <ion-header>
      <ion-toolbar></ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-toolbar>
          <ion-buttons>
            <ion-button @click="router.push(`/seleccionar-reserva/${idBiblioteca}`)">← Volver</ion-button>
          </ion-buttons>
        </ion-toolbar>

        <ion-card-header>
          <ion-card-title>Reservar Sala de Grupo</ion-card-title>
        </ion-card-header>

        <ion-card-content>
          <!-- Fecha -->
          <ion-label>Selecciona una fecha</ion-label>
          <ion-item>
            <ion-datetime
              presentation="date"
              :min="minFecha"
              :max="maxFecha"
              first-day-of-week="1"
              v-model="fechaSeleccionada"
            />
          </ion-item>

          <ion-spinner v-if="cargando" name="crescent"></ion-spinner>
          <p v-if="cargando">Cargando datos...</p>

          <!-- Lista de salas -->
          <ion-list v-if="salasDisponibles.length">
            <ion-card v-for="sala in salasDisponibles" :key="sala.id">
              <ion-card-header>
                <ion-card-title>{{ sala.nombre }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p><strong>Planta:</strong> {{ sala.planta }}</p>
                <p><strong>Capacidad:</strong> {{ sala.capacidad }}</p>
                <p><strong>Enchufe:</strong> {{ sala.enchufe ? '✅' : '❌' }}</p>
                <p><strong>Ethernet:</strong> {{ sala.ethernet ? '✅' : '❌' }}</p>
                <p><strong>Monitor:</strong> {{ sala.monitor ? '✅' : '❌' }}</p>

                <!-- Horas -->
                <ion-label class="ion-margin-top">Hora</ion-label>
                <ion-buttons>
                  <ion-button
                    v-for="hora in sala.horasDisponibles"
                    :key="hora"
                    fill="outline"
                    :color="sala.horaSeleccionada === hora ? 'primary' : 'medium'"
                    @click="sala.horaSeleccionada = hora"
                  >
                    {{ hora }}
                  </ion-button>
                </ion-buttons>

                <!-- Duraciones -->
                <ion-label class="ion-margin-top">Duración</ion-label>
                <ion-buttons>
                  <ion-button
                    v-for="dur in sala.duracionesValidas"
                    :key="dur"
                    fill="outline"
                    :color="sala.duracionSeleccionada == dur ? 'primary' : 'medium'"
                    @click="sala.duracionSeleccionada = dur">
                    {{ formatDuracion(dur) }}
                  </ion-button>
                </ion-buttons>

                <!-- Botón reservar -->
                <ion-button
                  size="small"
                  @click="reservarSala(sala)"
                  :disabled="!sala.horaSeleccionada || !sala.duracionSeleccionada"
                  class="ion-margin-top"
                >
                  Reservar
                </ion-button>
              </ion-card-content>
            </ion-card>
          </ion-list>

          <ion-text v-if="!salasDisponibles.length && !cargando" class="ion-margin-top">
            No hay salas disponibles para la fecha seleccionada.
          </ion-text>
        </ion-card-content>
      </ion-card>

      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        duration="3000"
        color="danger"
        @didDismiss="showToast = false"
      />
      
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage, IonHeader, IonToolbar, IonContent, IonItem, IonLabel, IonDatetime,
  IonButton, IonButtons, IonList, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonText, IonSpinner, IonToast
} from '@ionic/vue';
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default {
  components: {
    IonPage, IonHeader, IonToolbar, IonContent, IonItem, IonLabel, IonDatetime,
    IonButton, IonButtons, IonList, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonText, IonSpinner, IonToast
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const idBiblioteca = route.params.id;
    const cargando = ref(false);

    const fechaSeleccionada = ref(null);
    const horarios = ref([]);
    const salasDisponibles = ref([]);
    const duraciones = [30, 60, 120];

    const minFecha = new Date().toISOString().split('T')[0];
    const maxFecha = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const toastMessage = ref('');
    const showToast = ref(false);

    const cargarHorariosBiblioteca = async () => {
      const docSnap = await getDoc(doc(db, 'bibliotecas', idBiblioteca));
      if (docSnap.exists()) {
        horarios.value = docSnap.data().horarios || [];
      }
    };

    watch(fechaSeleccionada, async () => {
      if (fechaSeleccionada.value) {
        cargando.value = true;
        await cargarSalasDisponibles();
      }
    });

    watch(salasDisponibles, (salas) => {
      salas.forEach(sala => {
        watch(() => sala.horaSeleccionada, (nuevaHora) => {
          const horarioDia = obtenerHorarioDiaSeleccionado(fechaSeleccionada.value);
          if (nuevaHora && horarioDia) {
            sala.duracionesValidas = duraciones.filter(d => duracionValida(nuevaHora, d, horarioDia.horaCierre));
            sala.duracionSeleccionada = null; // reset si se cambia la hora
          }
        });
      });
    });


    const obtenerHorarioDiaSeleccionado = (fecha) => {
      const dia = new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long' });
      return horarios.value?.find(h => h.nombre.toLowerCase() === dia.toLowerCase());
    };

    const horaSeSolapa = (inicio1, duracion1, inicio2, duracion2) => {
      const [h1, m1] = inicio1.split(':').map(Number);
      const [h2, m2] = inicio2.split(':').map(Number);
      const start1 = h1 * 60 + m1;
      const end1 = start1 + parseInt(duracion1);
      const start2 = h2 * 60 + m2;
      const end2 = start2 + parseInt(duracion2);
      return start1 < end2 && start2 < end1;
    };

    const generarHorasDisponibles = (inicio, fin, fecha) => {
      const horas = [];
      let [h, m] = inicio.split(':').map(Number);
      const [hFin, mFin] = fin.split(':').map(Number);
      const ahora = new Date();
      const esHoy = new Date(fecha).toDateString() === ahora.toDateString();

      while (h < hFin || (h === hFin && m < mFin)) {
        const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        const horaActual = new Date();
        horaActual.setHours(h, m, 0, 0);

        if (!esHoy || horaActual > ahora) {
          horas.push(hora);
        }

        m += 30;
        if (m >= 60) {
          h += 1;
          m = 0;
        }
      }
      return horas;
    };

    const normalizarFecha = (fechaISO) => new Date(fechaISO).toISOString().split('T')[0];

    const formatDuracion = (minutos) => {
      if (minutos === 60) return '1 hora';
      if (minutos === 120) return '2 horas';
      return `${minutos} min`;
    };

    const duracionValida = (horaInicio, duracion, horaCierre) => {
      const [h1, m1] = horaInicio.split(':').map(Number);
      const [hCierre, mCierre] = horaCierre.split(':').map(Number);
      const inicioMin = h1 * 60 + m1;
      const finMin = hCierre * 60 + mCierre;

      return inicioMin + duracion <= finMin;
    };

    const cargarSalasDisponibles = async () => {
      const fechaFormateada = normalizarFecha(fechaSeleccionada.value);
      const salasSnapshot = await getDocs(query(
        collection(db, 'salasGrupo'),
        where('idBiblioteca', '==', idBiblioteca)
      ));

      const reservasSnapshot = await getDocs(query(
        collection(db, 'reservasSalaGrupo'),
        where('fecha', '==', fechaFormateada),
        where('idBiblioteca', '==', idBiblioteca)
      ));

      const reservas = reservasSnapshot.docs.map(doc => doc.data());
      const salas = [];

      salasSnapshot.forEach(doc => {
        const data = doc.data();
        const horarioDia = obtenerHorarioDiaSeleccionado(fechaSeleccionada.value);

        if (horarioDia && horarioDia.horaApertura && horarioDia.horaCierre) {
          const horas = generarHorasDisponibles(horarioDia.horaApertura, horarioDia.horaCierre, fechaSeleccionada.value);
          const horasFiltradas = horas.filter(hora => {
            return !reservas.some(r => r.idSala === doc.id && horaSeSolapa(hora, 30, r.horaInicio, r.duracion));
          });

          if (horasFiltradas.length > 0) {
            salas.push({
              id: doc.id,
              ...data,
              horaSeleccionada: null,
              duracionSeleccionada: null,
              horasDisponibles: horasFiltradas,
              duracionesValidas: duraciones
            });
          }
        }
      });

      salasDisponibles.value = salas;
      cargando.value = false;
    };

    const mostrarToast = (mensaje) => {
      toastMessage.value = mensaje;
      showToast.value = true;
    };

    const reservarSala = async (sala) => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        mostrarToast('Debes iniciar sesión para reservar.');
        return;
      }

      const fechaFormateada = normalizarFecha(fechaSeleccionada.value);
      const reservasSnapshot = await getDocs(query(
        collection(db, 'reservasSalaGrupo'),
        where('fecha', '==', fechaFormateada),
        where('idSala', '==', sala.id)
      ));

      const hayConflicto = reservasSnapshot.docs.some(doc => {
        const r = doc.data();
        return horaSeSolapa(sala.horaSeleccionada, sala.duracionSeleccionada, r.horaInicio, r.duracion);
      });

      if (hayConflicto) {
        mostrarToast('Este horario ya ha sido reservado. Elige otra hora.');
        return;
      }

      const reserva = {
        idSala: sala.id,
        fecha: fechaFormateada,
        horaInicio: sala.horaSeleccionada,
        duracion: sala.duracionSeleccionada,
        idBiblioteca: idBiblioteca,
        idUsuario: user.uid,
        creadaEn: new Date()
      };

      const docRef = await addDoc(collection(db, 'reservasSalaGrupo'), reserva);
      const docSnap = await getDoc(doc(db, 'bibliotecas', idBiblioteca));
      
      // Crear notificacion
      const mensaje = `Has reservado en ${docSnap.data().nombre} la sala de grupo "${sala.nombre}" el ${formatearFecha(reserva.fecha)} ${reserva.horaInicio} con duración ${formatDuracion(reserva.duracion)}.`;
      await addDoc(collection(db, 'notificaciones'), {
        idUsuario: user.uid,
        mensaje,
        fecha: new Date(),
        leida: false,
      });

      router.push({ name: 'ConfirmacionReservaSala', params: { idReserva: docRef.id } });
    };

    const formatearFecha = (fecha) => {
      if (!fecha) return '';
      const date = new Date(fecha);
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
      
    };

    onMounted(() => {
      cargarHorariosBiblioteca();
    });

    return {
      fechaSeleccionada, minFecha, maxFecha, salasDisponibles, reservarSala, duraciones, 
      cargando, router, idBiblioteca, formatDuracion, showToast, toastMessage
    };
  }
};
</script>

<style scoped>
ion-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
</style>
