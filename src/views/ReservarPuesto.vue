<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-toolbar>
          <ion-buttons>
            <ion-button @click="router.push(`/seleccionar-reserva/${idBiblioteca}`)">← Volver</ion-button>
          </ion-buttons>
        </ion-toolbar>

        <ion-card-header>
          <ion-card-title>Reservar Puesto de Estudio</ion-card-title>
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
          <!-- Filtros - visibles solo si se ha elegido una fecha -->
          <div v-if="fechaSeleccionada && horasGeneradas.length">
            <ion-item>
              <ion-label>Enchufe</ion-label>
              <ion-checkbox v-model="filtroEnchufe" />
            </ion-item>
            <ion-item>
              <ion-label>Ethernet</ion-label>
              <ion-checkbox v-model="filtroEthernet" />
            </ion-item>
            <ion-item>
              <ion-label>Monitor</ion-label>
              <ion-checkbox v-model="filtroMonitor" />
            </ion-item>

            <!-- Selector de hora -->
            <ion-item>
              <ion-label>Hora</ion-label>
              <ion-select v-model="horaSeleccionada">
                <ion-select-option
                  v-for="hora in horasGeneradas"
                  :key="hora"
                  :value="hora"
                >
                  {{ hora }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <!-- Selector de duración -->
            <ion-item>
              <ion-label>Duración</ion-label>
              <ion-select v-model="duracionSeleccionada">
                <ion-select-option
                  v-for="dur in duraciones"
                  :key="dur"
                  :value="dur"
                >
                  {{ formatDuracion(dur) }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <!-- Botón buscar -->
            <div class="button-group">
              <ion-button
                class="ion-margin-top"
                :disabled="!horaSeleccionada"
                @click="buscarPuestos">
                Buscar puestos
              </ion-button>
            </div>
          </div>


          <!-- Spinner de carga -->
          <ion-spinner v-if="cargando" name="crescent"></ion-spinner>
          <p v-if="cargando">Cargando datos...</p>

          <!-- Lista de puestos disponibles -->
          <ion-list v-if="puestosDisponibles.length">
            <ion-card v-for="puesto in puestosDisponibles" :key="puesto.id">
              <ion-card-header>
                <ion-card-title>{{ puesto.nombre }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p><strong>Planta:</strong> {{ puesto.planta }}</p>
                <p><strong>Descripción:</strong> {{ puesto.descripcion }}</p>
                <p><strong>Enchufe:</strong> {{ puesto.enchufe ? '✅' : '❌' }}</p>
                <p><strong>Ethernet:</strong> {{ puesto.ethernet ? '✅' : '❌' }}</p>
                <p><strong>Monitor:</strong> {{ puesto.monitor ? '✅' : '❌' }}</p>

                <!-- Horas disponibles como botones -->
                <ion-label class="ion-margin-top">Hora</ion-label>
                <ion-buttons>
                  <ion-button
                    v-for="hora in puesto.horasDisponibles"
                    :key="hora"
                    fill="outline"
                    :color="puesto.horaSeleccionada === hora ? 'primary' : 'medium'"
                    @click="puesto.horaSeleccionada = hora"
                  >
                    {{ hora }}
                  </ion-button>
                </ion-buttons>

                <!-- Duraciones como botones -->
                <ion-label class="ion-margin-top">Duración</ion-label>
                <ion-buttons>
                  <ion-button
                    v-for="dur in duraciones"
                    :key="dur"
                    fill="outline"
                    :color="puesto.duracionSeleccionada == dur ? 'primary' : 'medium'"
                    @click="puesto.duracionSeleccionada = dur"
                  >
                    {{ formatDuracion(dur) }}
                  </ion-button>
                </ion-buttons>

                <!-- Botón reservar -->
                <ion-button
                  size="small" 
                  @click="reservarPuesto(puesto)"
                  :disabled="!puesto.horaSeleccionada || !puesto.duracionSeleccionada"
                  class="ion-margin-top"
                >
                  Reservar
                </ion-button>
              </ion-card-content>
            </ion-card>
          </ion-list>

          <ion-text v-if="mensajeSinPuestos && !cargando" class="ion-margin-top">
            No hay puestos disponibles para la fecha seleccionada.
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
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
  IonDatetime, IonButton, IonButtons, IonList, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonCheckbox, IonText, IonSpinner, IonToast,
  IonSelect, IonSelectOption
} from '@ionic/vue';
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default {
  components: {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
    IonDatetime, IonButton, IonButtons, IonList, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonCheckbox, IonText, IonSpinner, IonToast,
    IonSelect, IonSelectOption
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const idBiblioteca = route.params.id;
    const cargando = ref(false);
    const mensajeSinPuestos = ref(false);

    const fechaSeleccionada = ref(null);
    const horarios = ref([]);
    const puestosDisponibles = ref([]);
    const duraciones = [30, 60, 120]; // minutos
    const duracionesDisponibles = ref([...duraciones]);


    const minFecha = new Date().toISOString().split('T')[0];
    const maxFecha = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const filtroEnchufe = ref(false);
    const filtroEthernet = ref(false);
    const filtroMonitor = ref(false);

    const horaSeleccionada = ref(null);
    const duracionSeleccionada = ref(30); // valor por defecto

    const horasGeneradas = ref([]); 

    const toastMessage = ref('');
    const showToast = ref(false);

    const cargarHorariosBiblioteca = async () => {
      const docSnap = await getDoc(doc(db, 'bibliotecas', idBiblioteca));
      if (docSnap.exists()) {
        horarios.value = docSnap.data().horarios || [];
      }
    };

    watch(fechaSeleccionada, async (nuevaFecha) => {
      if (nuevaFecha) {
        mensajeSinPuestos.value = false;
        const horarioDia = obtenerHorarioDiaSeleccionado(nuevaFecha);
        if (horarioDia && horarioDia.horaApertura && horarioDia.horaCierre) {
          horasGeneradas.value = generarHorasDisponibles(
            horarioDia.horaApertura,
            horarioDia.horaCierre,
            nuevaFecha
          );

          if (horasGeneradas.value.length > 0)
            mensajeSinPuestos.value = false;
          else
            mensajeSinPuestos.value = true;

        } else {
          mensajeSinPuestos.value = true;
          horasGeneradas.value = [];
        }

      }
    });

    watch([horaSeleccionada, fechaSeleccionada], () => {
      if (horaSeleccionada.value && fechaSeleccionada.value) {
        const horarioDia = obtenerHorarioDiaSeleccionado(fechaSeleccionada.value);
        if (horarioDia?.horaCierre) {
          duracionesDisponibles.value = filtrarDuracionesDisponibles(
            horaSeleccionada.value,
            horarioDia.horaCierre
          );
        }
      }
    });

    const filtrarDuracionesDisponibles = (horaInicio, horaCierre) => {
      const [hInicio, mInicio] = horaInicio.split(':').map(Number);
      const [hCierre, mCierre] = horaCierre.split(':').map(Number);

      const minutosInicio = hInicio * 60 + mInicio;
      const minutosCierre = hCierre * 60 + mCierre;

      return duraciones.filter(duracion => minutosInicio + duracion <= minutosCierre);
    };


    const buscarPuestos = async () => {
      cargando.value = true;
      const fechaFormateada = normalizarFecha(fechaSeleccionada.value);
      const reservasSnapshot = await getDocs(query(
        collection(db, 'reservasPuestoEstudio'),
        where('fecha', '==', fechaFormateada),
        where('idBiblioteca', '==', idBiblioteca)
      ));

      const reservas = reservasSnapshot.docs.map(doc => doc.data());
      const puestosSnapshot = await getDocs(query(collection(db, 'puestosEstudio'), where('idBiblioteca', '==', idBiblioteca)));

      const puestos = [];

      puestosSnapshot.forEach(doc => {
        const data = doc.data();

        // Filtro por checkboxes
        if (
          (filtroEnchufe.value && !data.enchufe) ||
          (filtroEthernet.value && !data.ethernet) ||
          (filtroMonitor.value && !data.monitor)
        ) {
          return;
        }

        // Verifica si está disponible a la hora deseada
        const hayConflicto = reservas.some(r =>
          r.idPuesto === doc.id &&
          horaSeSolapa(horaSeleccionada.value, duracionSeleccionada.value, r.horaInicio, r.duracion)
        );

        if (!hayConflicto) {
          puestos.push({
            id: doc.id,
            ...data,
            horaSeleccionada: horaSeleccionada.value,
            duracionSeleccionada: duracionSeleccionada.value,
            horasDisponibles: [horaSeleccionada.value]
          });
        }
      });

      if (puestos.length > 0)
        mensajeSinPuestos.value = false;
      else
        mensajeSinPuestos.value = true;

      puestosDisponibles.value = puestos;
      cargando.value = false;
    };


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

        // Si es hoy, descartar horas pasadas
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


    const normalizarFecha = (fechaISO) => {
      const fecha = new Date(fechaISO);
      return fecha.toISOString().split('T')[0]; // yyyy-mm-dd
    };    

    const formatDuracion = (minutos) => {
      if (minutos === 60) return '1 hora';
      if (minutos === 120) return '2 horas';
      return `${minutos} min`;
    };

    const mostrarToast = (mensaje) => {
      toastMessage.value = mensaje;
      showToast.value = true;
    };


    const reservarPuesto = async (puesto) => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
          mostrarToast('Debes iniciar sesión para reservar.');
          return;
      }

      // Validar que la hora seleccionada no se solape con reservas existentes
      const fechaFormateada = normalizarFecha(fechaSeleccionada.value);
      const reservasSnapshot = await getDocs(query(
          collection(db, 'reservasPuestoEstudio'),
          where('fecha', '==', fechaFormateada),
          where('idPuesto', '==', puesto.id)
      ));

      const hayConflicto = reservasSnapshot.docs.some(doc => {
          const r = doc.data();
          return horaSeSolapa(puesto.horaSeleccionada, puesto.duracionSeleccionada, r.horaInicio, r.duracion);
      });

      if (hayConflicto) {
          mostrarToast('Este horario ya ha sido reservado. Elige otra hora.');
          return;
      }
      
      const reserva = {
          idPuesto: puesto.id,
          fecha: fechaFormateada,
          horaInicio: puesto.horaSeleccionada,
          duracion: puesto.duracionSeleccionada,
          idBiblioteca: idBiblioteca,
          idUsuario: user.uid,
          creadaEn: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'reservasPuestoEstudio'), reserva);

      const docSnap = await getDoc(doc(db, 'bibliotecas', idBiblioteca));
      
      // Crear notificacion
      const mensaje = `Has reservado en ${docSnap.data().nombre} el puesto de estudio "${puesto.nombre}" el ${formatearFecha(reserva.fecha)} ${reserva.horaInicio} con duración ${formatDuracion(reserva.duracion)}.`;
      await addDoc(collection(db, 'notificaciones'), {
        idUsuario: user.uid,
        mensaje,
        fecha: new Date(),
        leida: false,
      });


      router.push({name: 'ConfirmacionReservaPuesto', params: { idReserva: docRef.id } });

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
      fechaSeleccionada, minFecha, maxFecha, puestosDisponibles, reservarPuesto, duraciones, cargando,
      router, idBiblioteca, formatDuracion, showToast, toastMessage, horaSeleccionada, duracionSeleccionada,
      buscarPuestos, filtroEnchufe, filtroEthernet, filtroMonitor, horasGeneradas, mensajeSinPuestos,
      duraciones: duracionesDisponibles
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

.spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}

.button-group {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 15px;
}
</style>
