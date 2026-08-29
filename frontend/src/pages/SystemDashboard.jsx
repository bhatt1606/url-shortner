import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getGlobalDashboard } from "../api";
import JsonPeek from "../components/JsonPeek";

export default function SystemDashboard() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: null,
  });

  function load() {
    setState({ loading: true, error: null, data: null });
    getGlobalDashboard()
      .then((res) => setState({ loading: false, error: null, data: res.data }))
      .catch((err) =>
        setState({
          loading: false,
          error: err.response?.data?.message || err.message,
          data: err.response?.data,
        }),
      );
  }

  useEffect(load, []);

  const { loading, error, data } = state;

  return (
    <div>
      <div className="page-header">
        <div className="page-eyebrow">03 — Overview</div>
        <h1 className="page-title">System dashboard</h1>
        <p className="page-desc">
          Aggregated straight from MongoDB across every short URL — not
          Redis-cached, so this always reflects the current collection state
          (including whatever the counter worker has flushed so far).
        </p>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Fleet stats</span>
          <span className="panel-route">GET /api/dashboard</span>
        </div>
        <div className="panel-body">
          {loading && <div className="loading-line">fetching…</div>}
          {error && !loading && (
            <div className="alert alert-error">{error}</div>
          )}
          {data && !loading && !error && (
            <>
              <div className="stat-grid">
                <Stat label="Total URLs" value={data.totalUrls} />
                <Stat label="Active" value={data.activeUrls} />
                <Stat label="Expired" value={data.expiredUrls} />
                <Stat label="Total clicks" value={data.totalClicks} />
              </div>

              {data.topUrls?.length ? (
                <table>
                  <thead>
                    <tr>
                      <th>Short ID</th>
                      <th style={{ textAlign: "right" }}>Clicks</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.topUrls.map((u) => (
                      <tr key={u._id}>
                        <td className="mono">{u.shortId}</td>
                        <td className="mono" style={{ textAlign: "right" }}>
                          {u.totalClicks}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <Link
                            to="/explorer"
                            state={{ shortId: u.shortId }}
                            className="btn-ghost btn"
                            style={{ padding: "4px 10px", fontSize: 12 }}
                          >
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">No URLs created yet.</div>
              )}

              <button
                className="btn-ghost btn"
                type="button"
                onClick={load}
                style={{ marginTop: 16 }}
              >
                Refresh
              </button>
            </>
          )}
        </div>
        <JsonPeek data={data} method="GET" route="/api/dashboard" />
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Where these numbers come from</span>
        </div>
        <div className="panel-body">
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            <code>totalClicks</code> here reads the <code>URL</code> document's
            field directly — the number the counter worker last flushed in from
            Redis, every 30 seconds. It can lag slightly behind the live Redis
            count you see on the Explorer page, which adds the pending{" "}
            <code>clicks:&#123;shortId&#125;</code> counter on top in real time.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat-cell">
      <div className="stat-value">{value ?? "—"}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
