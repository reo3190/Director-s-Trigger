import React, { useState, useEffect, FC, useRef, RefObject } from 'react';
import { DateConvert } from '../../../hook/Convert';

import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

import { MdMovie } from 'react-icons/md';
import { CiFileOn } from 'react-icons/ci';
import { FiFileText } from 'react-icons/fi';
import { SiAdobephotoshop } from 'react-icons/si';

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
  files: FileData[];
  setFiles: React.Dispatch<React.SetStateAction<FileData[]>>;
  isSendFile: boolean[];
  setIsSendFile: React.Dispatch<React.SetStateAction<boolean[]>>;
}

const FileList: FC<Props> = ({
  files,
  setFiles,
  isSendFile,
  setIsSendFile,
}) => {
  const [selectedItems1, setSelectedItems1] = useState<number[]>([]);
  const [selectedItems2, setSelectedItems2] = useState<number[]>([]);
  const [dragging, setDragging] = useState(false);
  const [selectionBox, setSelectionBox] = useState<DOMRect | null>(null);
  const container1Ref = useRef<HTMLDivElement>(null);
  const container2Ref = useRef<HTMLDivElement>(null);
  const startRef = useRef<{
    x: number;
    y: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);
  const [selectRef, setSelectRef] = useState(0);
  const [pushShift, setPushShift] = useState(false);

  const [filesOk, setFilesOk] = useState<FileData[]>([]);
  const [filesRe, setFilesRe] = useState<FileData[]>([]);
  const [filesNo, setFilesNo] = useState<FileData[]>([]);

  const handleMouseDown = (
    event: React.MouseEvent,
    ref: RefObject<HTMLDivElement>,
  ) => {
    setSelectRef(ref === container1Ref ? 1 : 2);
    if (!pushShift) {
      setSelectedItems1([]);
      setSelectedItems2([]);
    } else {
      if (ref === container1Ref) setSelectedItems2([]);
      if (ref === container2Ref) setSelectedItems1([]);
    }

    if (ref.current) {
      setDragging(true);
      startRef.current = {
        x: event.clientX,
        y: event.clientY,
        scrollLeft: ref.current.scrollLeft,
        scrollTop: ref.current.scrollTop,
      };
      setSelectionBox(null);

      const container = ref.current;
      const containerRect = container.getBoundingClientRect();
      const elements = Array.from(ref.current.querySelectorAll('.item'));
      const x = event.clientX - containerRect.left;
      const y = event.clientY - containerRect.top;
      const selectedIds = elements
        .filter((element) => {
          if (
            ref === container1Ref &&
            selectedItems1.includes(Number(element.getAttribute('data-id'))) &&
            pushShift
          )
            return true;
          if (
            ref === container2Ref &&
            selectedItems2.includes(Number(element.getAttribute('data-id'))) &&
            pushShift
          )
            return true;

          const rect = element.getBoundingClientRect();
          const offsetX = rect.left - containerRect.left;
          const offsetY = rect.top - containerRect.top;
          return (
            offsetX < x &&
            offsetX + rect.width > x &&
            offsetY < y &&
            offsetY + rect.height > y &&
            files[Number(element.getAttribute('data-id'))].tag[0] !== 'nocheck'
          );
        })
        .map((element) => Number(element.getAttribute('data-id')));
      ref === container1Ref
        ? setSelectedItems1(selectedIds)
        : setSelectedItems2(selectedIds);
    }
  };

  const handleMouseMove = (
    event: React.MouseEvent,
    ref: RefObject<HTMLDivElement>,
  ) => {
    if (dragging && startRef.current && ref.current) {
      const containerRect = ref.current.getBoundingClientRect();

      const currentScrollLeft = ref.current.scrollLeft;
      const currentScrollTop = ref.current.scrollTop;

      const deltaX = currentScrollLeft - startRef.current.scrollLeft;
      const deltaY = currentScrollTop - startRef.current.scrollTop;

      const x = Math.min(
        event.clientX - containerRect.left + currentScrollLeft,
        startRef.current.x - containerRect.left + currentScrollLeft - deltaX,
      );
      const y = Math.min(
        event.clientY - containerRect.top + currentScrollTop,
        startRef.current.y - containerRect.top + currentScrollTop - deltaY,
      );

      const width =
        Math.abs(event.clientX - startRef.current.x) + Math.abs(deltaX);
      const height =
        Math.abs(event.clientY - startRef.current.y) + Math.abs(deltaY);

      setSelectionBox(new DOMRect(x, y, width, height));

      const adjustedBox = {
        left: x,
        top: y,
        right: x + width,
        bottom: y + height,
      };

      const elements = Array.from(ref.current.querySelectorAll('.item'));
      const selectedIds = elements
        .filter((element) => {
          if (
            ref === container1Ref &&
            selectedItems1.includes(Number(element.getAttribute('data-id'))) &&
            pushShift
          )
            return true;
          if (
            ref === container2Ref &&
            selectedItems2.includes(Number(element.getAttribute('data-id'))) &&
            pushShift
          )
            return true;

          const rect = element.getBoundingClientRect();
          const elementBox = {
            left: rect.left - containerRect.left + ref.current!.scrollLeft,
            top: rect.top - containerRect.top + ref.current!.scrollTop,
            right: rect.right - containerRect.left + ref.current!.scrollLeft,
            bottom: rect.bottom - containerRect.top + ref.current!.scrollTop,
          };
          return !(
            elementBox.left > adjustedBox.right ||
            elementBox.right < adjustedBox.left ||
            elementBox.top > adjustedBox.bottom ||
            elementBox.bottom < adjustedBox.top ||
            files[Number(element.getAttribute('data-id'))].tag[0] === 'nocheck'
          );
        })
        .map((element) => Number(element.getAttribute('data-id')));

      ref === container1Ref
        ? setSelectedItems1(selectedIds)
        : setSelectedItems2(selectedIds);
    }
  };

  const handleMouseUp = () => {
    // setSelectRef(0)
    setDragging(false);
    setSelectionBox(null);
    startRef.current = null;
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setPushShift(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setPushShift(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const f_ok = files.filter((f, i) => f.tag[0] === '_ok' && isSendFile[i]);
    const f_re = files.filter((f, i) => f.tag[0] === '_r' && isSendFile[i]);
    setFilesOk(f_ok);
    setFilesRe(f_re);
    setFilesNo(
      files.filter((f, i) => f.tag[0] !== '_ok' && f.tag[0] !== '_r' && f.new),
    );
  }, [files, isSendFile]);

  const handle2to1 = () => {
    setIsSendFile((pre) =>
      pre.map((e, i) => (selectedItems2.includes(i) ? !e : e)),
    );
  };

  const handle1to2 = () => {
    setIsSendFile((pre) =>
      pre.map((e, i) => (selectedItems1.includes(i) ? !e : e)),
    );
  };

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

  const getIcon = (e: string) => {
    switch (e) {
      case 'txt':
        return <FiFileText size={'1.5rem'} />;
      case 'mov':
      case 'mp4':
        return <MdMovie size={'1.5rem'} />;
      case 'psd':
        return <SiAdobephotoshop size={'1.5rem'} />;
      default:
        return <CiFileOn size={'1.5rem'} />;
    }
  };

  return (
    <>
      <div className="filelist-outer">
        <div className="filelist-left-wrapper">
          <div>通知</div>
          <div
            ref={container1Ref}
            className="filelist-left"
            onMouseDown={(e) => handleMouseDown(e, container1Ref)}
            onMouseMove={(e) => handleMouseMove(e, container1Ref)}
          >
            <div className="list-label">
              <div className="label-name">名前</div>
              <div className="label-date">更新日時</div>
            </div>
            {filesOk.length > 0 && <div className="list-okr">OK</div>}
            {files.map((item, i) => {
              if (!isSendFile[i] || item.tag[0] !== '_ok') return;
              return (
                <div
                  key={i}
                  className={`item ${selectedItems1.includes(i) && 'select'} ${item.tag[0]}`}
                  data-id={i}
                >
                  <div className="item-icon">
                    {getIcon(
                      item.name.split('.')[item.name.split('.').length - 1],
                    )}
                  </div>
                  <div className="item-name">{sliceText(item.name, 27)}</div>
                  <div className="item-time">
                    {DateConvert(item.info.mtime)}
                  </div>
                </div>
              );
            })}
            {filesRe.length > 0 && <div className="list-okr">リテイク</div>}
            {files.map((item, i) => {
              if (!isSendFile[i] || item.tag[0] !== '_r') return;
              return (
                <div
                  key={i}
                  className={`item ${selectedItems1.includes(i) && 'select'} ${item.tag[0]}`}
                  data-id={i}
                >
                  <div className="item-icon">
                    {getIcon(
                      item.name.split('.')[item.name.split('.').length - 1],
                    )}
                  </div>
                  <div className="item-name">{sliceText(item.name, 27)}</div>
                  <div className="item-time">
                    {DateConvert(item.info.mtime)}
                  </div>
                </div>
              );
            })}
            {selectionBox && selectRef === 1 && (
              <div
                className="select-box"
                style={{
                  left: `${selectionBox.left}px`,
                  top: `${selectionBox.top}px`,
                  width: `${selectionBox.width}px`,
                  height: `${selectionBox.height}px`,
                }}
              />
            )}
          </div>
        </div>
        <div className="filelist-button">
          <button onClick={() => handle2to1()}>
            <FaArrowLeft size={'1.5rem'} />
          </button>
          <button onClick={() => handle1to2()}>
            <FaArrowRight size={'1.5rem'} />
          </button>
        </div>
        <div className="filelist-right-wrapper">
          <div> </div>
          <div
            ref={container2Ref}
            className="filelist-right"
            onMouseDown={(e) => handleMouseDown(e, container2Ref)}
            onMouseMove={(e) => handleMouseMove(e, container2Ref)}
          >
            {files.map((item, i) => {
              if (isSendFile[i] || !item.new) return;
              if (item.tag[0] === 'nocheck') return;
              return (
                <div
                  key={i}
                  className={`item ${selectedItems2.includes(i) && 'select'} ${item.tag[0]}`}
                  data-id={i}
                >
                  <div className="item-icon">
                    {getIcon(
                      item.name.split('.')[item.name.split('.').length - 1],
                    )}
                  </div>
                  <div>{sliceText(item.name, 20)}</div>
                  {/* <div>{item.info.mtime}</div> */}
                </div>
              );
            })}
            <hr />
            {files.map((item, i) => {
              if (isSendFile[i] || !item.new) return;
              if (item.tag[0] !== 'nocheck') return;
              return (
                <div
                  key={i}
                  className={`item ${selectedItems2.includes(i) && 'select'} ${item.tag[0]}`}
                  data-id={i}
                >
                  <div className="item-icon">
                    {getIcon(
                      item.name.split('.')[item.name.split('.').length - 1],
                    )}
                  </div>
                  <div>{sliceText(item.name, 20)}</div>
                </div>
              );
            })}
            {selectionBox && selectRef === 2 && (
              <div
                className="select-box"
                style={{
                  left: `${selectionBox.left}px`,
                  top: `${selectionBox.top}px`,
                  width: `${selectionBox.width}px`,
                  height: `${selectionBox.height}px`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FileList;
