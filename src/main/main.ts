import path from 'path';
import fs from 'fs';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  screen,
  dialog,
  // autoUpdater,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import {
  initializeTable,
  saveFileInfoToDB,
  getFileInfoFromDB,
  getProjectsFromDB,
  addProjectToDB,
  deleteProjectToDB,
  checkUserByDB,
  addUserToDB,
} from './Utils/dbUtil';
import { resolveHtmlPath } from './Utils/util';
import { addData, getData, getProjectsFromGS } from './Utils/gsUtil';
// import Store from 'electron-store';
import axios from 'axios';
import { sendChat } from './Utils/chatUtil';
import { setupTitlebar } from 'custom-electron-titlebar/main';

app.setAboutPanelOptions({
  applicationName: 'SBL_Director-s-Trigger', // アプリ名
  applicationVersion: app.getVersion(), // アプリのバージョン
});

let mainWindow: BrowserWindow | null = null;

autoUpdater.autoInstallOnAppQuit = false;

setupTitlebar();

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workAreaSize;

  // ウィンドウの幅と高さ
  const windowWidth = 600;
  const windowHeight = 500;

  // x座標を計算して画面の右端にウィンドウを配置
  const x = screenWidth - windowWidth - 100;
  const y = 100; // ウィンドウを垂直方向で中央に配置

  mainWindow = new BrowserWindow({
    show: false,
    width: windowWidth,
    height: windowHeight,
    x: x,
    y: y,
    resizable: false,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      // devTools: false,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
    frame: false,
  });

  mainWindow.setTitle("[SBL] Director's Trigger");
  mainWindow.setMenuBarVisibility(false);

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }

    if (process.env.NODE_ENV !== 'production') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  // new AppUpdater();
  // attachTitlebarToWindow(mainWindow);
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// アップデートが見つかったとき
autoUpdater.on('update-available', () => {
  // dialog.showMessageBox({
  //   type: 'info',
  //   title: 'Update Available',
  //   message: '最新のバージョンをダウンロードします。',
  // });
});

autoUpdater.on('error', (err) => {
  console.error('Error in auto-updater:', err);
});

// ダウンロード完了後、アップデートのインストール
autoUpdater.on('update-downloaded', () => {
  dialog
    .showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message:
        '最新のバージョンがダウンロードされました。アプリを再起動しますか？',
      buttons: ['今すぐ再起動', '後で'],
    })
    .then((result) => {
      if (result.response === 0) {
        try {
          autoUpdater.quitAndInstall();
        } catch (error) {
          dialog.showMessageBox({
            type: 'info',
            title: 'Update Available',
            message: error as string,
          });
        }
      }
    });
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', async () => {
      if (mainWindow === null) createWindow();
    });

    autoUpdater.checkForUpdatesAndNotify();
  })
  .catch(console.log);

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

//-------------------------------------------------------------------------------------

