import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export function Layout() {
  const { user, signOut } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>ROSCA Committee</h1>
          <p className="muted">Welcome, {user?.name}</p>
        </div>
        <div className="top-actions">
          <nav>
            <Link to="/">Dashboard</Link>
            <Link to="/committees/new">Create Committee</Link>
          </nav>
          <button className="ghost-button" onClick={toggleTheme}>
            {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button className="ghost-button" onClick={signOut}>
            Logout
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
