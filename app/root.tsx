import type { LoaderFunction, LinksFunction, MetaFunction } from "remix";
import { getUser } from "~/utils/session.server";
import Nav from "~/components/nav";
import {
  Links,
  LiveReload,
  Outlet,
  useCatch,
  Meta,
  Scripts,
  useLoaderData,
} from "remix";
import globalStylesUrl from "./styles/global.css";
import globalMediumStylesUrl from "./styles/global-medium.css";
import globalLargeStylesUrl from "./styles/global-large.css";
import manifest from "./manifest.json";

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: globalStylesUrl,
    },
    {
      rel: "stylesheet",
      href: globalMediumStylesUrl,
      media: "print, (min-width: 640px)",
    },
    {
      rel: "stylesheet",
      href: globalLargeStylesUrl,
      media: "screen and (min-width: 1024px)",
    },
  ];
};

export const meta: MetaFunction = () => {
  return {
    description: manifest["description"],
    keywords: manifest["keywords"],
    "twitter:image": manifest["twitter:image"],
    "twitter:card": manifest["twitter:card"],
    "twitter:creator": manifest["twitter:creator"],
    "twitter:site": manifest["twitter:site"],
    "twitter:title": manifest["twitter:title"],
    "twitter:description": manifest["twitter:description"],
    viewport: "width=device-width, initial-scale=1",
  };
};

type LoaderData = {
  user: Awaited<ReturnType<typeof getUser>>;
};

export const loader: LoaderFunction = async ({
  request,
}: {
  request: Request;
}) => {
  const user = await getUser(request);
  const data: LoaderData = {
    user,
  };
  return data;
};

function Document({
  children,
  title = manifest.title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const data = useLoaderData<LoaderData>();
  const user = data?.user;
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <Meta />
        <title>{title}</title>
        <Links />
      </head>
      <body>
        <div className="app-layout">
          <Nav user={user} />
          {children}
        </div>
        <Scripts />
        {process.env.NODE_ENV === "development" ? <LiveReload /> : null}
      </body>
    </html>
  );
}

export default function App() {
  return (
    <Document>
      <div className="app-container">
        <Outlet />
      </div>
    </Document>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  return (
    <Document title={`${caught.status} ${caught.statusText}`}>
      <div className="error-container">
        <h1>
          {caught.status} {caught.statusText}
        </h1>
      </div>
    </Document>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <Meta />
        <title>Uh-oh!</title>
        <Links />
      </head>
      <body>
        <div className="app-layout">
          <div className="error-container">
            <h1>App Error</h1>
            <pre>{error.message}</pre>
          </div>
        </div>
        <Scripts />
        {process.env.NODE_ENV === "development" ? <LiveReload /> : null}
      </body>
    </html>
  );
}
