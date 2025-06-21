<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Datos de la Biblioteca</ion-card-title>
        </ion-card-header>

        <ion-card-content class="formulario-contenedor">

          <ion-item class="form-item">
            <ion-label position="floating">Nombre</ion-label>
            <ion-input v-model="nombre" required class="margen-top"></ion-input>
          </ion-item>
          <p v-if="errores.nombre" class="error-text">{{ errores.nombre }}</p>

          <ion-item class="form-item">
            <ion-label position="floating">Dirección</ion-label>
            <ion-input
              v-model="direccion"
              :clear-input="true"
              placeholder="Buscar dirección..."
              class="margen-top"
            ></ion-input>
          </ion-item>
          <p v-if="errores.direccion" class="error-text">{{ errores.direccion }}</p>

          <ion-list v-if="sugerencias.length" class="sugerencias-lista">
            <ion-item
              v-for="(sugerencia, index) in sugerencias"
              :key="index"
              button
              @click="seleccionarSugerencia(sugerencia)"
            >
              {{ sugerencia.display_name }}
            </ion-item>
          </ion-list>

          <!-- Horarios -->
          <ion-card-title style="margin-left: 15px;" class="margen-top">Horario</ion-card-title>
          <ion-list class="horarios-lista">
            <ion-item v-for="(dia, index) in diasSemana" :key="index" class="form-item">
              <div class="horario-contenedor">
                <span class="nombre-dia">{{ dia.nombre }}</span>
                <div class="grupo-horarios">
                  <div class="campo-hora">
                    <label class="etiqueta-hora">Hora de apertura</label>
                    <ion-input type="time" v-model="dia.horaApertura" />
                  </div>
                  <div class="campo-hora">
                    <label class="etiqueta-hora">Hora de cierre</label>
                    <ion-input type="time" v-model="dia.horaCierre" />
                  </div>
                </div>
              </div>
            </ion-item>
          </ion-list>
          <p v-if="errores.horarios" class="error-text">{{ errores.horarios }}</p>

          <!-- Subir imágenes -->
          <ion-item class="form-item">
            <ion-label position="stacked">Imágenes de la Biblioteca (máx 4)</ion-label>
            <input type="file" accept="image/*" multiple @change="manejarArchivos">
          </ion-item>
          <p v-if="errores.imagenesBase64" class="error-text">{{ errores.imagenesBase64 }}</p>

          <div v-if="imagenesBase64.length" class="imagen-preview">
            <div v-for="(imagen, index) in imagenesBase64" :key="index" class="preview-container">
              <img :src="imagen.startsWith('data:image') ? imagen : imagen" alt="Vista previa" />
            </div>
          </div>

          <!-- Botones -->
          <div class="button-group">
            <ion-button size="small" color="primary" @click="guardarBiblioteca">
              {{ editando ? 'Actualizar' : 'Guardar' }}
            </ion-button>
            <ion-button size="small" color="danger" @click="router.push('/app/gestion-bibliotecas')">Cancelar</ion-button>
          </div>

        </ion-card-content>
      </ion-card>

      <!-- Toast -->
      <ion-toast
        :is-open="mostrarError"
        :message="mensajeError"
        :duration="2000"
        color="danger"
        @didDismiss="mostrarError = false"
      ></ion-toast>
      
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonButton, IonButtons, IonList, IonModal, IonTextarea, IonCheckbox, IonToast,
  IonListHeader
} from '@ionic/vue';

import { ref, onMounted, watch } from 'vue';
import { db } from '../firebase';
import { collection, doc, getDoc, updateDoc, addDoc} from 'firebase/firestore';
import { useRouter, useRoute } from 'vue-router';

