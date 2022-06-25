import { getUser } from "~/utils/session.server";
import { Form, Link } from "remix";
import manifest from '../manifest.json'

export default function Nav({
  user,
}: {
  user: Awaited<ReturnType<typeof getUser>>;
}) {
  return (
    <header className="app-header">
      <div className="container">
        <h1 className="home-link">
          <Link to="/" title="WorkInOut" aria-label="WorkInOut">
            <span className="logo">{manifest.emoji}</span>
            <span className="logo-medium">{manifest.emoji} {manifest.title}</span>
          </Link>
        </h1>
        {user ? (
          <div className="user-info">
            <span>{`Hi ${user.username}`}</span>
            <Form action="/logout" method="post">
              <button type="submit" className="button">
                Logout
              </button>
            </Form>
          </div>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </header>
  );
}
