/**
 * Blog blocks (Phase 2, A8): blog-index and blog-post.
 * Seeded/sample content only - no CMS yet. Self-populate from niche so the
 * gallery renders them with empty props. Token-driven, static, AA.
 */
import type { CSSProperties, ReactNode } from "react";
import { registerBlock } from "../registry";
import type { SiteBlock } from "@platform/db";
import type { RenderContext } from "../registry";
import { section, h2, eyebrow, card } from "./shared";

const chip: CSSProperties = {
  display: "inline-block",
  fontSize: "0.72rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--color-brand)",
  background: "color-mix(in srgb, var(--color-brand) 12%, var(--color-surface))",
  padding: "0.25rem 0.6rem",
  borderRadius: "999px",
};

const thumb: CSSProperties = {
  aspectRatio: "16 / 9",
  borderRadius: "calc(var(--radius) * 0.8)",
  background: "linear-gradient(135deg, var(--color-accent), var(--color-brand))",
  marginBottom: "1rem",
};

// -- Blog index --------------------------------------------------------
interface Post {
  title: string;
  excerpt: string;
  href?: string;
  category?: string;
  date?: string;
}

function defaultPosts(niche: string): Post[] {
  const n = niche.toLowerCase().replace(/s$/, "");
  return [
    { category: "Tips", title: `5 signs it is time to call a ${n} pro`, excerpt: "Spot the early warning signs before a small problem turns into an expensive one.", href: "/blog/signs-to-call-a-pro" },
    { category: "Guide", title: `What to expect from professional ${n} service`, excerpt: "A plain-English walkthrough of the process, from your first call to the final result.", href: "/blog/what-to-expect" },
    { category: "Cost", title: `How much does ${n} work cost?`, excerpt: "The honest factors that affect pricing - and how to budget for the job with confidence.", href: "/blog/cost-guide" },
  ];
}

registerBlock({
  type: "blog-index",
  variants: ["grid"],
  render: (block: SiteBlock, ctx: RenderContext) => {
    const heading = (block.props.heading as string) ?? "From our blog";
    const posts = (block.props.posts as Post[] | undefined) ?? defaultPosts(ctx.business.niche);
    return section(
      <>
        <p style={eyebrow}>Blog</p>
        <h2 style={h2}>{heading}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginTop: "1.75rem" }}>
          {posts.map((p, i) => (
            <a key={i} href={p.href ?? "#"} style={{ ...card, textDecoration: "none", display: "block" }}>
              <div style={thumb} aria-hidden />
              {p.category ? <span style={chip}>{p.category}</span> : null}
              <h3 style={{ margin: "0.75rem 0 0.4rem", fontFamily: "var(--font-display)", fontSize: "1.15rem", color: "var(--color-ink)" }}>{p.title}</h3>
              <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "0.95rem", lineHeight: 1.55 }}>{p.excerpt}</p>
              <span style={{ display: "inline-block", marginTop: "0.85rem", color: "var(--color-brand)", fontWeight: 700, fontSize: "0.9rem" }}>{"Read more ->"}</span>
            </a>
          ))}
        </div>
      </>
    );
  },
});

// -- Blog post (article scaffold) --------------------------------------
interface PostProps {
  title?: string;
  date?: string;
  author?: string;
  category?: string;
  body?: string | string[];
}

registerBlock({
  type: "blog-post",
  variants: ["default"],
  render: (block: SiteBlock, ctx: RenderContext) => {
    const p = block.props as PostProps;
    const n = ctx.business.niche.toLowerCase().replace(/s$/, "");
    const title = p.title ?? `What to expect from professional ${n} service`;
    const date = p.date ?? "January 2026";
    const author = p.author ?? ctx.business.name;
    const category = p.category ?? "Guide";
    const paragraphs: string[] = Array.isArray(p.body)
      ? p.body
      : typeof p.body === "string"
        ? [p.body]
        : [
            `Hiring a ${n} professional should be straightforward - but if you have never done it before, it helps to know what a good experience looks like. This guide walks through the process step by step.`,
            `It starts with a conversation. A reputable company will ask about your situation, answer your questions, and give you an upfront, written estimate before any work begins. You should never feel pressured into a decision.`,
            `On the day of the work, expect a crew that arrives on time, protects your property, and cleans up when they are done. Afterward, a good company stands behind its work with a clear guarantee - and is easy to reach if you ever need them again.`,
          ];
    const meta: CSSProperties = { color: "var(--color-muted)", fontSize: "0.9rem", margin: "0.6rem 0 0" };
    const para: CSSProperties = { color: "var(--color-ink)", fontSize: "1.08rem", lineHeight: 1.75, margin: "0 0 1.1rem" };
    return section(
      <article style={{ maxWidth: 720, margin: "0 auto" }}>
        <span style={chip}>{category}</span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.9rem, 4vw, 2.8rem)", lineHeight: 1.12, margin: "0.75rem 0 0", color: "var(--color-ink)" }}>{title}</h1>
        <p style={meta}>{date} - {author}</p>
        <div style={{ marginTop: "1.75rem" }}>
          {paragraphs.map((t, i) => (
            <p key={i} style={para}>{t}</p>
          ))}
        </div>
      </article>
    );
  },
});
