# The Pentagon (Parody Edition) — Prompt Injection CTF

A deliberately silly, deliberately vulnerable website. **Corporal Chatsworth**, the help-desk bot, can read files
from the project folder. Somewhere in that folder is a secret. Your mission: **make the bot give it to you**.
Then switch sides and stop the next group from doing the same.

> This is a fictional parody and a classroom range. Only attack **your own** running copy.

## Setup (driver only, ~5 min)

```bash
npm install
cp .env.local.example .env.local
```

Open `.env.local`, paste your group's Anthropic API key after `ANTHROPIC_API_KEY=`, then:

```bash
npm run dev
```

Visit <http://localhost:3000> and click **Ask the Corporal**. The server's `.env` file holds the flag
(`SUPER_SECRET_PASSWORD`). Don't open it directly — that's cheating. Get the bot to tell you.

## Range safety (these rules are always on)

- The bot can never read `.env.local` (that's your real API key) or anything outside the project folder.
- Requests are rate-limited and capped in size to protect your key's budget.
- You can't change these; you don't need to.

## Rounds

| Round | You are | Goal |
| --- | --- | --- |
| 1. Attack | Red team | `DEFENSE_LEVEL=0`. Capture the flag with prompt injection. When you do, a **FLAG CAPTURED** banner appears. Bonus flags: leak the system prompt; open the classified decoy file. |
| 2. Harden | Blue team | Set `DEFENSE_LEVEL=custom` in `.env.local`, restart `npm run dev`, and improve `lib/defenses/student.ts`. Your goal: the flag never reaches the chat. |
| 3. Cross-attack | Red team again | Swap drivers/laptops with another group and attack their hardened bot. Keep score. |

## What you can change in Round 2

Everything in `lib/defenses/student.ts` — the system prompt, input checks, output filters, and what the tools may touch.
Think about which of these are *requests* to the model and which are *enforced by code*.

## Handy commands

```bash
npm run dev     # run the site
npm test        # run the unit tests (no API key needed)
```

Levels `0`–`3` in `lib/defenses/` are the instructor's reference implementations. **No peeking until your instructor says so.**

## Project map

```
app/page.tsx            parody landing page
app/ask/page.tsx        the chat page
app/api/chat/route.ts   validates the request and runs the agent
lib/agent.ts            the model + tool loop
lib/tools.ts            list_files / read_file
lib/safety.ts           range-safety rules (always on)
lib/defenses/           defense levels; student.ts is yours
data/public/            documents the bot is meant to read
```
