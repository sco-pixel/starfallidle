import { useEffect, useState, type CSSProperties } from "react";
import { getSprite, type SpriteKind } from "@/lib/sprites";
import "./Sprite.css";

type SpriteProps = {
  kind: SpriteKind;
  /** The game ID used in the generated asset filename. */
  id?: string;
  label: string;
  className?: string;
  decorative?: boolean;
};

/**
 * Renders a generated sprite when it is present and an accessible pixel tile
 * when it is not. This means new assets can ship progressively with no broken
 * image chrome and no coupling to game state or progression.
 */
export function Sprite({ kind, id, label, className = "", decorative = false }: SpriteProps) {
  const sprite = getSprite(kind, id);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [sprite.src]);

  return (
    <span
      className={`sprite sprite-${sprite.accent} ${className}`.trim()}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : "img"}
    >
      {sprite.atlas ? (
        <span
          className="sprite-atlas"
          aria-hidden="true"
          style={{ "--sprite-column": sprite.atlas.column, "--sprite-row": sprite.atlas.row, backgroundImage: `url(${sprite.src})` } as CSSProperties}
        />
      ) : failed ? (
        <span className="sprite-fallback" aria-hidden="true">{sprite.fallback}</span>
      ) : (
        <img src={sprite.src} alt="" loading="lazy" onError={() => setFailed(true)} />
      )}
    </span>
  );
}
