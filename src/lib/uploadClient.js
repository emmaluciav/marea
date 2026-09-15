import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

// Cliente dedicado SOLO para subidas (UploadFile).
//
// El cliente principal (src/api/base44Client.js) usa serverUrl: '' (mismo origen),
// cuya ruta /api resuelve /entities pero NO /integration-endpoints (devuelve 404).
// Apuntamos las subidas al backend real (https://base44.app), donde UploadFile
// devuelve 200 con { file_url }. No tocamos el serverUrl global para no alterar
// entidades ni el sistema de acceso.
export const uploadClient = createClient({
  appId: appParams.appId,
  serverUrl: 'https://base44.app',
  requiresAuth: false,
});