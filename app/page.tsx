import Link from "next/link";

const NEWS = [
  {
    date: "Oct 27",
    title: "Pentagon Confirms It Still Has Exactly Five Sides",
    body: "A full survey was completed this morning. \"We counted twice,\" said a spokesperson, \"and then once more for morale.\"",
  },
  {
    date: "Oct 24",
    title: "New Initiative: Meetings Reduced By 3%",
    body: "A bold plan will replace 3% of meetings with emails that could have been meetings. Analysts call it the biggest reform since the stapler.",
  },
  {
    date: "Oct 19",
    title: "Great Hallway Shortage of 2026 Resolved",
    body: "Hallways were reported to be \"a little too long.\" Scooters have been issued. Helmets are mandatory. Wheelie policy is under review.",
  },
];

const FACTS = [
  ["5", "sides (verified, twice)"],
  ["0.8 mi", "to the nearest bathroom, from anywhere"],
  ["17,000", "staplers, 16,999 of them missing"],
  ["1", "Classified Sandwich (recipe: classified)"],
];

export default function Home() {
  return (
    <main>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24 grid gap-8">
          <p className="text-gold font-semibold tracking-widest text-sm">DEPARTMENT OF VERY SERIOUS BUSINESS</p>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold leading-tight max-w-3xl">
            Defending the nation, one five-sided hallway at a time.
          </h1>
          <p className="text-white/80 max-w-2xl text-lg">
            Welcome to the official-looking, entirely fictional home of The Pentagon (Parody Edition). Our mission: be
            pentagonal, be prepared, and be near a snack.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/ask" className="bg-gold text-navy font-bold px-6 py-3 rounded hover:brightness-110">
              Ask Corporal Chatsworth →
            </Link>
            <a href="#news" className="border border-white/40 px-6 py-3 rounded hover:bg-white/10 font-semibold">
              Latest briefings
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {FACTS.map(([big, small]) => (
            <div key={small} className="bg-paper border border-navy/10 rounded-lg p-4 text-center">
              <div className="font-serif text-3xl font-bold text-navy">{big}</div>
              <div className="text-sm text-navy/70 mt-1">{small}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="news" className="mx-auto max-w-5xl px-4 pb-12">
        <h2 className="font-serif text-3xl font-bold mb-6">Press Briefings</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {NEWS.map((n) => (
            <article key={n.title} className="bg-paper border border-navy/10 rounded-lg p-5">
              <div className="text-xs font-semibold text-gold bg-navy inline-block px-2 py-0.5 rounded mb-3">{n.date}</div>
              <h3 className="font-serif text-lg font-bold mb-2">{n.title}</h3>
              <p className="text-sm text-navy/80">{n.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 grid gap-6 md:grid-cols-2">
        <div className="bg-paper border border-navy/10 rounded-lg p-6">
          <h2 className="font-serif text-2xl font-bold mb-2">Careers</h2>
          <ul className="text-sm space-y-2 text-navy/80 list-disc pl-5">
            <li><b>Chief Stapler Officer</b> — comfortable with sharp objects and sharper deadlines.</li>
            <li><b>Senior Bathroom Navigator</b> — must be able to find the bathroom. Bring snacks.</li>
            <li><b>Intern, Strategic Coffee Operations</b> — unpaid, but the coffee is free.</li>
          </ul>
        </div>
        <div className="bg-navy text-white rounded-lg p-6">
          <h2 className="font-serif text-2xl font-bold mb-2">Questions? Ask the Corporal.</h2>
          <p className="text-white/80 text-sm mb-4">
            Corporal Chatsworth is our friendly help-desk assistant. He knows the cafeteria menu, the press releases,
            and where the files are kept. He is very helpful. Possibly too helpful.
          </p>
          <Link href="/ask" className="inline-block bg-gold text-navy font-bold px-5 py-2.5 rounded hover:brightness-110">
            Start chatting
          </Link>
        </div>
      </section>
    </main>
  );
}
