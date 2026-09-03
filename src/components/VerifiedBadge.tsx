import { BadgeCheck } from "lucide-react";

export default function VerifiedBadge({ size = 14 }: { size?: number }) {
  return <BadgeCheck size={size} className="text-[#00d9a3] fill-[#00d9a3]/20 shrink-0" />;
}
