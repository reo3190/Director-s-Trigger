import { useState, useEffect, FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import FileList from './FileList';
import Popup from './Popup';

import { TiArrowBack } from 'react-icons/ti';

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

const Form: FC = () => {
  const location = useLocation();
  const data = location.state as {
    user: string;
    password: string;
    project: string;
    receiver: string;
    id: string;
  };

  const [path, setPath] = useState<string>('');
  const [files, setFiles] = useState<FileData[]>([]);
  const [pathListString, setPathListString] = useState('');

  const [popup, setPopup] = useState(false);

  const [message, setMessage] = useState('');

  const [systemLog, setSystemLog] = useState('');

  const [isSendFile, setIsSendFile] = useState<boolean[]>(
    files.map((pre) => pre.new && pre.tag[0] === '_r'),
  );

  const [lastLoad, setLastLoad] = useState(0);
  const [minutesAgo, setMinutesAgo] = useState(0);
  const updateTimeInterval = 1;

  const [updating, setUpdating] = useState(false);

  const handleGetFiles = async (p: string) => {
    const result = await window.electron.getInFolder(p, data.id);

    const _files: FileData[] = [];
    result.forEach((e: FileData, i: number) => {
      _files.push(e);
    });

    setFiles(_files);
    setSystemLog('');

    const currentDate = new Date();
    setLastLoad(currentDate.getTime());
  };

  const handleShowDialog = async () => {
    const dialogRes = await window.electron.openFolderDialog();
    if (!dialogRes) return;
    setPath(dialogRes);
    handleGetFiles(dialogRes);
  };

  const handleUpdateDB = async () => {
    try {
      if (files.length === 0 || path === '') {
        setSystemLog("Can't Update.");
        return;
      }

      setUpdating(true);
      const result = await window.electron.setDataToDB(
        files,
        data.receiver,
        data.id,
        path,
        data.project,
      );
      console.log(result);
      await handleGetFiles(path);
      if (!result.error) setSystemLog(result);
      setUpdating(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const sendFileList_ok = files.filter(
      (e: FileData, i: number) => isSendFile[i] && e.tag[0] === '_ok',
    );
    const sendFileList_re = files.filter(
      (e: FileData, i: number) => isSendFile[i] && e.tag[0] === '_r',
    );
    const sendFileNameList_ok = sendFileList_ok.map((e) => e.name);
    const sendFileNameList_re = sendFileList_re.map((e) => e.name);
    let _pathListString = `${path !== '' && sendFileNameList_ok.length > 0 ? '■' + path + '\\_ok\n' : ''}`;
    sendFileNameList_ok.map((e) => {
      _pathListString += `・ ${e}\n`;
    });
    _pathListString += '\n';
    _pathListString += `${path !== '' && sendFileNameList_re.length > 0 ? '■' + path + '\\_r\n' : ''}`;
    sendFileNameList_re.map((e) => {
      _pathListString += `・ ${e}\n`;
    });

    setPathListString(_pathListString);
    setMessage(_pathListString);
  }, [isSendFile]);

  useEffect(() => {
    let _isSendFile: boolean[] = [];
    files.map((e) => {
      if (e.new && (e.tag[0] === '_r' || e.tag[0] === '_ok')) {
        _isSendFile.push(true);
      } else {
        _isSendFile.push(false);
      }
      setIsSendFile(_isSendFile);
    });
  }, [files]);

  useEffect(() => {
    const updateTime = () => {
      if (lastLoad !== 0) {
        const now = new Date();
        const diff = Math.floor(
          (now.getTime() - lastLoad) / (updateTimeInterval * 60000),
        );
        setMinutesAgo(diff);
      }
    };

    const interval = setInterval(() => {
      updateTime();
    }, updateTimeInterval * 60000);

    updateTime();

    return () => clearInterval(interval);
  }, [lastLoad]);

  const sliceText = (str: string, length: number): string => {
    let count = 0;
    let result = '';

    for (const char of str) {
      // 全角文字の場合は2カウント、それ以外は1カウント
      count += char.match(/[^\x00-\x7F]/) ? 1.8 : 1;

      if (count > length) {
        result += '...';
        break;
      }

      result += char;
    }

    return result;
  };

  const getLastUpdate = () => {
    if (minutesAgo < 1) {
      return `latest`;
    } else if (minutesAgo < 60) {
      return `${minutesAgo}m ago`;
    } else if (minutesAgo < 3600) {
      return `${Math.floor(minutesAgo / 60)}h ago`;
    } else {
      return `${Math.floor(minutesAgo / 3600)}d ago`;
    }
  };

  return (
    <>
      {popup && (
        <Popup
          setPopup={setPopup}
          message={message}
          setMessage={setMessage}
          handleUpdateDB={handleUpdateDB}
        />
      )}
      <div className="headder">
        <div className="head-back">
          <Link to="/">
            <TiArrowBack size={'2rem'} />
          </Link>
        </div>
        <div className="head-form">
          <div className="head-project">{data.project}</div>
          <div className="head-receiver">
            {JSON.parse(data.receiver)[0] !== 0 ? (
              <img className="icon" src={JSON.parse(data.receiver)[2]} />
            ) : (
              ''
            )}
            {JSON.parse(data.receiver)[1]}
          </div>
        </div>
      </div>
      <div className="form-input">
        <div>
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="ファイルパス"
          />
        </div>
        <button className="button-blue" onClick={() => handleShowDialog()}>
          選択
        </button>
        <button className="button-blue" onClick={() => handleGetFiles(path)}>
          更新
        </button>
        <div> {getLastUpdate()}</div>
      </div>
      <div className="form-count">
        ファイル数&nbsp;{files.length}
        &nbsp;&nbsp;/&nbsp;&nbsp;新規ファイル数&nbsp;
        {files.filter((e) => e.new).length}
      </div>
      <div className="form-select">
        <FileList
          files={files}
          setFiles={setFiles}
          isSendFile={isSendFile}
          setIsSendFile={setIsSendFile}
        />
      </div>
      <div className="form-bottom-button">
        <div className="form-systemlog">{sliceText(systemLog, 184)}</div>
        <button
          className="form-update button-blue"
          onClick={() => handleUpdateDB()}
        >
          {updating ? (
            <>
              更新中<div className="loader"></div>
            </>
          ) : (
            '香盤表の更新のみ'
          )}
        </button>
        <button
          className="form-decision button-blue"
          onClick={() => setPopup(true)}
          disabled={JSON.parse(data.receiver)[0] === 0}
        >
          通知
        </button>
      </div>
    </>
  );
};

export default Form;
