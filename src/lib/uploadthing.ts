import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();     // UploadButton component -> /app/api/uploadthing/core
export const UploadDropzone = generateUploadDropzone<OurFileRouter>(); // UploadDropzone component

// Se pasa OurFileRouter como argumento de tipo genérico <OurFileRouter>()
// para que los componentes hereden las configuraciones y restricciones de
// subida de archivos definidas en el backend.
// Este tipo (OurFileRouter) define cómo se manejan los archivos en el backend, i
