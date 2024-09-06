import { useState, useEffect, FC, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from './Login';
import Setup from '../Setup/Setup';
import { useDataContext } from '../../../hook/UpdateContext';

import { FaTrashAlt, FaUserAlt } from 'react-icons/fa';

interface UserData {
  user: string;
  password: string;
}

interface SetupData {
  project: string;
  receiver: string;
  id: string;
}

const Home: FC = () => {
  const { userInfo, setUserInfo } = useDataContext();

  const [list, setList] = useState<SetupData[]>([]);

  const [userDataInput, setUserDataInput] = useState<UserData>({
    user: '',
    password: '',
  });

  const [showSetup, setShowSetup] = useState(false);
  const [showSetting, setShowSetting] = useState(false);

  const [version, setVersion] = useState('');

  const headButtonRef = useRef<HTMLButtonElement>(null);
  const headMenuRef = useRef<HTMLDivElement>(null);

  const listInit = async (e: UserData) => {
    const items: SetupData[] = await window.electron.getProjects(
      e.user,
      e.password,
    );
    return items;
  };

  const fetchData = async () => {
    if (!userInfo) return;
    const _list = await listInit(userInfo);
    setList(_list);
  };

  useEffect(() => {
    fetchData();
  }, [userInfo]);

  useEffect(() => {
    const bu = headButtonRef.current;
    const el = headMenuRef.current;
    if (!el || !bu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!el.contains(e.target as Node) && !bu.contains(e.target as Node)) {
        setShowSetting(false);
      }
    };
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [headMenuRef.current, headButtonRef.current]);

  useEffect(() => {
    const getVersion = async () => {
      const version = await window.electron.getVersion();
      setVersion(version);
    };
    getVersion();
  }, []);

  const handleDelete = async (
    index: number,
    project: string,
    logID: string,
  ) => {
    if (!userInfo) return;
    const updatedList = [...list];
    updatedList.splice(index, 1);
    await window.electron.deleteProject(
      userInfo.user,
      userInfo.password,
      project,
      logID,
    );
    setList(updatedList);
  };

  const navigate = useNavigate();
  const handleSelect = (e: SetupData) => {
    const data = {
      user: userInfo?.user,
      password: userInfo?.password,
      project: e.project,
      receiver: e.receiver,
      id: e.id,
    };
    navigate('/form', { state: data });
  };

  const handleBackLogin = () => {
    setUserDataInput({ user: '', password: '' });
    setUserInfo(null);
  };

  return (
    <>
      {!userInfo ? (
        <Login
          setUserInfo={setUserInfo}
          userDataInput={userDataInput}
          setUserDataInput={setUserDataInput}
        />
      ) : (
        <>
          {showSetup && (
            <>
              <Setup
                user={userInfo.user}
                password={userInfo.password}
                setShowSetup={setShowSetup}
                fetchData={fetchData}
              />
            </>
          )}
          <div className="project-wrapper">
            <div className="headder">
              <button
                ref={headButtonRef}
                className="head-setting "
                onClick={() => setShowSetting((pre) => !pre)}
              >
                <FaUserAlt size={'2rem'} />
              </button>

              <div
                className={`head-setting-menu ${showSetting && 'show'}`}
                ref={headMenuRef}
              >
                <div className="head-setting-name">{userInfo.user}</div>
                <div className="head-setting-back">
                  <button onClick={handleBackLogin}>
                    別アカウントでログイン
                  </button>
                </div>
                <div className="head-setting-verison">v{version}</div>
              </div>
            </div>
            <div className="project-list">
              {list.map((e: SetupData, i) => {
                return (
                  <div className="project-outer" key={i}>
                    <div
                      className="project-inner pointer"
                      onClick={() => handleSelect(e)}
                    >
                      <div className="project-accent"></div>
                      <div className="project-name">{e.project}</div>
                      <div className="project-receiver">
                        {JSON.parse(e.receiver)[0] !== 0 ? (
                          <img
                            className="icon"
                            src={JSON.parse(e.receiver)[2]}
                          />
                        ) : (
                          ''
                        )}
                        <div>{JSON.parse(e.receiver)[1]}</div>
                      </div>
                    </div>
                    <button
                      className="project-delete"
                      onClick={() => handleDelete(i, e.project, e.id)}
                    >
                      <FaTrashAlt size={'1.5rem'} />
                    </button>
                  </div>
                );
              })}
              <button
                className="project-add button-blue"
                onClick={() => setShowSetup(true)}
              >
                + プロジェクトを追加
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Home;
