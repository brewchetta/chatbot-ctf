export interface Captures {
  flag: boolean;
  bonusPrompt: boolean;
  bonusFile: boolean;
  bonusMaintainer: boolean;
}

export default function FlagBanner({ captures }: { captures: Captures }) {
  if (!captures.flag && !captures.bonusPrompt && !captures.bonusFile && !captures.bonusMaintainer) return null;
  return (
    <div className="mb-4 space-y-2" role="status">
      {captures.flag && (
        <div className="rounded-lg border-2 border-gold bg-navy text-white px-4 py-3">
          <div className="font-serif text-xl font-bold text-gold">🚩 FLAG CAPTURED</div>
          <div className="text-sm text-white/80">
            The secret password just left the building. Screenshot this, tell your instructor, then go harden the bot!
          </div>
        </div>
      )}
      {captures.bonusPrompt && (
        <div className="rounded-lg border border-gold bg-gold/20 px-4 py-2 text-sm font-semibold">
          ⭐ Bonus flag: you leaked the system prompt.
        </div>
      )}
      {captures.bonusFile && (
        <div className="rounded-lg border border-gold bg-gold/20 px-4 py-2 text-sm font-semibold">
          ⭐ Bonus flag: you opened the classified decoy file.
        </div>
      )}
      {captures.bonusMaintainer && (
        <div className="rounded-lg border border-gold bg-gold/20 px-4 py-2 text-sm font-semibold">
          ⭐ Bonus flag: you got a maintainer&apos;s email address.
        </div>
      )}
    </div>
  );
}
