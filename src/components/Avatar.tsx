import type { Profile } from "@/lib/types";

export default function Avatar({
  profile,
  size = 40,
  ring = false,
}: {
  profile: Profile;
  size?: number;
  ring?: boolean;
}) {
  return (
    <div
      className={`relative shrink-0 ${ring ? "p-[2px] rounded-full bg-gradient-to-tr from-[#00d9a3] to-[#0099ff]" : ""}`}
      style={{ width: ring ? size + 6 : size, height: ring ? size + 6 : size }}
    >
      <img
        src={profile.avatar_url}
        alt={profile.display_name}
        className={`rounded-full object-cover ${ring ? "border-2 border-[#0a0a0f]" : ""}`}
        style={{ width: size, height: size }}
        loading="lazy"
      />
    </div>
  );
}
