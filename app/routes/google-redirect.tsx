import type { LinksFunction, LoaderFunction } from "remix";
import { postGoogleAuth } from "~/utils/google.server";
import stylesUrl from "~/styles/app.css";

export const links: LinksFunction = () => {
  return [{ prefetch: "intent", rel: "stylesheet", href: stylesUrl }];
};


export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return {};
  }
  return await postGoogleAuth(request, code);
};

export default function GoogleRedirect() {
  return <main className="app-main">Redirecting...</main>;
}
