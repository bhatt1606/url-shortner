import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  getAnalytics,
  getAnalyticsSummary,
  getClickTrends,
  getHourlyTrends,
} from "../api";
import JsonPeek from "../components/JsonPeek";

const TABS = [
  { id: "summary", label: "Summary" },
  { id: "daily", label: "Daily trends" },
  { id: "hourly", label: "Hourly trends" },
  { id: "records", label: "Raw records" },
];

export default function Explorer() {
  const location = useLocation();
  const [shortId, setShortId] = useState(location.state?.shortId || "");
  const [activeShortId, setActiveShortId] = useState(
    location.state?.shortId || "",
  );
  const [tab, setTab] = useState("summary");

  function handleLoad(e) {
    e?.preventDefault();
    if (shortId.trim()) setActiveShortId(shortId.trim());
  }

  useEffect(() => {
    if (location.state?.shortId) {
      handleLoad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-eyebrow">02 — Explore</div>
        <h1 className="page-title">Analytics explorer</h1>
        <p className="page-desc">
          Every click on a short URL queues a job on BullMQ; a background worker
          enriches it (browser, OS, device, geo) and writes it to the
          <code> Analytics</code> collection. These panels read that data back
          through four separate endpoints, each cached in Redis for 5 minutes.
        </p>
      </div>

      <div className="panel">
        <div className="panel-body">
          <form
            onSubmit={handleLoad}
            className="row"
            style={{ alignItems: "flex-end" }}
          >
            <div className="field" style={{ flex: 2 }}>
              <label htmlFor="shortId">Short ID</label>
              <input
                id="shortId"
                type="text"
                placeholder="e.g. google, or an 8-char id"
                value={shortId}
                onChange={(e) => setShortId(e.target.value)}
              />
            </div>
            <button className="btn" type="submit" style={{ height: 41 }}>
              Load analytics
            </button>
          </form>
        </div>
      </div>

      {activeShortId && (
        <>
          <div className="tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
                type="button"
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "summary" && <SummaryPanel shortId={activeShortId} />}
          {tab === "daily" && <DailyTrendsPanel shortId={activeShortId} />}
          {tab === "hourly" && <HourlyTrendsPanel shortId={activeShortId} />}
          {tab === "records" && <RecordsPanel shortId={activeShortId} />}
        </>
      )}
    </div>
  );
}

function useFetch(fn, deps) {
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, error: null, data: null });

    fn()
      .then((res) => {
        if (!cancelled)
          setState({ loading: false, error: null, data: res.data });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            loading: false,
            error: err.response?.data?.message || err.message,
            data: err.response?.data,
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

function SummaryPanel({ shortId }) {
  const { loading, error, data } = useFetch(
    () => getAnalyticsSummary(shortId),
    [shortId],
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Summary</span>
        <span className="panel-route">GET /api/analytics/:shortId/summary</span>
      </div>
      <div className="panel-body">
        {loading && <div className="loading-line">fetching…</div>}
        {error && !loading && <div className="alert alert-error">{error}</div>}
        {data && !loading && !error && (
          <>
            <div className="stat-grid">
              <Stat label="Total clicks" value={data.totalClicks} />
              <Stat label="Countries" value={data.uniqueCountries} />
              <Stat label="Browsers" value={data.uniqueBrowsers} />
              <Stat label="Devices" value={data.uniqueDevices} />
            </div>
            <BreakdownTable
              title="Top countries"
              rows={data.topCountries}
              keyField="country"
            />
            <BreakdownTable
              title="Top browsers"
              rows={data.topBrowsers}
              keyField="browser"
            />
            <BreakdownTable
              title="Top devices"
              rows={data.topDevices}
              keyField="deviceType"
            />
          </>
        )}
      </div>
      <JsonPeek
        data={data}
        method="GET"
        route={`/api/analytics/${shortId}/summary`}
      />
    </div>
  );
}

function DailyTrendsPanel({ shortId }) {
  const { loading, error, data } = useFetch(
    () => getClickTrends(shortId),
    [shortId],
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Daily click trends</span>
        <span className="panel-route">GET /api/analytics/:shortId/trends</span>
      </div>
      <div className="panel-body">
        {loading && <div className="loading-line">fetching…</div>}
        {error && !loading && <div className="alert alert-error">{error}</div>}
        {data && !loading && !error && (
          <>
            <p
              style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 0 }}
            >
              Last 7 days · aggregated from the Analytics collection by
              createdAt
            </p>
            {data.dailyClicks?.length ? (
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.dailyClicks}>
                    <CartesianGrid stroke="#202a2d" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#8aa39c", fontSize: 11 }}
                    />
                    <YAxis
                      tick={{ fill: "#8aa39c", fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0b0f11",
                        border: "1px solid #2a3538",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="clicks"
                      fill="#5eead4"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state">
                No clicks recorded in the last 7 days.
              </div>
            )}
          </>
        )}
      </div>
      <JsonPeek
        data={data}
        method="GET"
        route={`/api/analytics/${shortId}/trends`}
      />
    </div>
  );
}

function HourlyTrendsPanel({ shortId }) {
  const { loading, error, data } = useFetch(
    () => getHourlyTrends(shortId),
    [shortId],
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Hourly click trends</span>
        <span className="panel-route">
          GET /api/analytics/:shortId/hourly-trends
        </span>
      </div>
      <div className="panel-body">
        {loading && <div className="loading-line">fetching…</div>}
        {error && !loading && <div className="alert alert-error">{error}</div>}
        {data && !loading && !error && (
          <>
            <p
              style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 0 }}
            >
              All-time, bucketed into 24 hours of day (0–23)
            </p>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.hourlyClicks}>
                  <CartesianGrid stroke="#202a2d" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: "#8aa39c", fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fill: "#8aa39c", fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0b0f11",
                      border: "1px solid #2a3538",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="clicks" fill="#e8a33d" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
      <JsonPeek
        data={data}
        method="GET"
        route={`/api/analytics/${shortId}/hourly-trends`}
      />
    </div>
  );
}

