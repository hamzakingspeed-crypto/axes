import { contextBridge, ipcRenderer } from 'electron';

type AxesConfig = {
  name: string;
  mode: string;
  voiceEnabled: boolean;
  riskConfirmationRequired: boolean;
};

contextBridge.exposeInMainWorld('axes', {
  getConfig: async (): Promise<AxesConfig> => {
    return ipcRenderer.invoke('axes:get-config');
  },
});

declare global {
  interface Window {
    axes: {
      getConfig: () => Promise<AxesConfig>;
    };
  }
}
