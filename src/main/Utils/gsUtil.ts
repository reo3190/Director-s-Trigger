import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
// import Data from "../credentials.json";

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEET_ID = '172-l6avLazdiybSMy_hvCojOXwpxF68gUsLssOnPHfM';

interface Credentials {
  web: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

const getOAuth2Client = () => {
  const isDev =
    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
  const basePath = app.isPackaged
    ? path.join(process.resourcesPath, 'json')
    : path.join(__dirname, 'json');

  const jsonFilePath = path.join(basePath, 'credentials.json');

  const rawData = fs.readFileSync(jsonFilePath, 'utf-8');
  const jsonData = JSON.parse(rawData);

  const { client_id, client_secret, redirect_uris } = (jsonData as Credentials)
    .web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0],
  );

  const tokenPath: string = path.join(basePath, 'token.json');
  if (fs.existsSync(tokenPath)) {
    const tokenData = fs.readFileSync(tokenPath, 'utf-8');
    const token = JSON.parse(tokenData);
    oAuth2Client.setCredentials(token);
  }

  return oAuth2Client;
};

export const getData = async (
  project: string,
): Promise<Record<string, any>[]> => {
  try {
    const oAuth2Client = getOAuth2Client();
    const sheets = google.sheets({ version: 'v4' });
    const param = {
      spreadsheetId: SHEET_ID,
      range: project,
      auth: oAuth2Client,
    };

    let response = await sheets.spreadsheets.values.get(param);
    let data = response.data.values;

    if (!data || data.length === 0) {
      // console.log('No data found.');
      return [{ error: 'No data found.' }];
    }

    const labels: string[] = data[0];

    const dataObjects: Record<string, any>[] = data.slice(1).map((row) => {
      const obj: { [key: string]: string | null } = {};
      labels.forEach((label, index) => {
        obj[label] = row[index] || null;
      });
      return obj;
    });

    return dataObjects;
  } catch (error) {
    // console.error("シートデータ取得中のエラー:", error);
    return [{ error: 'getData error:' + error }];
  }
};

export const addData = async (
  project: string,
  range: string,
  value: string,
) => {
  try {
    const oAuth2Client = getOAuth2Client();
    const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
    const param = {
      spreadsheetId: SHEET_ID,
      range: `${project}!${range}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[value]],
      },
    };

    await sheets.spreadsheets.values.update(param);
    return { message: 'データを追加しました。' };
  } catch (error) {
    console.error('addData error:', error);
    return { error: 'データ追加エラーが発生しました。' };
  }
};

export const getProjectsFromGS = async () => {
  try {
    const oAuth2Client = getOAuth2Client();
    const sheets = google.sheets({ version: 'v4' });
    const param = {
      spreadsheetId: SHEET_ID,
      auth: oAuth2Client,
    };
    const response = await sheets.spreadsheets.get(param);

    if (response.data && response.data.sheets) {
      const sheetTitles = response.data.sheets.map(
        (sheet) => sheet.properties?.title,
      );
      return sheetTitles;
    } else {
      return [{ error: 'No sheet found.' }];
    }
  } catch (error) {
    return [{ error: 'getProjectsFromGS error:' + error }];
  }
};
