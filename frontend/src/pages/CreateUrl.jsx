import { useState } from "react";
import { Link } from "react-router-dom";
import { createShortUrl, API_BASE_URL } from "../api";
import JsonPeek from "../components/JsonPeek";

export default function CreateUrl() {
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [rawResponse, setRawResponse] = useState(undefined);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setRawResponse(undefined);

    if (!url.trim()) {
      setError("A destination URL is required.");
      return;
    }

    setLoading(true);
    try {
      const payload = { url: url.trim() };
      if (customAlias.trim()) payload.customAlias = customAlias.trim();
      if (expiresInDays.trim()) payload.expiresInDays = Number(expiresInDays);

      const res = await createShortUrl(payload);
      setResult(res.data);
      setRawResponse(res.data);
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Something went wrong.";
      setError(message);
      setRawResponse(err.response?.data);
    } finally {
      setLoading(false);
    }
  }

  const shortLink = result ? `${API_BASE_URL}/api/${result.shortId}` : null;

  return (
    <div>
      <div className="page-header">
        <div className="page-eyebrow">01 — Create</div>
        <h1 className="page-title">Create a short URL</h1>
        <p className="page-desc">
          Sends <code>POST /api/url</code>. If you skip a custom alias, the
          backend generates an 8-character id with <code>nanoid</code>. Set an
          expiry and the URL is auto-deleted by the cleanup worker after it
          lapses.
        </p>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">New link</span>
          <span className="panel-route">POST /api/url</span>
        </div>

        <div className="panel-body">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="url">Destination URL</label>
              <input
                id="url"
                type="text"
                placeholder="https://example.com/some/very/long/path"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="row">
              <div className="field">
                <label htmlFor="alias">
                  Custom alias <span className="hint">(optional)</span>
                </label>
                <input
                  id="alias"
                  type="text"
                  placeholder="e.g. my-launch"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="expiry">
                  Expires in days <span className="hint">(optional)</span>
                </label>
                <input
                  id="expiry"
                  type="number"
                  min="1"
                  placeholder="e.g. 7"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                />
              </div>
            </div>

            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create short URL"}
            </button>
          </form>

          {error && (
            <div className="alert alert-error" style={{ marginTop: 16 }}>
              {error}
            </div>
          )}

          {result && (
            <div className="alert alert-success" style={{ marginTop: 16 }}>
              Created. shortId: <strong>{result.shortId}</strong>
            </div>
          )}

          {shortLink && (
            <div className="short-link-result">
              <span>{shortLink}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn-ghost btn"
                  onClick={() => navigator.clipboard.writeText(shortLink)}
                >
                  Copy
                </button>
                <a
                  href={shortLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost btn"
                >
                  Visit
                </a>
                <Link
                  to="/explorer"
                  state={{ shortId: result.shortId }}
                  className="btn-ghost btn"
                >
                  View analytics
                </Link>
              </div>
            </div>
          )}
        </div>

        <JsonPeek data={rawResponse} method="POST" route="/api/url" />
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">What actually happens</span>
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
            The controller checks the request body, then{" "}
            <code>url.services.js</code> generates a <code>shortId</code> (or
            reuses your alias), rejects it if the alias is already taken, writes
            the document to MongoDB, and warms the Redis cache with the same
            record — so the very first redirect is already a cache hit instead
            of a database read.
          </p>
        </div>
      </div>
    </div>
  );
}
