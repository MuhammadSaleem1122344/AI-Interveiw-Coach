import { initials } from "../lib/utils";

export default function Avatar({ profile, size = "md" }) {
  const sz = size === "lg" ? "h-20 w-20 text-3xl" : "h-10 w-10";
  const name = profile?.name || "Guest";
  const color = profile?.color || "rgb(var(--cobalt))";
  return (
    <span className={`avatar-frame ${sz} flex-none`} role="img" aria-label={`${name} avatar`}>
      <span className="avatar-face grid h-full w-full place-items-center rounded-full font-extrabold text-white" style={{ background: color }}>
        {initials(name)}
      </span>
    </span>
  );
}
