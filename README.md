# 🎬 CineLog — Proyecto de Películas

Aplicación web de películas construida con **HTML + CSS + JS puro** (sin frameworks),
servidor **Node.js nativo** y base de datos en **archivo TXT**.

---

## Estructura del proyecto

```
movies-project/
│
├── server.js          ← Servidor HTTP Node.js (sin frameworks)
├── database.txt       ← Base de datos en texto plano (separado por |)
├── README.md
│
└── client/
    ├── styles.css     ← Estilos compartidos
    ├── index.html     ← CASO 1: hipertextos + una imagen
    ├── catalogo.html  ← CASO 2: hipertextos + múltiples imágenes
    ├── agregar.html   ← CASO 3: archivo único (formulario POST)
    └── database.html  ← CASO 4: múltiples archivos (TXT + JSON)
```

---

## Cómo correr el proyecto

### 1. Requisitos
- Node.js instalado (cualquier versión ≥ 14)

### 2. Iniciar el servidor

```bash
cd movies-project
node server.js
```

### 3. Abrir el cliente

Abre en tu navegador: **http://localhost:3000**

---

## API del servidor

| Método | Endpoint       | Descripción                        |
|--------|----------------|------------------------------------|
| GET    | /api/movies    | Retorna todas las películas (JSON) |
| GET    | /api/movies/:id| Retorna una película por ID        |
| POST   | /api/movies    | Agrega una nueva película al TXT   |
| GET    | /api/db        | Retorna el TXT crudo               |
| GET    | /*             | Sirve archivos estáticos del cliente|

### Ejemplo POST

```bash
curl -X POST http://localhost:3000/api/movies \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Matrix",
    "year": "1999",
    "genre": "Sci-Fi",
    "director": "Lana Wachowski",
    "rating": "8.7",
    "description": "Un hacker descubre que la realidad es una simulación.",
    "poster": "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    "duration": "136",
    "cast": "Keanu Reeves, Carrie-Anne Moss, Laurence Fishburne"
  }'
```

---

## Formato de database.txt

```
id|title|year|genre|director|rating|description|poster|duration|cast
1|Inception|2010|Sci-Fi|Christopher Nolan|8.8|...|url|148|...
```

Cada línea es una película, campos separados por `|`.

---

## Páginas y sus casos

| Página          | Caso   | Descripción                                      |
|-----------------|--------|--------------------------------------------------|
| index.html      | Caso 1 | Hipertextos de navegación + **una imagen**       |
| catalogo.html   | Caso 2 | Grid de películas con **múltiples imágenes**     |
| agregar.html    | Caso 3 | Archivo único — formulario POST al servidor      |
| database.html   | Caso 4 | **Múltiples recursos**: HTML + CSS + JSON + TXT  |
