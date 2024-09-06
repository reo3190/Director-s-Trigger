import { useState, FC, Dispatch } from 'react';

import { TiArrowBack } from 'react-icons/ti';

interface UserData {
  user: string;
  password: string;
}

interface Props {
  setRegister: Dispatch<React.SetStateAction<boolean>>;
}

const Register: FC<Props> = ({ setRegister }) => {
  const [userDataInput, setUserDataInput] = useState<UserData>({
    user: '',
    password: '',
  });
  const [message, setMessage] = useState<string>(
    '新規ユーザーの情報を入力してください。',
  );

  const handleRegister = async () => {
    if (userDataInput.user === '' || userDataInput.password === '') {
      setMessage('入力情報が不足しています。');
      return;
    }
    const result = await window.electron.addUser(
      userDataInput.user,
      userDataInput.password,
    );
    setMessage(result);
    setUserDataInput({ user: '', password: '' });
  };

  return (
    <>
      <div className="register-wrapper">
        <div className="register-outer">
          <div>{message}</div>
          <div className="register-input">
            <input
              type="text"
              value={userDataInput.user}
              onChange={(e) => {
                const valueWithoutSpaces = e.target.value.replace(/\s+/g, '');
                setUserDataInput((prev) => ({
                  ...prev,
                  user: valueWithoutSpaces,
                }));
              }}
              placeholder="name"
            />
            <input
              type="password"
              value={userDataInput.password}
              onChange={(e) => {
                const valueWithoutSpaces = e.target.value.replace(/\s+/g, '');
                setUserDataInput((prev) => ({
                  ...prev,
                  password: valueWithoutSpaces,
                }));
              }}
              placeholder="password"
            />
          </div>

          <button
            className="register-button pointer button-blue"
            onClick={handleRegister}
          >
            Sign up
          </button>
          <button
            className="register-back pointer"
            onClick={() => setRegister(false)}
          >
            <TiArrowBack size={'2rem'} />
          </button>
        </div>
      </div>
    </>
  );
};

export default Register;
