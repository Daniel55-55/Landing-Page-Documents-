# WHF Portal — Guía de Despliegue en Vercel

## Estructura del proyecto
```
whf-portal/
├── api/
│   └── upload.js        ← Backend proxy (API Key aquí, nunca en el browser)
├── public/
│   └── index.html       ← Landing page (frontend)
├── .env.example         ← Plantilla de variables de entorno
├── .gitignore
├── package.json
└── vercel.json
```

---

## PASO 1 — Crear cuenta en GitHub
1. Ve a https://github.com
2. Clic en **Sign Up**
3. Crea tu cuenta (gratis)

---

## PASO 2 — Subir el proyecto a GitHub
1. Ve a https://github.com/new
2. **Repository name:** `whf-portal`
3. Visibilidad: **Private** (importante — tiene la API key)
4. Clic **Create repository**
5. En la siguiente pantalla, clic en **uploading an existing file**
6. Arrastra TODA la carpeta `whf-portal` o sube los archivos uno por uno
7. Clic **Commit changes**

---

## PASO 3 — Crear cuenta en Vercel
1. Ve a https://vercel.com
2. Clic **Sign Up**
3. Selecciona **Continue with GitHub** (usa la misma cuenta)
4. Autoriza Vercel

---

## PASO 4 — Importar el proyecto en Vercel
1. En Vercel dashboard, clic **Add New → Project**
2. Busca `whf-portal` en la lista de repositorios
3. Clic **Import**
4. En la pantalla de configuración:
   - **Framework Preset:** Other
   - **Root Directory:** `./` (dejar como está)
5. **NO hagas Deploy todavía** — primero el Paso 5

---

## PASO 5 — Agregar la API Key (MUY IMPORTANTE)
1. En la pantalla de configuración, busca **Environment Variables**
2. Agrega:
   - **Name:** `DIGIFI_API_KEY`
   - **Value:** `dgfk_live_d7c95e1f54f1033935f37b4a7b155914`
3. Clic **Add**
4. Ahora sí clic **Deploy**

---

## PASO 6 — Verificar que funciona
1. Vercel te dará una URL como: `https://whf-portal-xxx.vercel.app`
2. Abre esa URL
3. Prueba con Application #107181 — WHF Financing
4. Sube 1 archivo de prueba
5. Clic Enviar — revisa el log negro para ver la respuesta de DiGiFi

---

## Si necesitas actualizar el portal
1. Edita los archivos localmente
2. Ve a GitHub → tu repo → el archivo a cambiar
3. Clic el ícono de lápiz ✏️ para editar
4. Haz los cambios → clic **Commit changes**
5. Vercel detecta el cambio y re-deploya automáticamente en ~30 segundos

---

## Módulos configurados
| Módulo | Product ID |
|--------|-----------|
| Oriental Solar Loans | 68c2aed92495668a3f248835 |
| Para Uso Interno WHF | 69148fa4b34911f902270af3 |
| Roofing Loan | 680b4e14d6ebf6166397f1eb |
| WHF Financing | 6878ad6fe74373a1dc87fc4e |

---

## Soporte
Si el log muestra un error, los más comunes son:
- **401** → API Key incorrecta en Vercel Environment Variables
- **404** → URL de DiGiFi incorrecta (confirmar con admin JM)
- **422** → El applicationId necesita el UUID interno, no el display ID
