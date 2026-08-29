import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api";

const links = [
  { to: "/", idx: "01", label: "Create URL" },
  { to: "/explorer", idx: "02", label: "Analytics Explorer" },
  { to: "/system", idx: "03", label: "System Dashboard" },
];

export default function Sidebar() {
  const [up, setUp] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE_URL}/metrics`)
      .then((res) => {
        if (!cancelled) setUp(res.ok);
      })
      .catch(() => {
        if (!cancelled) setUp(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">// console</div>
        <div className="brand-name">url-shortener</div>
        <div className="brand-sub">API explorer &amp; analytics</div>
      </div>

      <nav className="nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <span className="idx">{link.idx}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div>
          <span className={`status-dot ${up ? "up" : "down"}`} />
          {up === null
            ? "checking backend…"
            : up
              ? "backend reachable"
              : "backend unreachable"}
        </div>
        <div style={{ marginTop: 6 }}>{API_BASE_URL}</div>
      </div>
    </aside>
  );
}
