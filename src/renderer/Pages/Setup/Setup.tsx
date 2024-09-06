import { useState, useEffect, FC } from 'react';
import { useDataContext } from '../../../hook/UpdateContext';

import { TbReload } from 'react-icons/tb';
import { IoClose } from 'react-icons/io5';

interface Props {
  user: string;
  password: string;
  setShowSetup: React.Dispatch<React.SetStateAction<boolean>>;
  fetchData: () => Promise<void>;
}

const Setup: FC<Props> = ({ user, password, setShowSetup, fetchData }) => {
  const [project, setProject] = useState<string>('');
  const [roomInfo, setRoomInfo] = useState(JSON.stringify([0, '通知なし', '']));
  const [message, setMessage] = useState('');

  const { receiver, setReceiver, dbSheets, setDbSheets } = useDataContext();

  const handleAdd = async () => {
    if (project === '') {
      setMessage('プロジェクトが選択されていません。');
      return;
    }
    const id =
      'id' +
      new Date().getTime().toString(16) +
      Math.floor(1000 * Math.random()).toString(16);
    const result = await window.electron.addProject(
      user,
      password,
      project,
      roomInfo,
      id,
    );
    console.log(result);
    await fetchData();
    setShowSetup(false);
  };

  useEffect(() => {
    if (receiver.length === 0) {
      fetchAPI();
    }

    if (dbSheets.length === 0) {
      fetchDBsheets();
    }
  }, []);

  const fetchAPI = async () => {
    try {
      const res = await window.electron.receiveAPIData();
      const group = res.filter(
        (e: any) => e.type === 'group' || e.type === 'my',
      );
      setReceiver(group);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchDBsheets = async () => {
    try {
      const res = await window.electron.getProjectsGS();
      console.log(res);
      setDbSheets(res);
    } catch (error) {
      console.log(error);
    }
  };

  const handleReload = async () => {
    await fetchAPI();
    await fetchDBsheets();
  };

  return (
    <>
      <div className="setup-wrapper">
        <div className="setup-outer">
          <button className="setup-close" onClick={() => setShowSetup(false)}>
            <IoClose size={'2rem'} />
          </button>
          <div className="setup-message">{message}</div>
          <div className="setup-input">
            <div className="setup-popup-label">プロジェクト</div>
            <select
              name="project"
              id="project"
              className="setup-project"
              onChange={(e) => {
                setProject(e.target.value);
              }}
            >
              <option value={''}>プロジェクトを選択</option>
              {dbSheets.map((e, i) => (
                <option key={e + i} value={e}>
                  {e}
                </option>
              ))}
            </select>

            <div className="setup-popup-label">通知先</div>
            <select
              name="receiver"
              id="receiver"
              className="setup-receiver"
              onChange={(e) => {
                setRoomInfo(e.target.value);
                console.log(JSON.parse(e.target.value));
              }}
            >
              <option value={JSON.stringify([0, '通知なし', ''])}>
                通知なし
              </option>
              {receiver.map((e, i) => (
                <option
                  key={i}
                  value={JSON.stringify([e.room_id, e.name, e.icon_path])}
                >
                  {e.name}
                </option>
              ))}
            </select>
            <div className="setup-reload">
              <button onClick={() => handleReload()}>
                <TbReload size={'2rem'} />
              </button>
            </div>
          </div>
          <div className="setup-message"></div>

          <button className="setup-add button-blue" onClick={handleAdd}>
            追加
          </button>
        </div>
        <div className="setup-back"></div>
      </div>
    </>
  );
};

export default Setup;
