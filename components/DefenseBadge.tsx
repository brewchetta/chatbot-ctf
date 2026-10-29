export default function DefenseBadge({ name, blurb }: { name: string; blurb: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-navy/15 bg-paper px-4 py-2 text-sm">
      <span className="rounded bg-navy px-2 py-0.5 text-xs font-bold tracking-wide text-gold">{name}</span>
      <span className="text-navy/70">{blurb}</span>
    </div>
  );
}
