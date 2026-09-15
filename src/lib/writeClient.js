import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

// Cliente dedicado para ESCRITURAS de entidades (create/update/delete).
//
// El cliente principal (src/api/base44Client.js) usa serverUrl: '' (mismo origen),
// cuya ruta /api resuelve las LECTURAS (GET) de entidades pero devuelve 404 para
// las escrituras (POST/PUT/DELETE). Apuntamos las escrituras al backend real
// (https://base44.app), donde create/update/delete devuelven 200. No tocamos el
// serverUrl global para no alterar las lecturas (que ya funcionan) ni el upload.
export const writeClient = createClient({
  appId: appParams.appId,
  serverUrl: 'https://base44.app',
  requiresAuth: false,
});