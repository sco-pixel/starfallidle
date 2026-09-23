import { useState } from "react";
import { getCombatSprite } from "@/lib/combat-sprites";
import "./CombatSprite.css";

type CombatSpriteProps = {
  id: string;
  label: string;
  className?: string;
  decorative?: boolean;
  loading?: "eager" | "lazy";
};

/** A transparent ship cutout, shared by the battle stage and contact roster. */
export function CombatSprite({ id, label, className = "", decorative = false, loading = "lazy" }: CombatSpriteProps) {
  const sprite = getCombatSprite(id);
  const [failedSrc, setFailedSrc] = useState<string>();
  const isPlayer = id === "aethelgard";

  return (
    <span
      className={`combat-sprite ${isPlayer ? "combat-sprite--player" : "combat-sprite--enemy"} ${className}`.trim()}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
    >
      {sprite && failedSrc !== sprite.src ? (
        <img
          key={sprite.src}
          className="combat-sprite__atlas"
          src={sprite.src}
          alt=""
          draggable={false}
          loading={loading}
          decoding="async"
          style={{ left: `${sprite.column * -100}%`, top: `${sprite.row * -100}%` }}
          onError={() => setFailedSrc(sprite.src)}
        />
      ) : (
        <span className="combat-sprite__fallback" aria-hidden="true" />
      )}
    </span>
  );
}
