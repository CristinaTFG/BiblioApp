# 📚 BiblioApp
**BiblioApp** es una aplicación web desarrollada con **Vue.js** e **Ionic Framework**, conectada a **Firebase**, que permite la gestión completa de bibliotecas y reservas de espacios de estudio.

Ofrece funcionalidades tanto para usuarios generales como para administradores y bibliotecarios, incluyendo:
- Gestión de bibliotecas, puestos de estudio y salas de grupo
- Reservas de espacios por parte de usuarios
- Administración de bibliotecarios y usuarios
- Visualización de historiales de reserva
- Autenticación y control de acceso con Firebase Auth

La app está pensada para facilitar la organización de recursos en bibliotecas universitarias u otros espacios colaborativos.

## 🚀 Instalación
### 1️⃣ Clonar el repositorio
```sh
git clone git@github.com:CristinaTFG/BiblioApp.git
cd BiblioApp
```

### 3️⃣ Instalar Ionic CLI, Firebase y Leaflet
Install the Ionic CLI, Firebase y Leaflet with npm:
```sh
npm install -g @ionic/cli
npm install firebase
npm install leaflet
```

### 2️⃣ Instalar dependencias
```sh
npm install
```

### 4️⃣ Ejecutar el proyecto en desarrollo
```sh
ionic serve
```

## 📁 Estructura del Proyecto
```
📂 src/
 ├── 📂 views/              # Vistas  
 ├── 📂 router/             # Configuración de Vue Router
 ├── 📂 firebase.js         # Configuración de Firebase
 ├── 📂 assets/             # Imágenes y recursos
```

## 🛠️ Tecnologías Utilizadas
- **Ionic Vue 6** - Framework UI
- **Vue 3** - Framework JS
- **Firebase Authentication** - Login/Registro
- **Firestore** - Base de datos en la nube
- **Vue Router** - Navegación
- **Leaflet** - Libreria interactiva de mapas
  
---
