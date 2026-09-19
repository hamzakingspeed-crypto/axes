import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('axes', {
  getConfig: () => ipcRenderer.invoke('axes:get-config'),
});
