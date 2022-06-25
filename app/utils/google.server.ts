import { google } from "googleapis";
import { redirect } from "remix";
import {
  createGoogleSession,
  getGoogleAcessToken,
  getUser,
} from "~/utils/session.server";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const getOauthClient = async (request: Request) => {
  const { client_secret, client_id, redirect_uris } = {
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uris: [
      process.env.GOOGLE_REDIRECT_URI_PROD,
      process.env.GOOGLE_REDIRECT_URI_STAGING,
      process.env.GOOGLE_REDIRECT_URI_DEV,
    ],
  };
  const nextRedirectUri = process.env.NODE_ENV === "production" ? 0 : 1;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[nextRedirectUri]
  );
  if (request) {
    const tokens = await getGoogleAcessToken(request);
    if (tokens) {
      oAuth2Client.setCredentials(tokens);
    }
  }
  return oAuth2Client;
};

export const getSheetDataGoogle = async (request: Request, range: string) => {
  const auth = await getOauthClient(request);
  const tokens = await getGoogleAcessToken(request);
  const user = await getUser(request);
  const spreadsheetId = user?.spreadsheetId;
  if (!spreadsheetId) {
    return null;
  }

  auth.setCredentials(tokens);

  try {
    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const { data } = response;
    return data.values;
  } catch (err) {
    console.error(err);
    return { error: err };
  }
};

export const getSheetMetadata = async (request: Request) => {
  const auth = await getOauthClient(request);
  const tokens = await getGoogleAcessToken(request);
  const user = await getUser(request);
  const spreadsheetId = user?.spreadsheetId;
  if (!spreadsheetId) {
    return null;
  }

  auth.setCredentials(tokens);

  try {
    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      //range,
    });
    const { data } = response;
    return data.sheets;
  } catch (err) {
    console.error(err);
    return { error: err };
  }
};

export const putSheetData = async (
  request: Request,
  range: string,
  values: string[][]
) => {
  const tokens = await getGoogleAcessToken(request);
  const user = await getUser(request);
  const spreadsheetId = user?.spreadsheetId;
  const auth = await getOauthClient(request);
  auth.setCredentials(tokens);
  if (!spreadsheetId) {
    return null;
  }

  try {
    const sheets = google.sheets({ version: "v4", auth });
    const { data } = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });
    return data;
  } catch (err) {
    throw new Error(err);
  }
};

export async function getGoogleAuth(request: Request) {
  const oAuth2Client = await getOauthClient(request);
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  return authUrl;
}

export async function postGoogleAuth(request: Request, code: string) {
  const oAuth2Client = await getOauthClient(request);

  try {
    const token = await oAuth2Client.getToken(code);
    const passedToken = token.tokens;
    oAuth2Client.setCredentials(passedToken);
    if (!passedToken || !passedToken.access_token) {
      return;
    }
    return await createGoogleSession(request, passedToken, "/sheet");
  } catch (err) {
    console.error("Error while trying to retrieve access token", err);
    return redirect("/connect");
  }
}
