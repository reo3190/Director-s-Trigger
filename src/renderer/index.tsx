import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { datactx, useData } from '../hook/UpdateContext';

const AppProvider = () => {
  const dctx = useData();
  return (
    <datactx.Provider value={dctx}>
      <App />
    </datactx.Provider>
  );
};

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
console.log(container);
root.render(
  <HashRouter>
    <AppProvider />
  </HashRouter>,
);

// calling IPC exposed from preload script
window.electron.ipcRenderer.once('ipc-example', (arg) => {
  // eslint-disable-next-line no-console
  console.log(arg);
});
window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
