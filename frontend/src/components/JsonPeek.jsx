import { useState } from "react";

/**
 * Every panel in this app renders real UI on top, and tucks the exact
 * JSON the backend returned underneath — click to reveal it. The idea
 * is you always know exactly what shape of data produced what you see.
 */
export default function JsonPeek({ data, method = "GET", route = "" }) {
  const [open, setOpen] = useState(false);

  if (data === undefined) return null;

  return (
    <div className="json-peek">
      <button
        type="button"
        className={`json-peek-toggle ${open ? "open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="chev">▸</span>
        {open ? "Hide" : "View"} raw response — {method} {route}
      </button>
      {open && (
        <div className="json-peek-body">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
