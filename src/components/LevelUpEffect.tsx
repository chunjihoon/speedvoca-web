import { createPortal } from "react-dom";

type LevelUpEffectProps = {
  visible: boolean;
  level: number;
};

export default function LevelUpEffect({
  visible,
  level,
}: LevelUpEffectProps) {
  if (!visible) return null;

  return createPortal(
    <div className="levelup-overlay" aria-hidden="true">
      <div className="levelup-flash" />
      <div className="levelup-beam" />
      <div className="levelup-burst" />
      <div className="levelup-ring" />

      <div className="levelup-particles">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={`bar-${i}`} className={`particle particle-${i + 1}`} />
        ))}
      </div>

      <div className="levelup-sparkles">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={`sparkle-${i}`} className={`sparkle sparkle-${i + 1}`} />
        ))}
      </div>

      <div className="levelup-content">
        <div className="levelup-label">LEVEL UP!</div>
        <div className="levelup-level">Lv.{level}</div>
      </div>
    </div>,
    document.body
  );
}