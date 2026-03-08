interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-8 h-8 rounded-[9px] text-[11px]",
  md: "w-10 h-10 rounded-xl text-[13px]",
  lg: "w-14 h-14 rounded-2xl text-[17px]",
};

const gradients = [
  "from-squad-saffron to-[#FF3D6B]",
  "from-squad-green to-[#00B4D8]",
  "from-squad-saffron to-[#FFB300]",
  "from-[#845EC2] to-squad-saffron",
];

export default function SquadAvatar({ name, size = "md" }: AvatarProps) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const gradient = gradients[name.charCodeAt(0) % gradients.length];

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br ${gradient} flex items-center justify-center font-display font-bold text-primary-foreground shrink-0`}>
      {initials}
    </div>
  );
}
