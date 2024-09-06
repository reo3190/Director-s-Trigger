import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

interface FileData {
  name: string;
  path: string;
  new: boolean;
  tag: string[];
  info: FileInfo;
}

interface FileInfo {
  mtime: number;
  size: number;
}

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  getInFolder: async (path: string, id: string) => {
    try {
      const response = await ipcRenderer.invoke('get-in-folder', path, id);
      return response;
    } catch (error: any) {
      return { error: error.message };
    }
  },
  setDataToDB: async (
    files: FileData[],
    receiver: string,
    id: string,
    path: string,
    project: string,
  ) => {
    const response = await ipcRenderer.invoke(
      'set-data-db',
      files,
      receiver,
      id,
      path,
      project,
    );
    return response;
  },

  getProjects: async (user: string, password: string) => {
    const response = await ipcRenderer.invoke('get-projects', user, password);
    return response;
  },

  addProject: async (
    user: string,
    password: string,
    project: string,
    receiver: string,
    logID: string,
  ) => {
    const response = await ipcRenderer.invoke(
      'add-projects',
      user,
      password,
      project,
      receiver,
      logID,
    );
    return response;
  },

  deleteProject: async (
    user: string,
    password: string,
    project: string,
    logID: string,
  ) => {
    const response = await ipcRenderer.invoke(
      'delete-projects',
      user,
      password,
      project,
      logID,
    );
    return response;
  },

  checkUser: async (user: string, password: string) => {
    const response = await ipcRenderer.invoke('check-user', user, password);
    return response;
  },

  addUser: async (user: string, password: string) => {
    const response = await ipcRenderer.invoke('add-user', user, password);
    return response;
  },

  openFolderDialog: async () => {
    const response = await ipcRenderer.invoke('open-directory');
    return response;
  },

  getChatworkUsers: async () => {
    const response = await ipcRenderer.invoke('get-users');
    return response;
  },

  receiveAPIData: async () => {
    const response = await ipcRenderer.invoke('api-data');
    return response;
  },

  sendChat: async (roomID: string, message: string) => {
    const response = await ipcRenderer.invoke('send-chat', roomID, message);
    return response;
  },

  getProjectsGS: async () => {
    const response = await ipcRenderer.invoke('get-gs-projects');
    return response;
  },

  minimize: async () => {
    ipcRenderer.send('window-minimize');
  },

  maximize: async () => {
    ipcRenderer.send('window-maximize');
  },

  close: async () => {
    ipcRenderer.send('window-close');
  },

  getVersion: async () => {
    const response = await ipcRenderer.invoke('getAppVersion');
    return response;
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
