/* eslint import/prefer-default-export: off */
import path from 'path';
import mysql, { RowDataPacket } from 'mysql2/promise';

interface FileInfo {
  mtime: number;
  size: number;
}

interface SetupData {
  project: string;
  receiver: string;
  id: string;
}

const dbInfo = {
  host: '192.168.11.79',
  user: 'master',
  password: '',
  database: 'director_tool',
};

async function getConnection() {
  return mysql.createConnection(dbInfo);
}

export const initializeTable = async (tableName: string) => {
  const connection = await getConnection();

  let table =
    ' path VARCHAR(255),\
      directory VARCHAR(255),\
      file VARCHAR(255),\
      mtime VARCHAR(255),\
      size VARCHAR(255),\
      exist BOOLEAN,\
      PRIMARY KEY (path)';

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      ${table})
  `);

  return connection;
};

export const saveFileInfoToDB = async (
  tableName: string,
  fileInfo: Record<string, FileInfo>,
  inputPath: string,
): Promise<void> => {
  const connection = await getConnection();
  const okPath = path.join(inputPath, '_ok');
  const rePath = path.join(inputPath, '_r');
  await connection.execute(
    `UPDATE ${tableName} SET exist = ?
     WHERE directory = ? OR directory = ? OR directory = ?`,
    [false, inputPath, okPath, rePath],
  );
  for (const [filePath, info] of Object.entries(fileInfo)) {
    const base = path.basename(filePath);
    const dir = path.dirname(filePath);
    await connection.execute(
      `INSERT INTO ${tableName} (path, directory, file, mtime, size, exist)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE mtime = VALUES(mtime), size = VALUES(size), exist = VALUES(exist)`,
      [filePath, dir, base, info.mtime, info.size, true],
    );
  }
  await connection.end();
};

export const getFileInfoFromDB = async (
  tableName: string,
): Promise<Record<string, FileInfo>> => {
  const connection = await getConnection();
  const [rows] = await connection.execute(`SELECT * FROM ${tableName}`);
  await connection.end();

  const fileInfo: Record<string, FileInfo> = {};
  for (const row of rows as any[]) {
    if (row.exist) {
      fileInfo[row.path] = {
        mtime: Number(row.mtime),
        size: Number(row.size),
      };
    }
  }
  return fileInfo;
};

export const getProjectsFromDB = async (
  user: string,
  password: string,
): Promise<SetupData[]> => {
  try {
    const connection = await getConnection();
    const sql =
      'SELECT project, receiver, logID FROM projects WHERE user = ? AND password = ?';
    const [rows] = await connection.execute<RowDataPacket[]>(sql, [
      user,
      password,
    ]);
    await connection.end();

    if (rows.length === 0) {
      return [];
    }

    const SetupInfo: SetupData[] = [];
    for (const row of rows as any[]) {
      const data: SetupData = {
        project: row.project,
        receiver: row.receiver,
        id: row.logID,
      };
      SetupInfo.push(data);
    }
    return SetupInfo;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const addProjectToDB = async (
  user: string,
  password: string,
  project: string,
  receiver: string,
  logID: string,
): Promise<string> => {
  const connection = await getConnection();

  const [rows]: [any[], any] = await connection.execute(
    `SELECT 1 FROM projects WHERE project = ? AND user = ? AND password = ? AND receiver = ?`,
    [project, user, password, receiver],
  );

  console.log(rows);

  if (rows.length === 0) {
    await connection.execute(
      `INSERT INTO projects (user, password, project, receiver, logID)
       VALUES (?, ?, ?, ?, ?)`,
      [user, password, project, receiver, logID],
    );
    await connection.end();
    return '';
  } else {
    await connection.end();
    return 'Record already exists. Skipping insertion.';
  }
};

export const deleteProjectToDB = async (
  user: string,
  password: string,
  project: string,
  logID: string,
) => {
  const connection = await getConnection();
  await connection.execute(
    `DELETE FROM projects WHERE (user = ? AND password = ? AND project = ? AND logID = ?);`,
    [user, password, project, logID],
  );
  await connection.execute(`DROP TABLE IF EXISTS \`${logID}\``);
  await connection.end();
};

export const checkUserByDB = async (
  user: string,
  password: string,
): Promise<boolean> => {
  const connection = await getConnection();
  const [rows]: [any[], any] = await connection.execute(
    `SELECT 1 FROM users WHERE user = ? AND password = ?`,
    [user, password],
  );
  await connection.end();

  if (rows.length === 0) {
    return false;
  } else {
    return true;
  }
};

export const addUserToDB = async (
  user: string,
  password: string,
): Promise<string> => {
  const connection = await getConnection();

  const [rows]: [any[], any] = await connection.execute(
    `SELECT 1 FROM users WHERE user = ? AND password = ?`,
    [user, password],
  );

  if (rows.length === 0) {
    await connection.execute(
      `INSERT INTO users (user, password)
       VALUES (?, ?)`,
      [user, password],
    );
    await connection.end();
    return 'ユーザー情報を作成しました。';
  } else {
    await connection.end();
    return '既に存在するユーザーです。';
  }
};
