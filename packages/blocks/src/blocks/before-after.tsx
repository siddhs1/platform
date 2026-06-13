/**
 * Before / after block — registration + layout.
 *
 * This module is server-neutral (no "use client"): it can be pulled into
 * the server renderer's module graph and the console preview's alike, so
 * the shared registry never lands in the client bundle. The interactive
 * pieces (draggable slider, toggle) are imported from
 * ./before-after-widgets, which is the "use client" boundary. React
 * inserts a client reference at that boundary, so the slider hydrates
 * while the rest of the page stays server-rendered.
 *
 *   slider       — draggable handle wipes between before & after (default)
 *   side-by-side — two labelled panels, no interaction (static, here)
 *   toggle       — a button flips between the two states
 */
import { registerBlock } from "../registry";
import type { SiteBlock } from "@platform/db";
import type { RenderContext } from "../registry";
import { section, h2, eyebrow } from "./shared";
import {
  Slider,
  Toggle,
  panelBg,
  tag,
  frame,
  type BAProps,
} from "./before-after-widgets";

registerBlock({
  type: "before-after",
  variants: ["slider", "side-by-side", "toggle"],
  render: (block: SiteBlock, _ctx: RenderContext) => {
    const p = block.props as BAProps;
    const heading = p.heading ?? "See the difference";

    let body;
    if (block.variant === "side-by-side") {
      // Static variant — pure server render, no client JS.
      body = (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginTop: "1.5rem",
          }}
        >
          <div style={{ ...frame, marginTop: 0 }}>
            <div style={panelBg(p.before, "before")} aria-hidden />
            <span style={{ ...tag, left: "0.75rem" }}>{p.beforeLabel ?? "Before"}</span>
          </div>
          <div style={{ ...frame, marginTop: 0 }}>
            <div style={panelBg(p.after, "after")} aria-hidden />
            <span style={{ ...tag, left: "0.75rem" }}>{p.afterLabel ?? "After"}</span>
          </div>
        </div>
      );
    } else if (block.variant === "toggle") {
      body = <Toggle p={p} />;
    } else {
      body = <Slider p={p} />;
    }

    return section(
      <>
        <p style={eyebrow}>Our work</p>
        <h2 style={h2}>{heading}</h2>
        {body}
      </>
    );
  },
});
