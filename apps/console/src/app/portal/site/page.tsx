import { requirePortal } from "@/lib/portal";
import { getConfig } from "@/lib/queries";
import { matchPresetId } from "@/lib/portal-site";
import { THEME_PRESETS } from "@platform/db";
import type { BusinessProfile } from "@platform/db";
import { saveBusinessDetails, applyTheme } from "./actions";

export const dynamic = "force-dynamic";

function socialHref(profile: BusinessProfile, platform: string): string {
  return profile.socials?.find((s) => s.platform === platform)?.href ?? "";
}

export default async function PortalSitePage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string | string[];
    published?: string | string[];
    err?: string | string[];
  }>;
}) {
  const ctx = await requirePortal();
  const sp = await searchParams;
  const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
  const saved = first(sp.saved) === "1";
  const published = first(sp.published);
  const err = first(sp.err);

  const draft = await getConfig(ctx.tenant.id, "draft");
  const activePreset = draft ? matchPresetId(draft.tokens) : null;
  const profile: BusinessProfile = ctx.tenant.businessProfile ?? {};
  const cacheBust = draft?.updatedAt ? new Date(draft.updatedAt).getTime() : 0;

  return (
    <>
      <div className="p-greet">
        <div>
          <h1>Your site</h1>
          <p>Update your details and choose a look. Changes go live for you.</p>
        </div>
      </div>

      {saved ? <div className="p-banner ok">Your business details were saved.</div> : null}
      {published ? (
        <div className="p-banner ok">
          Your new look is live (version {published}).
        </div>
      ) : null}
      {err ? <div className="p-banner warn">{err}</div> : null}

      <div className="p-site-cols">
        <div className="p-site-main">
          {/* theme */}
          <div className="p-panel">
            <div className="p-panel-head">
              <h2>Theme</h2>
            </div>
            <form action={applyTheme} className="p-form">
              <div className="p-themegrid">
                {THEME_PRESETS.map((preset) => {
                  const isActive = activePreset === preset.id;
                  return (
                    <label
                      key={preset.id}
                      className={isActive ? "p-themecard is-active" : "p-themecard"}
                    >
                      <input
                        type="radio"
                        name="preset"
                        value={preset.id}
                        defaultChecked={isActive}
                      />
                      <span className="p-theme-swatches" aria-hidden="true">
                        <span style={{ background: preset.tokens.colors.brand }} />
                        <span style={{ background: preset.tokens.colors.accent }} />
                        <span style={{ background: preset.tokens.colors.ink }} />
                      </span>
                      <span className="p-theme-text">
                        <span className="p-theme-name">
                          {preset.label}
                          {isActive ? <span className="p-theme-cur">Current</span> : null}
                        </span>
                        <span className="p-theme-desc">{preset.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <div className="p-form-foot">
                <span className="p-muted p-small">
                  Applying a theme publishes it to your live site right away.
                </span>
                <button type="submit" className="p-btn primary">
                  Apply theme
                </button>
              </div>
            </form>
          </div>

          {/* business details */}
          <div className="p-panel">
            <div className="p-panel-head">
              <h2>Business details</h2>
            </div>
            <form action={saveBusinessDetails} className="p-form">
              <div className="p-form-row">
                <label className="p-field-lbl" htmlFor="tagline">Tagline</label>
                <input id="tagline" name="tagline" className="p-input" defaultValue={profile.tagline ?? ""} placeholder="e.g. Trusted local roofing since 1998" />
              </div>
              <div className="p-form-grid2">
                <div className="p-form-row">
                  <label className="p-field-lbl" htmlFor="phone">Phone</label>
                  <input id="phone" name="phone" className="p-input" defaultValue={profile.phone ?? ""} placeholder="(555) 123-4567" />
                </div>
                <div className="p-form-row">
                  <label className="p-field-lbl" htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" className="p-input" defaultValue={profile.email ?? ""} placeholder="hello@yourbusiness.com" />
                </div>
              </div>
              <div className="p-form-grid2">
                <div className="p-form-row">
                  <label className="p-field-lbl" htmlFor="licenseNumber">License number</label>
                  <input id="licenseNumber" name="licenseNumber" className="p-input" defaultValue={profile.licenseNumber ?? ""} placeholder="Optional" />
                </div>
                <div className="p-form-row p-check-row">
                  <label className="p-checkbox">
                    <input type="checkbox" name="insured" defaultChecked={profile.insured === true} />
                    <span>Show licensed and insured</span>
                  </label>
                </div>
              </div>

              <div className="p-form-row">
                <span className="p-field-lbl">Social links</span>
                <div className="p-form-grid2">
                  <input name="social_facebook" className="p-input" defaultValue={socialHref(profile, "facebook")} placeholder="Facebook URL" aria-label="Facebook URL" />
                  <input name="social_instagram" className="p-input" defaultValue={socialHref(profile, "instagram")} placeholder="Instagram URL" aria-label="Instagram URL" />
                  <input name="social_x" className="p-input" defaultValue={socialHref(profile, "x")} placeholder="X (Twitter) URL" aria-label="X URL" />
                  <input name="social_youtube" className="p-input" defaultValue={socialHref(profile, "youtube")} placeholder="YouTube URL" aria-label="YouTube URL" />
                </div>
              </div>

              <div className="p-form-foot">
                <span className="p-muted p-small">
                  Hours and service areas are edited via a request for now.
                </span>
                <button type="submit" className="p-btn primary">
                  Save details
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* live preview */}
        <div className="p-panel p-preview-panel">
          <div className="p-panel-head">
            <h2>Preview</h2>
            <a className="p-link" href="/portal-preview" target="_blank" rel="noopener noreferrer">
              Open in new tab
            </a>
          </div>
          <div className="p-preview-frame">
            {draft ? (
              <iframe
                title="Site preview"
                src={`/portal-preview?v=${cacheBust}`}
                loading="lazy"
              />
            ) : (
              <div className="p-leads-empty">
                <p className="p-muted" style={{ margin: 0 }}>
                  Your site is not set up yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