function RecordsPanel({ shortId }) {
  const [page, setPage] = useState(1);
  const { loading, error, data } = useFetch(
    () => getAnalytics(shortId, page, 10),
    [shortId, page],
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Raw click records</span>
        <span className="panel-route">GET /api/analytics/:shortId</span>
      </div>
      <div className="panel-body">
        {loading && <div className="loading-line">fetching…</div>}
        {error && !loading && <div className="alert alert-error">{error}</div>}
        {data && !loading && !error && (
          <>
            {data.analytics?.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Browser</th>
                    <th>OS</th>
                    <th>Device</th>
                    <th>Country</th>
                    <th>City</th>
                  </tr>
                </thead>
                <tbody>
                  {data.analytics.map((rec) => (
                    <tr key={rec._id}>
                      <td className="mono">
                        {new Date(rec.createdAt).toLocaleString()}
                      </td>
                      <td>{rec.browser || "—"}</td>
                      <td>{rec.os || "—"}</td>
                      <td>{rec.deviceType || "—"}</td>
                      <td>{rec.country || "—"}</td>
                      <td>{rec.city || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                No click records yet — visit the short link once.
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 16,
              }}
            >
              <span className="loading-line">
                page {data.page} of {data.totalPages || 1} · {data.totalRecords}{" "}
                total
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn-ghost btn"
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button
                  className="btn-ghost btn"
                  type="button"
                  disabled={page >= (data.totalPages || 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <JsonPeek
        data={data}
        method="GET"
        route={`/api/analytics/${shortId}?page=${page}&limit=10`}
      />
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

function BreakdownTable({ title, rows, keyField }) {
  if (!rows?.length) return null;
  const max = Math.max(...rows.map((r) => r.clicks));

  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-muted)",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <table>
        <tbody>
          {rows.slice(0, 6).map((row) => (
            <tr key={row[keyField]}>
              <td style={{ width: 120 }}>{row[keyField]}</td>
              <td>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(row.clicks / max) * 100}%` }}
                  />
                </div>
              </td>
              <td className="mono" style={{ width: 50, textAlign: "right" }}>
                {row.clicks}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
