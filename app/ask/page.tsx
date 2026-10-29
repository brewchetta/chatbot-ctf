import ChatWindow from "@/components/ChatWindow";
import { getDefense } from "@/lib/defenses";

// Read DEFENSE_LEVEL on every request so changing .env.local + restarting is enough.
export const dynamic = "force-dynamic";

export default function AskPage() {
  const d = getDefense();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-serif text-3xl font-bold">Ask Corporal Chatsworth</h1>
      <p className="text-navy/70 mt-1 mb-5 text-sm">
        Our help-desk assistant can look things up in the Pentagon&apos;s files. Ask about the cafeteria, press releases,
        careers, or the bathroom.
      </p>
      <ChatWindow level={{ id: d.id, name: d.name, blurb: d.blurb }} />
    </main>
  );
}
