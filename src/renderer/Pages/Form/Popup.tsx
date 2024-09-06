import React, { useState, useEffect, FC, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { FaCheck, FaPen } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';

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

interface Props {
  setPopup: React.Dispatch<React.SetStateAction<boolean>>;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  handleUpdateDB: () => Promise<void>;
}

const Popup: FC<Props> = ({
  setPopup,
  message,
  setMessage,
  handleUpdateDB,
}) => {
  const location = useLocation();
  const data = location.state as {
    user: string;
    password: string;
    project: string;
    receiver: string;
    id: string;
  };

  const [edit, setEdit] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [updating, setUpdating] = useState(false);

  const handleChangeText = (value: string) => {
    setMessage(value);
    setTextareaHeight();
  };

  const setTextareaHeight = () => {
    if (textareaRef.current) {
      console.log(textareaRef.current.scrollHeight);
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handlePostChat = async () => {
    try {
      setUpdating(true);
      await handleUpdateDB();
      const roomID = JSON.parse(data.receiver);
      const result2 = await window.electron.sendChat(
        roomID[0].toString(),
        message,
      );
      console.log(result2);
      setUpdating(false);
      setPopup(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (edit) {
      setTextareaHeight();
    }
  }, [edit]);

  return (
    <>
      <div className="popup-wrapper">
        <div className="popup-outer">
          <div className="popup-inner">
            <button className="popup-close" onClick={() => setPopup(false)}>
              <IoClose size={'2rem'} />
            </button>
            <div className="popup-receiver">
              <img
                className="popup-icon icon"
                src={JSON.parse(data.receiver)[2]}
              />
              <div>{JSON.parse(data.receiver)[1]}</div>
            </div>
            <div className="popup-message">
              <div className="popup-message-inner">
                {edit ? (
                  <>
                    <textarea
                      ref={textareaRef}
                      value={message}
                      onChange={(e) => handleChangeText(e.target.value)}
                      onBlur={() => setEdit(false)}
                    ></textarea>
                  </>
                ) : (
                  <>{`${message !== '' ? message + '\n\n' : message}`}</>
                )}
              </div>
              <div className="popup-message-footer">
                <div className="message-footer-inner">
                  <button
                    onClick={() => setEdit((pre) => !pre)}
                    className={`popup-edit ${edit && 'active'}`}
                  >
                    {edit ? (
                      <FaCheck size={'2.5rem'} />
                    ) : (
                      <FaPen size={'2.5rem'} />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <button className="popup-submit" onClick={() => handlePostChat()}>
              {updating ? (
                <>
                  送信中<div className="loader"></div>
                </>
              ) : (
                '送信'
              )}
            </button>
          </div>
        </div>
        <div className="popup-back"></div>
      </div>
    </>
  );
};

export default Popup;