const check_path = async (filepath: string) => {
  return new Promise((resolve, reject) => {
    fs.access(filepath, fs.constants.F_OK, (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

//-------------------------------------------------------------------------------------

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

async function getFilesInfo(
  folderPaths: string[],
): Promise<Record<string, FileInfo>> {
  const fileInfoPromises = folderPaths.map(async (file: string) => {
    const stats = await fs.promises.stat(file);
    return {
      file,
      info: {
        mtime: stats.mtimeMs,
        size: stats.size,
      },
    };
  });

  const fileInfoArray = await Promise.all(fileInfoPromises);
  const fileInfo: Record<string, FileInfo> = {};
  fileInfoArray.forEach(({ file, info }) => {
    fileInfo[file] = info;
  });

  return fileInfo;
}

const createFileData = async (
  filepath: string,
  dbData: Record<string, FileInfo>,
  tag: string[],
): Promise<FileData[]> => {
  const res: FileData[] = [];

  const _files = fs.readdirSync(filepath);
  const filePaths = _files.map((e) => {
    return path.join(filepath, e);
  });
  const fileInfo: Record<string, FileInfo> = await getFilesInfo(filePaths);

  for (const [filePath, info] of Object.entries(fileInfo)) {
    const fileName = path.basename(filePath);
    if (fileName === '_r' || fileName === '_ok') continue;
    if (dbData[filePath]) {
      const isNew =
        dbData[filePath].mtime !== info.mtime ||
        dbData[filePath].size !== info.size;
      res.push({
        name: fileName,
        path: filePath,
        new: isNew,
        tag: tag,
        info: info,
      });
    } else {
      res.push({
        name: fileName,
        path: filePath,
        new: true,
        tag: tag,
        info: info,
      });
    }
  }

  return res;
};

ipcMain.handle('get-in-folder', async (event, filepath, id) => {
  const bool = await check_path(filepath);
  let res: FileData[] = [];
  if (!bool) {
    return res;
  }

  await initializeTable(id);
  const dbData = await getFileInfoFromDB(id);

  res = res.concat(
    (await createFileData(filepath, dbData, ['nocheck'])) as FileData[],
  );

  if (await check_path(path.join(filepath, '_r')))
    res = res.concat(
      (await createFileData(path.join(filepath, '_r'), dbData, [
        '_r',
      ])) as FileData[],
    );

  if (await check_path(path.join(filepath, '_ok')))
    res = res.concat(
      (await createFileData(path.join(filepath, '_ok'), dbData, [
        '_ok',
      ])) as FileData[],
    );

  return res;
});

//-------------------------------------------------------------------------------------

const filesMap = async (
  project: string,
  e: FileData[],
  res: Record<string, any>[],
) => {
  let message = '';
  await Promise.all(
    e.map(async (f: FileData) => {
      const name = path.parse(f.name).name;
      const parts = name.split('_');
      const numberPart = parts[2].match(/\d+/)?.[0] || '';
      const numberEdit = parseInt(numberPart, 10);
      const letterPart = parts[2].match(/[a-zA-Z]+/)?.[0] || '';
      const id = parts[1] + '_' + numberEdit + letterPart;

      let success = false;
      for (let i = 0; i < res.length; i++) {
        const obj = res[i];

        if (obj['id'] === id) {
          const value =
            f.tag[0] === '_ok'
              ? 'OK'
              : f.tag[0] === '_r'
                ? 'リテイク'
                : '作業中';
          const keys = Object.keys(obj);
          const position = keys.indexOf(parts[4]) + 1;
          const col = String.fromCharCode(64 + position);
          const range = `${col}${i + 2}`;

          if (obj[parts[4]] !== value) {
            const res1 = await addData(project, range, value);
            if (res1.message) {
              success = true;
            }
          } else {
            success = true;
          }

          if (parts[3].startsWith('M')) {
            const takeNum = parts[3].match(/\d+/)?.[0];
            const value2 = 't' + takeNum;
            const position2 = keys.indexOf(parts[4] + '_t') + 1;
            const col2 = String.fromCharCode(64 + position2);
            const range2 = `${col2}${i + 2}`;

            if (obj[parts[4] + '_t'] !== value2) {
              const res2 = await addData(project, range2, value2);
            }
          }
        }
      }

      if (!success && f.new) {
        message += `${f.name}, `;
      }
    }),
  );
  return message;
};

const setGS = async (project: string, files: FileData[]) => {
  try {
    const res: Record<string, any>[] = await getData(project);
    const filesOk = files.filter((f: FileData) => f.tag[0] === '_ok');
    const filesRe = files.filter((f: FileData) => f.tag[0] === '_r');
    const filesNo = files.filter(
      (f: FileData) => f.tag[0] !== '_ok' && f.tag[0] !== '_r',
    );
    const res1 = await filesMap(project, filesNo, res);
    const res2 = await filesMap(project, filesRe, res);
    const res3 = await filesMap(project, filesOk, res);
    const result = res1 + res2 + res3;

    return result;
  } catch (error) {
    console.log(error);
    return '';
  }
};

ipcMain.handle(
  'set-data-db',
  async (
    event,
    f: FileData[],
    receiver: string,
    id: string,
    path: string,
    project: string,
  ) => {
    try {
      const filePaths = f.map((e) => {
        return e.path;
      });
      const fileInfo = await getFilesInfo(filePaths);
      await saveFileInfoToDB(id, fileInfo, path);
      const result = await setGS(project, f);
      return `${result === '' ? '更新完了' : 'データベース上で以下のカットが見つかりませんでした。\n [ ' + result + ' ]'}`;
    } catch (error: any) {
      console.error(error);
      return { error: error.message };
    }
  },
);

//---------------------------------------------------------------------------------------

interface SetupData {
  project: string;
  receiver: string;
  id: string;
}

ipcMain.handle(
  'get-projects',
  async (event, user: string, password: string) => {
    try {
      const res: SetupData[] = await getProjectsFromDB(user, password);
      return res;
    } catch (error: any) {
      console.error(error);
      return { error: error.message };
    }
  },
);

ipcMain.handle(
  'add-projects',
  async (
    event,
    user: string,
    password: string,
    project: string,
    receiver: string,
    logID: string,
  ) => {
    try {
      const res: string = await addProjectToDB(
        user,
        password,
        project,
        receiver,
        logID,
      );
      console.log(user);
      return res;
    } catch (error: any) {
      console.error(error);
      return { error: error.message };
    }
  },
);

ipcMain.handle(
  'delete-projects',
  async (
    event,
    user: string,
    password: string,
    project: string,
    logID: string,
  ) => {
    try {
      await deleteProjectToDB(user, password, project, logID);
      return null;
    } catch (error: any) {
      console.error(error);
      return { error: error.message };
    }
  },
);

ipcMain.handle('get-gs-projects', async (event) => {
  const result = await getProjectsFromGS();
  return result;
});

//--------------------------------------------------------------------------------------

ipcMain.handle('check-user', async (event, user: string, password: string) => {
  try {
    const result = await checkUserByDB(user, password);
    return result;
  } catch (error: any) {
    console.error(error);
    return { error: error.message };
  }
});

ipcMain.handle('add-user', async (event, user: string, password: string) => {
  try {
    const result = await addUserToDB(user, password);
    return result;
  } catch (error: any) {
    console.error(error);
    return { error: error.message };
  }
});

ipcMain.handle(
  'open-directory',
  async (event, user: string, password: string) => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return result.filePaths[0] || null;
  },
);

//------------------------------------------------------------------------------------------

async function fetchDataFromAPI() {
  try {
    const response = await axios.get('http://192.168.11.79:3050/users');
    return response.data;
  } catch (error) {
    console.error('API取得エラー:', error);
    return null;
  }
}

ipcMain.handle('api-data', async (event) => {
  const apiData = await fetchDataFromAPI();
  return apiData;
});

ipcMain.handle('send-chat', async (event, roomID: string, message: string) => {
  const res = await sendChat(roomID, message);
  return res;
});

//--------------------------------------------------------------------------------------

// Reactにバージョン情報を渡すために、IPC通信をセットアップ
ipcMain.handle('getAppVersion', () => {
  return app.getVersion(); // package.jsonのバージョン情報を返す
});

//---------------------------------------------------------------------------------------

// メインプロセスでウィンドウ操作を処理
ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});

ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});
