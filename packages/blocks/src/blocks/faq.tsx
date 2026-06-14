/**
 * FAQ block. Doubles as SEO surface: also emits FAQPage structured data
 * so questions can win rich results.
 *   accordion  - expandable rows using native <details> (default)
 *   two-column - Q&A laid out in two columns, all open
 *   list       - simple stacked Q (bold) + A
 *
 * props.items: { q, a }[]. Falls back to a generic local-service FAQ set.
 * Accordion uses <details>/<summary> so it works without client JS and
 * the open/close is native (animates the marker; content reveal is instant
 * which is correct under reduced-motion too).
 */
import type { CSSProperties } from "react";
import { registerBlock } from "../registry";
import type { SiteBlock } from "@platform/db";
import type { RenderContext } from "../registry";
import { section, h2, eyebrow } from "./shared";

interface QA {
  q: string;
  a: string;
}

function defaultItems(niche: string, city: string): QA[] {
  return [
    { q: "Are you licensed and insured?", a: "Yes - fully licensed and insured. We'll share documentation on request before any work begins." },
    { q: `Do you serve all of ${city}?`, a: `We cover ${city} and the surrounding area. Call and we'll confirm we reach you.` },
    { q: "Do you offer free estimates?", a: "Most jobs start with a free, no-obligation estimate so you know the cost up front." },
    { q: "How fast can you come out?", a: "Same-day or next-day for most calls, and we prioritize true emergencies." },
    { q: "What payment methods do you accept?", a: "Cash, card, and major digital payments. Financing is available on larger jobs." },
  ];
}

const qStyle: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "1.05rem",
  color: "var(--color-ink)",
  margin: 0,
};

const aStyle: CSSProperties = {
  color: "var(--color-muted)",
  margin: "0.5rem 0 0",
  lineHeight: 1.55,
};

function FaqJsonLd({ items }: { items: QA[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

registerBlock({
  type: "faq",
  variants: ["accordion", "two-column", "list"],
  render: (block: SiteBlock, ctx: RenderContext) => {
    const heading = (block.props.heading as string) ?? "Frequently asked questions";
    const items =
      (block.props.items as QA[] | undefined) ??
      defaultItems(ctx.business.niche, ctx.business.city);

    if (block.variant === "two-column") {
      return section(
        <>
          <p style={eyebrow}>Questions</p>
          <h2 style={h2}>{heading}</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.75rem 2.5rem",
              marginTop: "1.5rem",
            }}
          >
            {items.map((it) => (
              <div key={it.q}>
                <p style={qStyle}>{it.q}</p>
                <p style={aStyle}>{it.a}</p>
              </div>
            ))}
          </div>
          <FaqJsonLd items={items} />
        </>
      );
    }

    if (block.variant === "list") {
      return section(
        <>
          <p style={eyebrow}>Questions</p>
          <h2 style={h2}>{heading}</h2>
          <div style={{ display: "grid", gap: "1.5rem", marginTop: "1.5rem", maxWidth: 760 }}>
            {items.map((it) => (
              <div key={it.q}>
                <p style={qStyle}>{it.q}</p>
                <p style={aStyle}>{it.a}</p>
              </div>
            ))}
          </div>
          <FaqJsonLd items={items} />
        </>
      );
    }

    // default: accordion
    const accId = "faq-acc";
    const accCss = `
.${accId} { border:1px solid color-mix(in srgb, var(--color-muted) 20%, transparent);
  border-radius: var(--radius); background: var(--color-surface); overflow:hidden; }
.${accId} + .${accId} { margin-top: 0.6rem; }
.${accId} > summary { list-style:none; cursor:pointer; padding:1.1rem 1.25rem;
  display:flex; justify-content:space-between; align-items:center; gap:1rem; }
.${accId} > summary::-webkit-details-marker { display:none; }
.${accId} > summary::after { content:"+"; font-size:1.4rem; line-height:1;
  color: var(--color-brand); }
.${accId}[open] > summary::after { content:"\\2212"; }
.${accId} > div { padding: 0 1.25rem 1.2rem; }
@media (prefers-reduced-motion: no-preference) {
  .${accId} > summary::after { transition: transform .18s ease; }
}`;
    return section(
      <>
        <p style={eyebrow}>Questions</p>
        <h2 style={h2}>{heading}</h2>
        <div style={{ marginTop: "1.5rem", maxWidth: 820 }}>
          {items.map((it, i) => (
            <details key={it.q} className={accId} open={i === 0}>
              <summary>
                <span style={qStyle}>{it.q}</span>
              </summary>
              <div>
                <p style={{ ...aStyle, marginTop: 0 }}>{it.a}</p>
              </div>
            </details>
          ))}
        </div>
        <style dangerouslySetInnerHTML={{ __html: accCss }} />
        <FaqJsonLd items={items} />
      </>
    );
  },
});
