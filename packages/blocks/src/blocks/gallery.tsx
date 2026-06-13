/**
 * Gallery block. Project / portfolio imagery — "here's our work."
 *   masonry   — CSS columns, varied heights for an organic wall (default)
 *   grid      — uniform square tiles
 *   filmstrip — horizontal scroll-snap rail of wide frames
 *
 * props.images: { src?, alt?, caption? }[]. With no src we render captioned
 * gradient placeholders, so the block previews before a VA adds photos.
 * Subtle zoom-on-hover, disabled under reduced motion.
 */
import type { CSSProperties } from "react";
import { registerBlock } from "../registry";
import type { SiteBlock } from "@platform/db";
import type { RenderContext } from "../registry";
import { section, h2, eyebrow } from "./shared";

interface GalleryImage {
  src?: string;
  alt?: string;
  caption?: string;
}

function defaults(n: number): GalleryImage[] {
  const captions = [
    "Recent install",
    "Before & after",
    "On the job",
    "Finished project",
    "Detail work",
    "Happy customer",
    "Quality materials",
    "Our crew",
  ];
  return Array.from({ length: n }, (_, i) => ({ caption: captions[i % captions.length] }));
}

function tile(img: GalleryImage, i: number): CSSProperties {
  // Rotate through a few brand-derived gradients for placeholders.
  const grads = [
    "linear-gradient(135deg, var(--color-brand), var(--color-ink))",
    "linear-gradient(135deg, var(--color-accent), var(--color-brand))",
    "linear-gradient(135deg, color-mix(in srgb, var(--color-brand) 60%, var(--color-accent)), var(--color-ink))",
  ];
  return img.src
    ? {
        backgroundImage: `url(${JSON.stringify(img.src)})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { background: grads[i % grads.length]! };
}

const figureStyle: CSSProperties = {
  position: "relative",
  margin: 0,
  borderRadius: "var(--radius)",
  overflow: "hidden",
};

const captionStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  padding: "0.6rem 0.8rem",
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "var(--color-surface)",
  background: "linear-gradient(transparent, color-mix(in srgb, var(--color-ink) 75%, transparent))",
};

const zoomId = "gal-zoom";
const zoomCss = `
.${zoomId} { display:block; width:100%; }
@media (prefers-reduced-motion: no-preference) {
  .${zoomId} { transition: transform .35s ease; }
  .${zoomId}:hover { transform: scale(1.05); }
}`;

registerBlock({
  type: "gallery",
  variants: ["masonry", "grid", "filmstrip"],
  render: (block: SiteBlock, _ctx: RenderContext) => {
    const heading = (block.props.heading as string) ?? "Our work";
    const count = (block.props.count as number | undefined) ?? 6;
    const images = (block.props.images as GalleryImage[] | undefined) ?? defaults(count);

    if (block.variant === "grid") {
      return section(
        <>
          <p style={eyebrow}>Gallery</p>
          <h2 style={h2}>{heading}</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
              marginTop: "1.5rem",
            }}
          >
            {images.map((img, i) => (
              <figure key={i} style={{ ...figureStyle, aspectRatio: "1 / 1" }}>
                <div className={zoomId} style={{ ...tile(img, i), position: "absolute", inset: 0 }} aria-label={img.alt ?? img.caption ?? "Gallery image"} role="img" />
                {img.caption ? <figcaption style={captionStyle}>{img.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
          <style dangerouslySetInnerHTML={{ __html: zoomCss }} />
        </>
      );
    }

    if (block.variant === "filmstrip") {
      const railId = "gal-rail";
      const railCss = `
.${railId}::-webkit-scrollbar { height: 8px; }
.${railId}::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--color-muted) 40%, transparent); border-radius:9999px; }
@media (prefers-reduced-motion: no-preference) { .${railId} { scroll-behavior:smooth; } }`;
      return section(
        <>
          <p style={eyebrow}>Gallery</p>
          <h2 style={h2}>{heading}</h2>
          <div
            className={railId}
            style={{
              display: "grid",
              gridAutoFlow: "column",
              gridAutoColumns: "minmax(300px, 420px)",
              gap: "1rem",
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              paddingBottom: "1rem",
              marginTop: "1.5rem",
            }}
          >
            {images.map((img, i) => (
              <figure key={i} style={{ ...figureStyle, aspectRatio: "16 / 10", scrollSnapAlign: "start" }}>
                <div style={{ ...tile(img, i), position: "absolute", inset: 0 }} aria-label={img.alt ?? img.caption ?? "Gallery image"} role="img" />
                {img.caption ? <figcaption style={captionStyle}>{img.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
          <style dangerouslySetInnerHTML={{ __html: railCss }} />
        </>
      );
    }

    // default: masonry via CSS columns
    return section(
      <>
        <p style={eyebrow}>Gallery</p>
        <h2 style={h2}>{heading}</h2>
        <div
          style={{
            columnCount: 3,
            columnGap: "1rem",
            marginTop: "1.5rem",
          }}
        >
          {images.map((img, i) => (
            <figure
              key={i}
              style={{
                ...figureStyle,
                breakInside: "avoid",
                marginBottom: "1rem",
                // vary height for the masonry rhythm
                aspectRatio: i % 3 === 0 ? "3 / 4" : i % 3 === 1 ? "1 / 1" : "4 / 3",
              }}
            >
              <div className={zoomId} style={{ ...tile(img, i), position: "absolute", inset: 0 }} aria-label={img.alt ?? img.caption ?? "Gallery image"} role="img" />
              {img.caption ? <figcaption style={captionStyle}>{img.caption}</figcaption> : null}
            </figure>
          ))}
        </div>
        <style dangerouslySetInnerHTML={{ __html: zoomCss }} />
      </>
    );
  },
});
