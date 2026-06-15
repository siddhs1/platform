import { requireSession } from "@/lib/auth";
import { THEME_PRESETS } from "@platform/db";
import { NICHE_OPTIONS, PLAN_OPTIONS } from "@/lib/onboarding";
import { onboardClient } from "./actions";

export const dynamic = "force-dynamic";

const PLAN_LABELS: Record<string, string> = {
  basic: "Basic",
  growth: "Growth",
  scale: "Scale",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string | string[] }>;
}) {
  await requireSession();
  const sp = await searchParams;
  const err = Array.isArray(sp.err) ? sp.err[0] : sp.err;

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Onboard a client</h2>
          <p className="page-sub">
            Create a tenant, claim its niche and city, seed a starter site, and
            invite the client.
          </p>
        </div>
      </div>

      {err ? <div className="banner error">{err}</div> : null}

      <div className="card" style={{ maxWidth: "720px" }}>
        <div className="card-head">
          <h2>New client</h2>
        </div>
        <div className="card-body">
          <form action={onboardClient}>
            <div className="field">
              <label className="field-label" htmlFor="businessName">Business name</label>
              <input id="businessName" name="businessName" className="input" placeholder="Summit Roofing Co." required />
            </div>

            <div className="field-group">
              <div className="field">
                <label className="field-label" htmlFor="slug">Slug (optional)</label>
                <input id="slug" name="slug" className="input mono" placeholder="auto from name" />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="niche">Niche</label>
                <select id="niche" name="niche" className="input" defaultValue="">
                  <option value="" disabled>Choose a niche</option>
                  {NICHE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label className="field-label" htmlFor="city">City</label>
                <input id="city" name="city" className="input" placeholder="Tampa" required />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="state">State</label>
                <input id="state" name="state" className="input" placeholder="FL" maxLength={2} required />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="plan">Plan</label>
                <select id="plan" name="plan" className="input" defaultValue="growth">
                  {PLAN_OPTIONS.map((p) => (
                    <option key={p} value={p}>{PLAN_LABELS[p] ?? p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field-group">
              <div className="field">
                <label className="field-label" htmlFor="preset">Starter theme</label>
                <select id="preset" name="preset" className="input" defaultValue={THEME_PRESETS[0]?.id ?? ""}>
                  {THEME_PRESETS.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="hostname">Primary hostname (optional)</label>
                <input id="hostname" name="hostname" className="input mono" placeholder="auto: slug.localhost:3000" />
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="clientEmail">Client email to invite (optional)</label>
              <input id="clientEmail" name="clientEmail" type="email" className="input" placeholder="owner@business.com" />
            </div>

            <div className="card-foot" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
              <span className="muted small">
                One client per niche per city is enforced. The client gets a
                Clerk invite when auth is configured.
              </span>
              <button type="submit" className="btn primary">Create client</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
