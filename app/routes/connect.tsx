import type { LinksFunction, LoaderFunction } from "remix";
import { useLoaderData, redirect } from "remix";

import { requireUserId, getUser, getTokens } from "~/utils/session.server";
import { getGoogleAuth } from "~/utils/google.server";
import stylesUrl from "~/styles/app.css";

export const links: LinksFunction = () => {
  return [{ prefetch: "intent", rel: "stylesheet", href: stylesUrl }];
};

type LoaderData = {
  authUrl: string;
  user: Awaited<ReturnType<typeof getUser>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserId(request);
  const user = await getUser(request);
  const tokens = await getTokens(request);
  const authUrl = await getGoogleAuth(request);
  if (tokens?.access_token && tokens?.refresh_token && user?.spreadsheetId) {
    return redirect("/entry");
  }

  const data: LoaderData = {
    authUrl,
    user,
  };
  return data;
};

export default function Connect() {
  const data = useLoaderData<LoaderData>();

  return (
    <main className="app-main">
      <a href={data.authUrl}>
        <button className="button">Connect Google Account</button>
      </a>
    </main>
  );
}
