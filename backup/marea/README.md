# Respaldo del catálogo de Marea

Copia completa y restaurable de las publicaciones actuales de Marea, viviendo dentro del repositorio conectado a GitHub. Incluye **todos los datos** de cada publicación y **las imágenes reales** descargadas, para reconstruir Marea desde cero sin volver a subir fotos ni recrear productos.

> Este respaldo es **solo lectura** y **aditivo**: no reemplaza ni modifica el catálogo vivo de Base44. El catálogo de Marea sigue funcionando exactamente como está.

## ¿Qué incluye?

- **45 productos publicados**, cada uno con: nombre, descripción, precio, categoría, colores y variantes (con `photo_indices`, inventario y disponibilidad por color), inventario general, descuento y rutas de imágenes.
- **2 empaques** publicados, con sus datos completos.
- **158 imágenes** descargadas en su formato original (binarios JPG), organizadas una carpeta por producto/empaque.
- **Categorías** (secciones) del catálogo, con su orden y visibilidad.
- Cada imagen guarda tanto la **URL original** en Base44 como la **ruta local** dentro del repo.

## Estructura de carpetas

```
backup/marea/
├── manifest.json          # Todos los datos estructurados del catálogo
├── README.md              # Este documento
├── scripts/
│   └── regenerate.js      # Script para volver a descargar las imágenes
└── images/
    ├── products/
    │   ├── aretes-media-flor/
    │   │   ├── 01.jpg
    │   │   ├── 02.jpg
    │   │   ├── 03.jpg
    │   │   └── 04.jpg
    │   ├── collar-amalfi/
    │   │   └── ...
    │   └── ...             # 45 carpetas, una por producto
    └── packaging/
        ├── empaque-caja-casual/
        │   └── 01..05.jpg
        └── empaque-caja-de-regalo/
            └── 01..05.jpg
```

## Formato de `manifest.json`

```jsonc
{
  "generated_at": "2026-09-15T02:37:35Z",
  "app": { "name": "Marea", "source_app_id": "...", "platform": "Base44" },
  "counts": { "products": 45, "packagings": 2, "images": 158 },
  "categories": [ { "key": "...", "label": "...", "order": 0, "visible": true } ],
  "products": [
    {
      "id": "...", "name": "Aretes Media Flor", "description": "...", "price": 230,
      "category": "large_earrings", "availability": "available", "inventory": 0,
      "discount_percent": null, "discount_color_id": null,
      "colors": [
        { "id": "...", "name": "Dorado", "hex": "#C9A24B", "photo_indices": [0,1],
          "availability": "available", "inventory": 0 }
      ],
      "images": [
        { "url": "https://base44.app/api/apps/.../files/mp/public/.../foto.jpg",
          "local_path": "images/products/aretes-media-flor/01.jpg" }
      ]
    }
  ],
  "packagings": [ /* mismo patrón, sin colors */ ]
}
```

## Cómo restaurar Marea desde este respaldo

Si alguna vez necesitas reconstruir Marea en un app Base44 nuevo:

1. **Crea un app nuevo** en Base44 (o usa uno limpio) con las entidades `Product`, `Packaging` y `Category` con los mismos campos que el manifest.
2. **Restaura las categorías**: crea un registro `Category` por cada entrada de `manifest.categories`.
3. **Sube las imágenes**: usa el cargador de archivos de Base44 (o `UploadPublicFile`) para subir cada archivo local de `backup/marea/images/...` y obtener la nueva URL pública.
   - Mapea cada imagen a su producto/empaque siguiendo `local_path` y el índice de orden (01, 02, 03...).
4. **Crea los productos**: por cada entrada de `manifest.products`, crea un `Product` con sus campos, el array `images` llenado con las **nuevas** URLs del paso 3 (en el mismo orden), y `colors` con sus `photo_indices` apuntando a las posiciones correctas del nuevo array de imágenes.
5. **Crea los empaques**: igual con `manifest.packagings`.
6. Verifica inventario, descuentos y visibilidad — quedan registrados en el manifest.

> Los `id` originales no se reutilizan: al recrear, Base44 genera IDs nuevos. Lo importante es conservar el **orden** de las imágenes y los `photo_indices` de cada color.

## Cómo actualizar este respaldo

El respaldo es una **foto estática** del catálogo al momento de generarse. Para refrescarlo con el estado actual:

- **Datos + imágenes completos**: pide a tu asistente de Base44 "regenera el respaldo de Marea". Se vuelve a leer el catálogo vivo, se reescribe `manifest.json` y se vuelven a descargar las imágenes.
- **Solo re-descargar imágenes** (sin tocar datos): si ya tienes el repo clonado localmente, ejecuta:

  ```bash
  node backup/marea/scripts/regenerate.js
  ```

  Esto lee `manifest.json` y vuelve a descargar cada imagen desde su URL original a su `local_path`. Útil para asegurar que los binarios estén presentes y actualizados.

## Notas

- Las imágenes viven en almacenamiento **del propio app** de Base44 (`base44.app/api/.../files/...`), no en un CDN externo permanente. Por eso se guardan los binarios reales aquí: si el app original desaparece, las fotos siguen en este repo.
- Total aprox. del respaldo: ~69 MB en imágenes + 80 KB de manifest.
- Generado el 2026-09-15 a partir del catálogo publicado en ese momento.
