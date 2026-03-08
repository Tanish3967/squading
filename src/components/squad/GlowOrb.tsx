interface Props {
  color: string;
  size: number;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export default function GlowOrb({ color, size, top, right, bottom, left }: Props) {
  return (
    <div
      className="absolute rounded-full blur-[60px] pointer-events-none z-0 opacity-[0.06]"
      style={{
        width: size,
        height: size,
        background: color,
        top,
        right,
        bottom,
        left,
      }}
    />
  );
}
