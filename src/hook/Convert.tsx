interface RegExpList {
  reg: RegExp;
  to: string;
}

export const DeleteTag = (body: string) => {
  let noTag: string = body;

  const tag: RegExpList[] = [
    { reg: /\[info\]([\s\S]*?)\[\/info\]/g, to: '$1' },
    { reg: /\[title\]([\s\S]*?)\[\/title\]/g, to: '$1' },
    { reg: /\[qt\]([\s\S]*?)\[\/qt\]/g, to: '【引用文】' },
    { reg: /\[toall\]/g, to: '' },
    { reg: /\[To:\d+\].*?\n/g, to: '' },
    { reg: /\[dtext:(.*?)\]/g, to: '' },
  ];

  tag.forEach((t, i) => {
    noTag = noTag.replace(t.reg, t.to);
  });

  noTag = noTag.replace(/^\n/, '');

  return noTag;
};

export const DateConvert = (mtime: number) => {
  const jstDate = new Date(mtime);

  // 年月日時刻を取得
  const year = jstDate.getFullYear();
  const month = ('0' + (jstDate.getMonth() + 1)).slice(-2);
  const day = ('0' + jstDate.getDate()).slice(-2);
  const hours = ('0' + jstDate.getHours()).slice(-2);
  const minutes = ('0' + jstDate.getMinutes()).slice(-2);
  const seconds = ('0' + jstDate.getSeconds()).slice(-2);

  // フォーマットして出力
  const formattedDate = `${year}/${month}/${day} ${hours}:${minutes}`;

  return formattedDate;
};
