import { requirePortal } from "@/lib/portal";
import { SignOutButton } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/clerk";
import { listMembers, type MemberRow } from "@/lib/portal-team";
import {
  saveNotifications,
  sendTestNotification,
  inviteTeammate,
} from "./actions";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  owner: "Operator",
  staff: "Team",
  client_admin: "Admin",
  client_staff: "Staff",
};

function memberName(m: MemberRow): string {
  return m.email;
}

export default async function PortalSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string | string[];
    invited?: string | string[];
    tested?: string | string[];
    err?: string | string[];
  }>;
}) {
  const ctx = await requirePortal();
  const t = ctx.tenant;
  const sp = await searchParams;
  const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
  const saved = first(sp.saved) === "1";
  const invited = first(sp.invited) === "1";
  const tested = first(sp.tested) === "1";
  const err = first(sp.err);

  const members = await listMembers(t.id);

  return (
    <>
      <div className="p-greet">
        <div>
          <h1>Settings</h1>
          <p>Notifications, your team, and your data.</p>
        </div>
      </div>

      {saved ? <div className="p-banner ok">Notification settings saved.</div> : null}
      {tested ? (
        <div className="p-banner ok">
          Test sent to your saved recipients. Channels without provider setup
          are skipped.
        </div>
      ) : null}
      {invited ? <div className="p-banner ok">Invitation sent.</div> : null}
      {err ? <div className="p-banner warn">{err}</div> : null}

      {/* notifications */}
      <div className="p-panel" style={{ marginBottom: "16px" }}>
        <div className="p-panel-head">
          <h2>Lead notifications</h2>
        </div>
        <form action={saveNotifications} className="p-form">
          <div className="p-form-grid2">
            <div className="p-form-row">
              <label className="p-field-lbl" htmlFor="notifyEmail">Email for alerts</label>
              <input id="notifyEmail" name="notifyEmail" type="email" className="p-input" defaultValue={t.notifyEmail ?? ""} placeholder="you@business.com" />
            </div>
            <div className="p-form-row">
              <label className="p-field-lbl" htmlFor="notifyPhone">Phone for text alerts</label>
              <input id="notifyPhone" name="notifyPhone" className="p-input" defaultValue={t.notifyPhone ?? ""} placeholder="(555) 123-4567" />
            </div>
          </div>
          <div className="p-toggles">
            <label className="p-checkbox">
              <input type="checkbox" name="emailEnabled" defaultChecked={t.notifyEmailEnabled} />
              <span>Email me on a new lead</span>
            </label>
            <label className="p-checkbox">
              <input type="checkbox" name="smsEnabled" defaultChecked={t.notifySmsEnabled} />
              <span>Text me on a new lead</span>
            </label>
          </div>
          <div className="p-form-foot">
            <span className="p-muted p-small">
              Alerts fire the moment a call or form lead arrives.
            </span>
            <button type="submit" className="p-btn primary">Save settings</button>
          </div>
        </form>
        <div className="p-subfoot">
          <form action={sendTestNotification}>
            <button type="submit" className="p-btn">Send a test</button>
          </form>
          <span className="p-muted p-small">Uses your saved recipients above.</span>
        </div>
      </div>

      {/* team */}
      <div className="p-panel" style={{ marginBottom: "16px" }}>
        <div className="p-panel-head">
          <h2>Your team</h2>
        </div>
        {members.length === 0 ? (
          <div className="p-leads-empty">
            <p className="p-muted" style={{ margin: 0 }}>
              No teammates yet. Invite someone below to give them access.
            </p>
          </div>
        ) : (
          <ul className="p-memberlist">
            {members.map((m) => (
              <li className="p-memberrow" key={m.id}>
                <span className="p-mem-name">{memberName(m)}</span>
                <span className="p-badge plan">{ROLE_LABELS[m.role] ?? m.role}</span>
                <span className={`p-badge ${m.status === "active" ? "active" : "none"}`}>
                  {m.status === "active" ? "Active" : "Invited"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <form action={inviteTeammate} className="p-form p-invite">
          <div className="p-form-row">
            <input name="email" type="email" className="p-input" placeholder="teammate@business.com" aria-label="Teammate email" />
          </div>
          <select name="role" className="p-input p-select" defaultValue="client_staff" aria-label="Role">
            <option value="client_staff">Staff</option>
            <option value="client_admin">Admin</option>
          </select>
          <button type="submit" className="p-btn primary">Invite</button>
        </form>
      </div>

      {/* account & data */}
      <div className="p-panel">
        <div className="p-panel-head">
          <h2>Account and data</h2>
        </div>
        <div className="p-detail-body">
          <div className="p-field">
            <span className="p-field-lbl">Business</span>
            <span className="p-field-val">
              {t.businessName}
              <span className="p-muted p-small">
                {t.niche} {"\u00b7"} {t.city}, {t.state}
              </span>
            </span>
          </div>
          <div className="p-field">
            <span className="p-field-lbl">Export your leads</span>
            <span className="p-field-val">
              <a className="p-btn" href="/portal/settings/export">Download CSV</a>
              <span className="p-muted p-small">All of your leads as a spreadsheet.</span>
            </span>
          </div>
          {clerkEnabled ? (
            <div className="p-field">
              <span className="p-field-lbl">Session</span>
              <span className="p-field-val">
                <SignOutButton>
                  <button type="button" className="p-btn">Sign out</button>
                </SignOutButton>
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
