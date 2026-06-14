/**
 * Page blocks (Phase 2): contact (A10), financing (A12), legal (A13).
 * Self-populate from niche/context; token-driven; AA. The contact form posts
 * to the same /api/lead endpoint; NAP/hours come from props when a page
 * template supplies them (it has the business profile), else sensible
 * generic defaults so the gallery still renders. Legal/financing copy is
 * placeholder scaffolding - real copy is an owner task (SETUP_CHECKLIST).
 */
import type { CSSProperties, ReactNode } from "react";
import { registerBlock } from "../registry";
import type { SiteBlock } from "@platform/db";
import type { RenderContext } from "../registry";
import { section, h2, eyebrow, card, btn } from "./shared";

const field: CSSProperties = {
  padding: "0.75rem 0.9rem",
  borderRadius: "var(--radius)",
  border: "1px solid color-mix(in srgb, var(--color-muted) 35%, transparent)",
  fontFamily: "var(--font-body)",
  fontSize: "1rem",
  width: "100%",
  boxSizing: "border-box",
};

type IcoName = "pin" | "phone" | "clock" | "mail";
const ICO: Record<IcoName, string> = {
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
};
function Ico({ name, size = 16, color = "var(--color-brand)" }: { name: IcoName; size?: number; color?: string }): ReactNode {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden dangerouslySetInnerHTML={{ __html: ICO[name] }} />
  );
}

// -- Contact: form + map placeholder + NAP/hours -----------------------
interface Hours {
  label: string;
  value: string;
}
const HOURS_DEFAULT: Hours[] = [
  { label: "Mon-Fri", value: "8 AM - 6 PM" },
  { label: "Sat", value: "9 AM - 2 PM" },
  { label: "Sun", value: "Closed" },
];

