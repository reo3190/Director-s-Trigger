import { createContext, useCallback, useState, useContext } from 'react';

interface UserData {
  user: string;
  password: string;
}

interface DataContext {
  userInfo: UserData | null;
  setUserInfo: (u: UserData | null) => void;
  path: string;
  setPath: (s: string) => void;
  receiver: any[];
  setReceiver: (r: any[]) => void;
  dbSheets: string[];
  setDbSheets: (d: string[]) => void;
}

const defaultUserData: UserData = JSON.parse(
  localStorage.getItem('userData') as string,
);

const defaultContext: DataContext = {
  userInfo: defaultUserData || null,
  setUserInfo: () => {},
  path: '',
  setPath: () => {},
  receiver: [],
  setReceiver: () => {},
  dbSheets: [],
  setDbSheets: () => {},
};

// context object
export const datactx = createContext<DataContext>(defaultContext);

// custom Hook
export const useData = (): DataContext => {
  const [userInfo, _setUserInfo] = useState(defaultContext.userInfo);
  const [path, _setPath] = useState(defaultContext.path);
  const [receiver, _setReceiver] = useState(defaultContext.receiver);
  const [dbSheets, _setDbSheets] = useState(defaultContext.receiver);
  const setUserInfo = useCallback((u: UserData | null): void => {
    _setUserInfo(u);
  }, []);
  const setPath = useCallback((s: string): void => {
    _setPath(s);
  }, []);
  const setReceiver = useCallback((r: any[]): void => {
    _setReceiver(r);
  }, []);
  const setDbSheets = useCallback((d: string[]): void => {
    _setDbSheets(d);
  }, []);
  return {
    userInfo,
    setUserInfo,
    path,
    setPath,
    receiver,
    setReceiver,
    dbSheets,
    setDbSheets,
  };
};

export const useDataContext = () => useContext(datactx);
