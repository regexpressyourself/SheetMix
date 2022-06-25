import bcrypt from "bcryptjs";
import { createCookieSessionStorage, redirect } from "remix";
import { Tokens } from "~/types";

import { db } from "./db.server";

type LoginForm = {
  username: string;
  password: string;
};

export async function register({ username, password }: LoginForm) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: { username, passwordHash },
  });
  return { id: user.id, username };
}

export async function login({ username, password }: LoginForm) {
  const user = await db.user.findUnique({
    where: { username },
  });
  if (!user) return null;
  const isCorrectPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isCorrectPassword) return null;
  return { id: user.id, username };
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

export const storage = createCookieSessionStorage({
  cookie: {
    name: "RJ_session",
    // normally you want this to be `secure: true`
    // but that doesn't work on localhost for Safari
    // https://web.dev/when-to-use-local-https/
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

export function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

export async function getTokens(request: Request) {
  const session = await getUserSession(request);
  const tokens = session.get("tokens");
  if (tokens) {
    return typeof tokens === "string" ? JSON.parse(tokens) : tokens;
  } else {
    return null;
  }
}

export async function getGoogleAcessToken(request: Request) {
  const tokens = await getTokens(request);
  const { access_token, refresh_token, scope, token_type, expiry_date } = tokens
    ? tokens
    : {
        access_token: null,
        refresh_token: null,
        scope: null,
        token_type: null,
        expiry_date: null,
      };

  const nextTokens = {
    access_token,
    refresh_token,
    scope,
    token_type,
    expiry_date,
  };

  return nextTokens;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (typeof userId !== "string") {
    return null;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        spreadsheetId: true,
        username: true,
      },
    });
    return user;
  } catch {
    throw logout(request);
  }
}

export async function logout(request: Request) {
  const session = await storage.getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

export async function createGoogleSession(
  request: Request,
  tokens: Tokens,
  redirectTo: string
) {
  const userId = await getUserId(request);
  const session = await storage.getSession();
  if (!tokens || !tokens.access_token || !userId) {
    return redirect(redirectTo);
  }
  session.set("tokens", JSON.stringify(tokens));
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}
