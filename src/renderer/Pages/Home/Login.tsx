import { useState, FC, Dispatch } from 'react';
import Register from './Register';

interface UserData {
  user: string;
  password: string;
}

interface Props {
  setUserInfo: (u: UserData | null) => void;
  userDataInput: UserData;
  setUserDataInput: Dispatch<React.SetStateAction<UserData>>;
}

const Login: FC<Props> = ({ setUserInfo, userDataInput, setUserDataInput }) => {
  const [register, setRegister] = useState<boolean>(false);
  const [message, setMessage] =
    useState<string>('ユーザー情報を入力してください。');

  const handleLogin = async () => {
    const result = await window.electron.checkUser(
      userDataInput.user,
      userDataInput.password,
    );
    if (!result) {
      setMessage('ユーザーが見つかりませんでした。');
      return;
    }
    const loginInfo: UserData = {
      user: userDataInput.user,
      password: userDataInput.password,
    };
    localStorage.setItem('userData', JSON.stringify(loginInfo));
    setUserInfo(loginInfo);
  };

  return (
    <>
      {register ? (
        <Register setRegister={setRegister} />
      ) : (
        <>
          <div className="login-wrapper">
            <div className="login-outer">
              <div>{message}</div>
              <div className="login-input">
                <input
                  type="text"
                  value={userDataInput.user}
                  onChange={(e) =>
                    setUserDataInput((prev) => ({
                      ...prev, // Spread the previous state
                      user: e.target.value, // Update the user field
                    }))
                  }
                  placeholder="name"
                />
                <input
                  type="password"
                  value={userDataInput.password}
                  onChange={(e) =>
                    setUserDataInput((prev) => ({
                      ...prev, // Spread the previous state
                      password: e.target.value, // Update the user field
                    }))
                  }
                  placeholder="password"
                />
              </div>

              <button
                className="login-button pointer button-blue"
                onClick={handleLogin}
              >
                Sign in
              </button>
              <button
                className="login-create pointer"
                onClick={() => setRegister(true)}
              >
                ユーザー作成
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Login;