export default {
  components: { 
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonInput, IonButton, IonButtons, IonList, IonModal, IonTextarea, IonCheckbox, IonToast,
    IonListHeader
  },

  setup() {
    const nombre = ref('');
    const diasSemana = ref([
      { nombre: 'Lunes', horaApertura: '', horaCierre: '' },
      { nombre: 'Martes', horaApertura: '', horaCierre: '' },
      { nombre: 'Miércoles', horaApertura: '', horaCierre: '' },
      { nombre: 'Jueves', horaApertura: '', horaCierre: '' },
      { nombre: 'Viernes', horaApertura: '', horaCierre: '' },
      { nombre: 'Sábado', horaApertura: '', horaCierre: '' },
      { nombre: 'Domingo', horaApertura: '', horaCierre: '' },
    ]);
    const direccion = ref('');
    const sugerencias = ref([]);
    const coordenadas = ref({ lat: null, lon: null });
    let temporizadorBusqueda = null;
    const imagenesBase64 = ref([]);// Guardar hasta 4 imágenes
    const errores = ref({ nombre: '', horarios: '', direccion: '', imagenesBase64: '' });
    const mostrarError = ref(false);
    const mensajeError = ref('');
    const route = useRoute();
    const router = useRouter();
    
    const editando = ref(false);
    const bibliotecaId = ref(null);


    // Manejar archivos seleccionados
  const manejarArchivos = (event) => {
    const archivos = event.target.files;
    if (!archivos || archivos.length === 0) return;

    imagenesBase64.value = []; // Limpiar imágenes previas
    const maxImagenes = 4;
    const archivosSeleccionados = Array.from(archivos).slice(0, maxImagenes);

    archivosSeleccionados.forEach((archivo) => {
      comprimirImagen(archivo, 800, 600).then((imagenComprimida) => {
        imagenesBase64.value.push(imagenComprimida);
      });
    });
  };

  // Comprimir imagen antes de convertirla a base64
  const comprimirImagen = (file, maxWidth, maxHeight) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Redimensionar manteniendo la proporción
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir la imagen comprimida a base64
          resolve(canvas.toDataURL("image/jpeg", 0.7)); // Calidad 70%
        };
      };
    });
  };

  
  watch(direccion, (nuevoValor) => {
    sugerencias.value = [];

    if (temporizadorBusqueda) clearTimeout(temporizadorBusqueda);

    if (!nuevoValor || nuevoValor.length < 3) return;

    temporizadorBusqueda = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(nuevoValor)}&addressdetails=1&limit=5`;
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'TuAplicacion/1.0 (tuemail@dominio.com)',
            'Referer': 'http://localhost'
          }
        });
        if (!response.ok) throw new Error(`Error en la solicitud: ${response.status}`);
        const data = await response.json();
        sugerencias.value = data;
      } catch (error) {
        console.error('Error al buscar dirección:', error);
      }
    }, 400);
  });

  function seleccionarSugerencia(sugerencia) {
    direccion.value = sugerencia.display_name;
    coordenadas.value = {
      lat: sugerencia.lat,
      lon: sugerencia.lon
    };
    sugerencias.value = [];
  }

  const validarFormulario = () => {
    errores.value = {};

    if (!nombre.value.trim()) {
      errores.value.nombre = 'El nombre es obligatorio';
    }
    const diasValidos = diasSemana.value.filter(d => d.horaApertura && d.horaCierre);

    if (!diasValidos.length) {
      errores.value.horarios = 'Debe establecer al menos un horario válido en la semana';
    } else {
      const erroresHorarios = diasValidos.some(d => d.horaApertura >= d.horaCierre);
      if (erroresHorarios) {
        errores.value.horarios = 'La hora de apertura debe ser menor que la hora de cierre en todos los días válidos';
      }
    }
    if (!direccion.value.trim()) {
      errores.value.direccion = 'La direccion es obligatoria';
    } 
    if (imagenesBase64.value.length === 0) {
      errores.value.imagenesBase64 = 'Debe adjuntar al menos 1 imagen';
    }

    return Object.keys(errores.value).length === 0;
  };

  // Guardar o actualizar la biblioteca junto con sus puestos y salas
    const guardarBiblioteca = async () => {
      errores.value = {};

      if (!validarFormulario()) {
        mensajeError.value = 'Por favor, corrige los errores antes de continuar';
        mostrarError.value = true;
        return;
      }

      try {
        if (bibliotecaId.value) {
          // Editar biblioteca
          const bibliotecaRef = doc(db, "bibliotecas", bibliotecaId.value);
          await updateDoc(bibliotecaRef, {
            nombre: nombre.value,
            horarios: diasSemana.value,
            direccion: direccion.value,
            coordenadas: coordenadas.value,
            imagenes: imagenesBase64.value
          });
          
          router.push({ name: 'VisualizarBiblioteca', query: { idBiblioteca: bibliotecaRef.id } });


        } else {
          // Crear nueva biblioteca
          const bibliotecaRef = await addDoc(collection(db, "bibliotecas"), {
            nombre: nombre.value,
            horarios: diasSemana.value,
            direccion: direccion.value,
            coordenadas: coordenadas.value,
            imagenes: imagenesBase64.value
          });

          const nuevaBibliotecaId = bibliotecaRef.id;
          router.push({ name: 'VisualizarBiblioteca', query: { idBiblioteca: nuevaBibliotecaId } });
        }

      } catch (error) {
        console.error("Error guardando la biblioteca:", error.message);
        mensajeError.value = 'Error: ' + error.message;
        mostrarError.value = true;
      }
    };

     onMounted(async () => {
      if (route.query.id) {
        editando.value = true;
        bibliotecaId.value = route.query.id;
        await cargarDatosBiblioteca(route.query.id);
      }
      
    });

    const cargarDatosBiblioteca = async (id) => {
      try {
        const docRef = doc(db, 'bibliotecas', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          nombre.value = data.nombre;
          diasSemana.value = data.horarios || diasSemana.value;
          direccion.value = data.direccion;
          coordenadas.value = data.coordenadas;
          imagenesBase64.value = data.imagenes || [];
        }

      } catch (error) {
        console.error("Error al cargar los datos de la biblioteca:", error);
      }
    };

    return { 
      nombre, diasSemana, direccion, sugerencias, coordenadas, temporizadorBusqueda, imagenesBase64, manejarArchivos,
      seleccionarSugerencia, guardarBiblioteca, router, errores, mostrarError, mensajeError
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
ion-card {
margin-top: 20px;
}


/* Vista previa de imágenes */
.imagen-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
  justify-content: center;
}

.preview-container {
max-width: 300px;
}

.preview-container img {
width: 100%;
height: auto;
border-radius: 8px;
box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.1);
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 15px;
}

.margen-top{
margin-top: 10px;
}

.horarios-lista {
  width: 100%;
  max-width: 400px;
  margin-top: 10px;
}

.horario-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  padding: 0;
  align-items: flex-start;
}

.horario-contenedor {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

.nombre-dia {
  margin-bottom: 8px;
  font-size: 16px;
}

.grupo-horarios {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  width: 100%;
}

.campo-hora {
  display: flex;
  flex-direction: column;
  width: 150px;
}

.etiqueta-hora {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.sugerencias-lista {
  max-width: 400px;
  border: 1px solid #ccc;
  border-radius: 6px;
  margin-top: -10px;
  z-index: 10;
  background: white;
}


</style>
