import type { LinksFunction, LoaderFunction } from "remix";
import { Link, redirect } from "remix";
import { getUser, getTokens } from "~/utils/session.server";
import stylesUrl from "~/styles/index.css";
import manifest from "../manifest.json";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request);
  const tokens = await getTokens(request);
  if (tokens?.access_token && tokens?.refresh_token && user?.spreadsheetId) {
    return redirect("/entry");
  }

  return null;
};

export default function Index() {
  return (
    <div className="container">
      <div className="content">
        <h1>
          <span className="logo">{manifest.emoji}</span>
          <span className="logo-medium">{manifest.title}</span>
        </h1>
        <nav>
          <ul>
            <li>
              <Link to="login">Log In</Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
