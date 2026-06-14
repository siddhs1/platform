import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import {
  getTenant,
  getConfig,
  listConfigVersions,
  listChangeRequests,
} from "@/lib/queries";
import { FONT_PAIRS } from "@platform/blocks";
import { formatDate, relativeTime, humanize } from "@/lib/format";
import { saveDraft, publishDraft, rollbackTo } from "./actions";

export const dynamic = "force-dynamic";

const RADII = ["sharp", "soft", "pill"] as const;
const BUTTON_STYLES = ["solid", "outline", "soft"] as const;
const DENSITIES = ["compact", "comfortable", "spacious"] as const;

/** Expand #abc -> #aabbcc for <input type="color">; pass 6-digit through. */
function hex6(value: string): string {
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const r = value[1];
    const g = value[2];
    const b = value[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
}

export default async function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{
    err?: string;
    saved?: string;
    published?: string;
    rolledback?: string;
  }>;
}) {
  const { tenantId } = await params;
  const sp = await searchParams;

  const session = await requireSession();
  const tenant = await getTenant(session, tenantId);
  if (!tenant) notFound();

  const [draft, published, versions, changeRequests] = await Promise.all([
    getConfig(tenant.id, "draft"),
    getConfig(tenant.id, "published"),
    listConfigVersions(tenant.id),
    listChangeRequests(tenant.id),
  ]);

  if (!draft) {
    return (
      <div className="card empty">
        <h2>No draft to edit</h2>
        <p className="muted">This tenant has no draft configuration yet.</p>
      </div>
    );
  }

  const t = draft.tokens;
  const fontPairs = Object.keys(FONT_PAIRS);
  const previewSrc = `/preview/${tenant.id}?v=${draft.updatedAt.getTime()}`;

  const colorFields = [
    { name: "brand", label: "Brand", value: t.colors.brand },
    { name: "accent", label: "Accent", value: t.colors.accent },
    { name: "ink", label: "Ink (text)", value: t.colors.ink },
    { name: "surface", label: "Surface (bg)", value: t.colors.surface },
    { name: "muted", label: "Muted", value: t.colors.muted },
  ];

  return (
    <>
      {sp.err ? <div className="banner error">{sp.err}</div> : null}
      {sp.saved ? <div className="banner ok">Draft saved.</div> : null}
      {sp.published ? (
        <div className="banner ok">Published v{sp.published} - now live.</div>
      ) : null}
      {sp.rolledback ? (
        <div className="banner ok">
          Rolled back to v{sp.rolledback} (re-published as v{sp.published}).
        </div>
      ) : null}

      <div className="editor-grid">
        <div className="editor-controls">
          {/* Design tokens */}
          <form action={saveDraft} className="card">
            <input type="hidden" name="tenantId" value={tenant.id} />
            <div className="card-head">
              <h2>Design tokens</h2>
              <span className="muted small">draft</span>
            </div>
            <div className="card-body">
              <div className="field-group">
                {colorFields.map((c) => (
                  <div key={c.name} className="field color-field">
                    <label className="field-label" htmlFor={`color-${c.name}`}>
                      {c.label}
                    </label>
                    <span className="color-row">
                      <input
                        id={`color-${c.name}`}
                        type="color"
                        name={c.name}
                        defaultValue={hex6(c.value)}
                        className="color-input"
                      />
                      <span className="mono small">{c.value}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="field">
                <label className="field-label" htmlFor="fontPair">
                  Font pairing
                </label>
                <select
                  id="fontPair"
                  name="fontPair"
                  defaultValue={t.fontPair}
                  className="input"
                >
                  {fontPairs.map((fp) => (
                    <option key={fp} value={fp}>
                      {fp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-row">
                <div className="field">
                  <label className="field-label" htmlFor="radius">
                    Corners
                  </label>
                  <select
                    id="radius"
                    name="radius"
                    defaultValue={t.radius}
                    className="input"
                  >
                    {RADII.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="buttonStyle">
                    Buttons
                  </label>
                  <select
                    id="buttonStyle"
                    name="buttonStyle"
                    defaultValue={t.buttonStyle}
                    className="input"
                  >
                    {BUTTON_STYLES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="density">
                    Density
                  </label>
                  <select
                    id="density"
                    name="density"
                    defaultValue={t.density}
                    className="input"
                  >
                    {DENSITIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="customCss">
                  Custom CSS <span className="muted">(max 4000 chars)</span>
                </label>
                <textarea
                  id="customCss"
                  name="customCss"
                  defaultValue={draft.customCss}
                  className="input mono"
                  rows={6}
                  spellCheck={false}
                />
              </div>
            </div>
            <div className="card-foot">
              <button type="submit" className="btn primary">
                Save draft
              </button>
              <span className="muted small">
                Draft v{draft.version} - updated {relativeTime(draft.updatedAt)}
              </span>
            </div>
          </form>

          {/* Publish */}
          <div className="card">
            <div className="card-head">
              <h2>Publish</h2>
            </div>
            <div className="card-body">
              <p className="small">
                {published ? (
                  <>
                    Live: <strong>v{published.version}</strong>
                    {published.publishedAt
                      ? ` - ${formatDate(published.publishedAt)}`
                      : ""}
                  </>
                ) : (
                  <span className="muted">Not published yet.</span>
                )}
              </p>
              <p className="muted small">
                Publishing copies the current draft to the live site and records
                a new version you can roll back to.
              </p>
            </div>
            <div className="card-foot">
              <form action={publishDraft}>
                <input type="hidden" name="tenantId" value={tenant.id} />
                <button type="submit" className="btn primary">
                  Publish draft
                </button>
              </form>
            </div>
          </div>

          {/* Version history */}
          <div className="card">
            <div className="card-head">
              <h2>Version history</h2>
              <span className="muted small">{versions.length}</span>
            </div>
            {versions.length === 0 ? (
              <div className="card-body">
                <p className="muted small">No published versions yet.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Published</th>
                    <th>By</th>
                    <th className="num"></th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((v) => {
                    const isLive = published
                      ? v.version === published.version
                      : false;
                    return (
                      <tr key={v.version}>
                        <td>
                          v{v.version}
                          {isLive ? (
                            <span
                              className="badge status-live"
                              style={{ marginLeft: "8px" }}
                            >
                              live
                            </span>
                          ) : null}
                        </td>
                        <td className="muted">{relativeTime(v.publishedAt)}</td>
                        <td className="muted small">{v.publishedBy ?? "-"}</td>
                        <td className="num">
                          {isLive ? null : (
                            <form action={rollbackTo}>
                              <input
                                type="hidden"
                                name="tenantId"
                                value={tenant.id}
                              />
                              <input
                                type="hidden"
                                name="version"
                                value={v.version}
                              />
                              <button type="submit" className="btn">
                                Roll back
                              </button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Change requests */}
          <div className="card">
            <div className="card-head">
              <h2>Change requests</h2>
              <span className="muted small">{changeRequests.length}</span>
            </div>
            {changeRequests.length === 0 ? (
              <div className="card-body">
                <p className="muted small">No change requests.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Status</th>
                    <th>Opened</th>
                  </tr>
                </thead>
                <tbody>
                  {changeRequests.map((cr) => (
                    <tr key={cr.id}>
                      <td>{cr.description}</td>
                      <td>
                        <span className="badge">{humanize(cr.status)}</span>
                      </td>
                      <td className="muted">{relativeTime(cr.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Live preview */}
        <div className="editor-preview">
          <div className="preview-bar">
            <span className="small muted">Live preview - draft</span>
            <a
              className="ghost-btn small"
              href={previewSrc}
              target="_blank"
              rel="noreferrer"
            >
              Open
            </a>
          </div>
          <iframe className="preview-frame" src={previewSrc} title="Draft preview" />
        </div>
      </div>
    </>
  );
}