registerBlock({
  type: "contact",
  variants: ["split"],
  render: (block: SiteBlock, ctx: RenderContext) => {
    const heading = (block.props.heading as string) ?? "Get in touch";
    const phone = block.props.phone as string | undefined;
    const email = block.props.email as string | undefined;
    const address = (block.props.address as string | undefined) ?? `${ctx.business.city}, ${ctx.business.state}`;
    const hours = (block.props.hours as Hours[] | undefined) ?? HOURS_DEFAULT;
    const row: CSSProperties = { display: "flex", gap: "0.65rem", alignItems: "flex-start", color: "var(--color-ink)" };
    return section(
      <>
        <p style={eyebrow}>Contact</p>
        <h2 style={h2}>{heading}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", marginTop: "1.5rem" }}>
          <div id="contact">
            <form method="post" action={`/api/lead?tenant=${ctx.business.name}`} style={{ display: "grid", gap: "0.8rem", maxWidth: 480 }}>
              <input name="name" aria-label="Your name" placeholder="Your name" required style={field} />
              <input name="phone" aria-label="Phone" placeholder="Phone" required style={field} />
              <input name="email" type="email" aria-label="Email" placeholder="Email" style={field} />
              <textarea name="message" aria-label="How can we help?" placeholder="How can we help?" rows={4} style={field} />
              <button type="submit" style={btn}>Request a quote</button>
            </form>
          </div>
          <div>
            <div style={{ aspectRatio: "4 / 3", borderRadius: "var(--radius)", background: "color-mix(in srgb, var(--color-muted) 14%, var(--color-surface))", border: "1px solid color-mix(in srgb, var(--color-muted) 22%, transparent)", display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden>
              <Ico name="pin" size={36} color="color-mix(in srgb, var(--color-muted) 70%, transparent)" />
            </div>
            <div style={{ display: "grid", gap: "0.7rem", marginTop: "1.1rem" }}>
              <div style={row}><span style={{ flex: "none", marginTop: "0.1rem" }}><Ico name="pin" /></span>{address}</div>
              {phone ? <div style={row}><span style={{ flex: "none", marginTop: "0.1rem" }}><Ico name="phone" /></span><a href={`tel:${phone.replace(/[^\d+]/g, "")}`} style={{ color: "var(--color-ink)", textDecoration: "none" }}>{phone}</a></div> : null}
              {email ? <div style={row}><span style={{ flex: "none", marginTop: "0.1rem" }}><Ico name="mail" /></span><a href={`mailto:${email}`} style={{ color: "var(--color-ink)", textDecoration: "none" }}>{email}</a></div> : null}
              <div style={{ ...row, alignItems: "flex-start" }}>
                <span style={{ flex: "none", marginTop: "0.1rem" }}><Ico name="clock" /></span>
                <div>
                  {hours.map((h, i) => (
                    <div key={i} style={{ fontSize: "0.95rem" }}>
                      <strong style={{ fontWeight: 600 }}>{h.label}</strong> - {h.value}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  },
});

// -- Financing: options/info (calculator is L4/[P2]) -------------------
interface FinOption {
  title: string;
  body: string;
}
const FIN_DEFAULTS: FinOption[] = [
  { title: "0% APR plans", body: "Qualified buyers can spread the cost over 12-18 months, interest-free." },
  { title: "Low monthly payments", body: "Get the work done now and pay over time with a plan that fits your budget." },
  { title: "Fast approval", body: "Apply in minutes with a quick, no-obligation decision - no hard credit hit to check." },
];

registerBlock({
  type: "financing",
  variants: ["cards"],
  render: (block: SiteBlock) => {
    const heading = (block.props.heading as string) ?? "Flexible financing options";
    const options = (block.props.options as FinOption[] | undefined) ?? FIN_DEFAULTS;
    return section(
      <>
        <p style={eyebrow}>Financing</p>
        <h2 style={h2}>{heading}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginTop: "1.75rem" }}>
          {options.map((o, i) => (
            <div key={i} style={card}>
              <h3 style={{ margin: "0 0 0.4rem", fontFamily: "var(--font-display)", fontSize: "1.15rem", color: "var(--color-ink)" }}>{o.title}</h3>
              <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "0.95rem", lineHeight: 1.55 }}>{o.body}</p>
            </div>
          ))}
        </div>
        <p style={{ color: "var(--color-muted)", fontSize: "0.85rem", marginTop: "1.25rem" }}>
          Financing subject to credit approval. Terms and availability vary - ask us for details.
        </p>
      </>
    );
  },
});

// -- Legal: long-form prose template (privacy/terms/accessibility) -----
registerBlock({
  type: "legal",
  variants: ["prose"],
  render: (block: SiteBlock, ctx: RenderContext) => {
    const heading = (block.props.heading as string) ?? "Privacy Policy";
    const updated = (block.props.updated as string) ?? "January 2026";
    const propBody = block.props.body as string | string[] | undefined;
    const paragraphs: string[] = Array.isArray(propBody)
      ? propBody
      : typeof propBody === "string"
        ? [propBody]
        : [
            `This page explains how ${ctx.business.name} collects, uses, and protects your information. By using this website, you agree to the practices described here.`,
            `We collect only the information you choose to provide - such as your name, phone number, and email when you request a quote - along with basic, anonymous analytics about how the site is used. We do not sell your personal information to third parties.`,
            `You may request a copy of the information we hold about you, or ask us to delete it, at any time. If you have questions about this policy or your data, please reach out using the details on our contact page.`,
          ];
    const para: CSSProperties = { color: "var(--color-ink)", fontSize: "1.05rem", lineHeight: 1.75, margin: "0 0 1.1rem" };
    return section(
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.9rem, 4vw, 2.6rem)", margin: 0, color: "var(--color-ink)" }}>{heading}</h1>
        <p style={{ color: "var(--color-muted)", fontSize: "0.9rem", margin: "0.5rem 0 1.75rem" }}>Last updated {updated}</p>
        {paragraphs.map((t, i) => (
          <p key={i} style={para}>{t}</p>
        ))}
      </div>
    );
  },
});
