const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('axes', {
  getConfig: () => ipcRenderer.invoke('axes:get-config'),
});
