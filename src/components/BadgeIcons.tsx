import { BadgeCheck, Shield, Crown } from "lucide-react";

export default function BadgeIcons({
  verified,
  isCelebrity,
  isAdfree,
  size = 14,
}: {
  verified?: boolean;
  isCelebrity?: boolean;
  isAdfree?: boolean;
  size?: number;
}) {
  return (
    <span className="inline-flex items-center gap-0.5 shrink-0">
      {isCelebrity && (
        <Crown
          size={size}
          className="text-yellow-400 fill-yellow-400/20"
        />
      )}
      {isAdfree && (
        <Shield
          size={size}
          className="text-blue-400 fill-blue-400/20"
        />
      )}
      {verified && !isCelebrity && (
        <BadgeCheck size={size} className="text-[#00d9a3] fill-[#00d9a3]/20" />
      )}
    </span>
  );
}
