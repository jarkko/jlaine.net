# Playbook line: ideas

Status: ideas, not a plan. Nothing here is built. Written 2026-11-01.

Source: LP Kangasala, *Junioreiden pelikirja* (Outi Munnukka, 8/2018, 28 slides).
Most of it is general volleyball knowledge: values, small-court play, F/E/D
junior systems (variants A–D), the overlap rule, 5-1 serve-receive per
rotation, reading block, defensive positions by attack zone, attack options,
free ball and coverage. What we can add is **presentation**: moving, legal,
explorable diagrams, one source for web, PDF and video, and a teaching approach
that matches coachinglab.

Credit Outi on everything derived from it ("Pohjana Outi Munnukan pelikirja,
LP Kangasala 2018"), and ask whether she wants to co-own the update.

---

## TL;DR: the ranking

| # | Idea | Audience | Format | Effort | Quick win |
|---|---|---|---|---|---|
| 0 | **Text edition of the 2018 book, updated to current rules**: every slide transcribed, every diagram written out as positions, then the fixes in "Where it is outdated" applied | all (it is the source for everything else) | Markdown | M | — |
| 1 | **Court + rotation model and overlap checker** (the engine everything else uses) | — | TypeScript module + data | M | — |
| 2 | **Serve-receive cards**, one per rotation, redrawn from the model | players, junior coaches | PDF page + 1080×1350 carousel | S once #1 exists | ✅ |
| 3 | **"Paikkavirhe 30 sekunnissa"**: the overlap rule, including the 2025 change for the serving team | coaches, players, parents in the stands | 9:16 video + carousel | S | ✅ (after the rule check below) |
| 4 | **Rotation learning centre, phase 1: serve-receive** (the centrepiece) | players first, then coaches | mobile web app, FI then EN | L | — |
| 5 | **Pelikirja + pelit**: for each playbook concept, one game that teaches it | junior coaches | web page + PDF appendix | M | partly: the games exist in coachinglab already |
| 6 | **Parents' guide**: what your child plays at each age, and the words the coach uses | parents | 1 web page + 2-page PDF | S | ✅ |
| 7 | **Updated club PDF**, the 2018 book rebuilt from the same source | club | PDF | M (falls out of 1, 2, 5, 6) | — |
| 8 | **Learning centre phase 2: attack and coverage maps** | players, coaches | web | L | — |
| 9 | **Learning centre phase 3: defence by the opponent's set target** | players, coaches | web + video | L | — |
| 10 | **Embeddable club edition** (club colours, own lineup, iframe) | other clubs | web | M | — |
| 11 | **Real match layer from Magistician**: clips and landing maps next to the diagrams | coaches | web | M, gated on data and consent | — |

Order of work: 0 → 1 → 2 + 3 (ship and learn) → 6 → 4 → 5 → 7 → 8 → 9 → 10/11.
Nothing gets drawn, animated or published until phase 0 is done and checked.

---

## Part 1: Content

### What the 2018 playbook gets right (keep)

- **"Kaikki opettelevat kaikki paikat alussa"**: everyone learns every position
  first, then specialises. That matches the non-specialisation stance in the
  development-model draft. Lead with it.
- **A progression of systems**: rotating setter → two setters (front, then
  back) → one setter. It is a sensible ladder, and the learning centre should
  follow it.
- **"Tilanne elää – reagoidaan joukkueena"** (coverage slide). The book already
  admits that positions are a starting picture, not a script. Build on that.
- **Alternatives (A–D) for each phase.** The book doesn't claim one right
  answer, which fits CLA: several solutions, each with a reason.

### Where it is outdated or conflicts with coachinglab

Every row here gets fixed in phase 0, in the text edition, before any
drawing or code.

| Item in 2018 book | Problem | What to do |
|---|---|---|
| Slide 9: all six players "täytyy olla tuossa järjestyksessä ennen syöttöä" | **FIVB 2025–2028 removed the positional fault for the serving team.** Only the receiving team must be in rotational order at the service hit. Several sources agree ([Coaching Volleyball](https://coachingvb.com/proposed-fivb-rules-changes), [visu.network](https://visu.network/blog/volleyball-rotations-explained/), [FIVB modification list](https://vbahk.org.hk/items/media/Refereeing/202528_Volleyball_Rules/VB/fivbvolleyball_rulesmodification20252028.pdf)). The latest Finnish translation linked from lentopallo.fi is [2021–2024](https://www.lentopallo.fi/wp-content/uploads/2022/08/FIVB-Lentopallon-saannot-2021-2024-SUOMENNOS.pdf). | **Verify before publishing anything about overlap.** Confirm the rule text in the [FIVB 2025–2028 rulebook](https://www.fivb.com/wp-content/uploads/2025/06/FIVB-Volleyball_Rules2025_2028-FR-v04.pdf) and whether Finnish national and junior series apply it. If the answer is yes, it is a news hook for idea #3. |
| F/E/D junior names and their court systems | The federation's formats have changed since 2018: U9 MiniLentis 2v2, U11/U13 3v3 on a badminton-width court, Tiikeri/Super levels, and in 2025–26 Triplapallo and free reception (see `finnish-volleyball-development-model-DRAFT.md`). | Rebuild the small-court section around the current formats and age names. Check the [Länsi-Suomi minituomari material (2025)](https://sivustot.lentopallo.fi/lansi-suomi/files/2025/09/Minituomarikoulutus_v_2_2025_08_31.pdf) and the current rules. Keep the 2018 variants only where they still fit a format that exists. |
| "Tytöillä puolustajat ovat metrin lähempänä" | A blanket rule by gender. The real variable is how hard and deep the opponent hits. | Say instead that defenders stand deeper when the opponent hits harder. The court model takes a depth setting, not a gender. |
| "kolmen metrin viiva" and other *viiva* forms | The Magistician termbase uses *raja* throughout (hyökkäysraja, sivuraja, päätyraja), following rule 1. | Share the termbase. One term per concept across both projects. |
| Jargon: hakkuri, pateri, satanen, siirto, metri, tipu, tsekki, peippi | Fine inside the club. Parents and new players won't know it. | Write a glossary, and give each term a one-line animation in the learning centre. |
| Defence slides 21–22: "laitatorjujan vasen käsi pallon kohdalla" for both the zone-4 attack (line closed) and the zone-2 attack (line open) | Probably a copy-paste. Hand reference against line closed/open needs checking. | **Flag, don't fix from first principles.** `mechanics.md` covers only beach. Add an **indoor section with sources** (FIVB rules, Gold Medal Squared, Volleyball Canada, Lebedew) before any block or defence content is published, and get Outi's or Jarkko's sign-off on each diagram. |
| The tone throughout: "pelataan omat paikat", "tehdään mitä sovitaan" | The book is a set of instructions. Coachinglab's whole argument is that telling is the weakest tool (*Change the game, not the player*). | **Reframe the playbook as a map, not instructions.** The map gives the team shared words and a starting picture. Games teach the play itself. Each section ends with "Kokeile pelissä" and one constraint game (idea #5). The learning centre gets the map learned **at home, before practice**, which leaves practice time for play. That is the pitch to coaches. |
| Static diagrams with arrows | A picture can't show *when* someone moves: at serve contact, on the pass, on the set. | That timing is what the animation is for. |

The values page (slide 2) belongs to the club. Restyle it, but leave the wording
to the club.

### Pieces, by audience

**Players (12–18).** They want to know where to stand in this rotation and
what their own job is.
- Serve-receive cards (#2). One rotation per card, with your role highlighted.
- The learning centre in "Oma rooli" mode (#4).
- 15–20 s vertical clips, one idea each: "Rotaatio 1: missä passari on?",
  "Mihin libero menee jatkopallossa?". Players watch this format anyway.

**Parents.** They want to know what is happening on court and how to talk about
it at home.
- Parents' guide (#6): the age ladder (2v2 → 3v3 → 4v4 → 6v6), why kids rotate
  through every position, a glossary, and "älä huuda katsomosta paikkoja".
  That last one is the parent-side version of "change the game", a short and
  honest note.
- The overlap explainer (#3). Parents in the stands are exactly the people
  shouting "they overlapped!".

**Junior coaches.** They want a ready map and ways to teach it without
lecturing.
- Pelikirja + pelit (#5). Each concept is paired with a game that makes it
  matter. Sources: the practice-design guide draft, the *Change the game* post
  and the beach front-pressure lesson. Link to them instead of duplicating
  them. New games only where there is a gap (serve-receive role games,
  free-ball transition).
- The learning centre in coach mode: build your own lineup and send the link
  to the team chat.
- The updated club PDF (#7) to print for the hall.

### Voice rules (from README, applied)

- Plain Finnish first and **written first**, not translated (see the memory
  note on calques). EN follows later.
- No "CLA" or "nonlinear pedagogy" in leads. The tool shows; a footnote names
  the theory.
- One idea per piece. A card is one rotation. A clip is one movement.
- Every mechanic is sourced in `mechanics.md` before it ships, including
  indoor, which is missing today.

### The Magistician tie-in, without selling

Magistician's voice is "expert, honest, calm" (`statistician/docs/design/voice.md`).
Use the same posture here: show something useful and name where it came from.

1. **Real rallies next to the diagram (#11).** Under a formation: "Katso
   oikeasta ottelusta". It shows 2–3 LP Kangasala clips of this rotation in
   receive, cut with Magistician's reels. The credit is a quiet line,
   "Klipit: Magistician". Needs consent for footage of minors; follow
   `statistician/docs/gdpr-checklist.md`. Start with A-team or league footage.
2. **Landing maps in defence (phase 3).** "Where attacks from zone 4 landed in
   N Finnish junior matches" is an honest overlay. Show it only when the data
   holds up ("a blank beats a wrong number").
3. **One shared vocabulary.** The learning centre uses DataVolley-style zones
   (1–9, subzones) and Magistician's termbase, so a coach who moves to the
   product finds the same words.
4. **No email gate at launch.** The tool is free and open, and the README defers
   a newsletter anyway. Measure with cookieless analytics (Cloudflare Web
   Analytics). Decide on a gate only if the PDF download turns out to be the
   thing people want.
5. **Clubs are Magistician's customers** (a club licence is the main sales lever
   in `market-analysis.md`). The embeddable club edition (#10) puts the
   playbook on other clubs' sites with a link back. That is the real funnel:
   club coaches who value a well-made tool.

Not: pop-ups, "powered by" banners on every diagram, AI language, or stats used
as marketing.

---

## Part 2: Tech, built around the rotation learning centre

### What already exists, and the gap

- Lineup builders with an overlap check: [Volleyball Rotations (iOS)](https://apps.apple.com/app/id1440107449),
  Rotate123 (5-1/6-2/4-2 with automatic overlap checking),
  [VolleyRotationsApp](https://gh.r-mj.com/EasySportsApps/VolleyRotationsApp) (Shiny),
  [visu.network rotation maker](https://visu.network/tools/volleyball-rotation-maker/).
- General animated tactics boards: [CourtDraw](https://hunted.space/product/courtdraw),
  [tactical-board.com](https://tactical-board.com/uk/volleyball) (its share
  links expire after 6 months of no use, which we should avoid).
- **The gap:** these are tools for coaches to *draw* with. None teaches a
  *player* in Finnish. None explains why a formation is legal, naming the pair
  that overlaps. None animates *when* players move. None does defence by the
  opponent's set target.

The bar: **Brilliant / Duolingo for the interaction loop** (short, try first,
immediate feedback), **Apple's own apps for the feel**, and **Bret Victor's
[Explorable Explanations](https://worrydream.com/ExplorableExplanations/)** for
the idea that the reader changes the model and sees the result.

### Phases

**Phase 0: the 2018 book as text, updated to current rules (no code)**
- `coachinglab/playbook/pelikirja-2018.md`: a faithful transcription of all
  28 slides, in the original Finnish, in slide order. Every diagram is written
  out as a table: player, role, zone, rough spot (for example "4 m from the
  net, left third") and arrows as from → to. Errors and typos stay as they
  are, marked `[sic]`. This is the record of what the club had.
- `coachinglab/playbook/pelikirja.md`: the updated edition. Same structure, with
  every row of "Where it is outdated" fixed:
  - **Rules:** confirm the FIVB 2025–2028 text (rule 7.4 and the serving
    team, overlap by feet, the diagonal question) and whether the Finnish
    federation applies it in national and junior series. Cite the rule
    number at each point that depends on it.
  - **Junior formats:** replace F/E/D with the federation's current formats
    and age names (U9 MiniLentis 2v2, U11/U13 3v3, Tiikeri/Super,
    Triplapallo, free reception), checked against the current rules and
    competition regulations.
  - **Indoor mechanics:** add an indoor section to `mechanics.md` with
    sources (block hand reference with line closed or open, reading block,
    defensive spots by attack zone, coverage). Correct the defence slides
    against it, and list anything still unresolved for Outi or Jarkko to
    decide.
  - **Wording:** depth by opponent's attack, not by gender; *raja* instead of
    *viiva* (Magistician termbase); a glossary for the club jargon.
- A change log at the end of `pelikirja.md`: each change, why, and its source.
  Jarkko (and Outi, if she wants) signs off before phase 1.
- The diagram tables become the formation data for phase 1, so the work is
  not lost.

**Phase 1: the engine, first outputs, then serve-receive (the centrepiece)**
- The court and rotation model (below) and the overlap checker with unit
  tests, fed with the 5-1 data from the phase 0 tables. Every 2018 formation
  must pass the checker; any that fails goes back to phase 0.
- Static SVG renders → serve-receive cards (#2) and the overlap explainer
  (#3). This proves the data and the look before any interaction work.
- System 5-1, six rotations, each with **alternative formations**: the 2018
  primary and its noted swaps ("hakkuri nostamaan, yleispelaaja pois
  nostosta"), a 4-receiver junior variant, and a 2-receiver variant for older
  teams. Every variant must pass the checker.
- Then the ladder from slide 9: rotating setter (all six "S"), 4-2, 6-2. Then
  the small-court formats (3v3 and 4v4 on their own court sizes) for the
  youngest.
- Interactions 1–6 below.

**Phase 2: attack and coverage**
- From each receive formation: release paths (setter to target, hitters to
  their approach), and attack options for front-setter and back-setter
  situations (slides 23–25), including back-row attack lanes.
- Coverage (varmistus, slide 26) as a second layer on the same timeline.

**Phase 3: defence**
- Input: **where the opponent sets** (zone 4, 3, 2, pipe/1, 6) plus **our block
  shape** (2, 1 or 0 blockers; line closed or open; broken block). Output: our
  block and defenders slide into place.
- Reading-block base (slides 18–20), free ball (slide 25), and the zone-6
  variant (slide 24) as alternatives.
- Optional Magistician landing-map overlay (tie-in point 2).

**Phase 4: clubs and teams**
- Coach mode: enter your own lineup (jersey numbers, not names; see the
  privacy note), pick the variants your team uses, and share a link.
- An embeddable club edition with club theme tokens.

Each phase is done when it passes the usability review in the global
CLAUDE.md: screenshot every screen at phone and desktop width, in light and
dark, and fix breakage before showing it.

### The court and rotation model

One TypeScript module with no UI dependencies. Web, PDF and video all use it.

```
Court      { width: 9, depth: 9, attackLine: 3 }        // metres; per format (6v6, 4v4, 3v3 badminton-width)
Coord      { x, y }                                      // metres, own half, origin = left sideline at the net,
                                                         // y grows towards own end line
Role       S | OH | MB | OPP | L | DS | U  (U = universal, junior)
Player     { id, role, label }                           // label = jersey number or role letter, never a name in a URL
Lineup     Player[6]                                     // rotational order: index 0 = zone 1 at rotation 1
System     { id: "5-1", roles, liberoReplaces: "MB" }    // libero swaps with the back-row MB
Rotation   1..6                                          // named by setter's zone, as in the 2018 book ("Passari 1-paikalla")
Phase      receive | attack | coverage | base-defence | defence | freeball
Formation  { system, rotation, phase, variant, positions: Record<playerId, Coord>,
             movements?: Path[], source, notes }
Path       { playerId, waypoints: Coord[], trigger: serveContact | pass | set | attack }
Context    (defence) { setTarget: zone, block: 0|1|2, line: open|closed, broken: bool }
```

- **Formations are data**, authored as YAML/JSON next to the content and
  reviewed like text. Each one records its `source` (2018 book slide, Gold
  Medal Squared, a coach's own) and must pass the checker in CI.
- **Overlap checker:** a pure function `check(formation) → { legal, faults[] }`.
  It covers left-right order in the front row (4-3-2) and back row (5-6-1),
  and front-back for the pairs 4-5, 3-6, 2-1. The "no diagonal overlap"
  convention needs to be confirmed against the rulebook diagrams.
  [Sources differ](https://coachingvb.com/volleyball-overlap-rule-please-teach-players),
  so check the [FIVB rulebook](https://www.fivb.com/wp-content/uploads/2025/06/FIVB-Volleyball_Rules2025_2028-FR-v04.pdf)
  and note that position is judged by the feet. It applies to the
  **receiving team only** (pending the rule check). A fault is phrased in
  plain words: "Nelonen on kolmosen oikealla puolella".
- **Rotate** is a shift of the lineup. **Libero swap** is a rule on the
  system, not hand-placed per formation.
- **Defence** is a function from `Context` to a formation: a table of
  authored formations keyed by context, not a computed geometry. Positions
  are conventions to look up, not derive (see the memory note on
  first-principles mechanics).
- Zones 1–9 and their subzones follow DataVolley, so Magistician data maps
  onto them directly.

### The interactions that teach best

The tool covers *knowing* where to stand. The game covers *doing* it. Each
interaction is short, lets the learner try first, and gives immediate feedback.

1. **Explore.** A rotation stepper (1–6) sits at the bottom of the screen,
   within thumb reach. Swiping the court also works. Players **glide** to their
   new spots, so you can follow each person. Every token shows a role letter
   and a number, never colour alone.
2. **Oma rooli (my role).** "Olen libero / passari / keskipelaaja". The view
   highlights only you through all six rotations and dims the others, with one
   line per rotation saying your job. Players care about their own job first.
3. **Predict, then reveal.** "Rotaatio 4: mihin passari menee?" You drag the
   token, it animates to the right spot, and you get a short reason. Spaced
   across rotations, 6–10 questions per round. Retrieval practice beats
   re-reading ([Roediger & Karpicke 2006](https://doi.org/10.1111/j.1467-9280.2006.01693.x)).
   This is the core of the learning loop.
4. **Overlap sandbox.** You drag anyone anywhere. The pairs that constrain the
   player you are moving light up, a fault turns its pair red and names it in
   words, and legal spots show as a faint region. This is the rule as a
   constraint you explore, not one you're told. "Find a legal formation where
   the setter hides behind the middle" has more than one answer.
5. **Serve-to-play timeline.** A play button and a scrubber run from serve
   contact to pass to set to attack. You see the receive formation dissolve
   into attack positions (phase 2) and coverage. Moments where the play pauses
   are marked on the scrubber.
6. **Compare variants.** A/B/C chips switch formation inside the same rotation.
   Tokens morph, and a sentence names the trade-off, for example "hakkuri pois
   nostosta: vahvempi hyökkäys, kaksi nostajaa".
7. **(Phase 3) Opponent's set.** Tap where the opponent sets. Our block and
   defenders slide into place, and the opponent's hitter runs their approach.
   Then predict-then-reveal again: "Vastustaja nostaa nelosesta – missä olet?"

Plus: keyboard support (arrow keys rotate, Tab moves between players), a text
equivalent under every diagram ("Passari: takakenttä oikealla, 1-paikka"), and
reduced motion that crossfades instead of moving, as in the kit's
`recipes/motion/web-static`. The orientation is **always seen from your own end
line, net at the top**, the way a player sees the court. The 2018 book does
this; keep it everywhere.

### State in the URL

Readable paths, no blobs, no UUIDs, and links that never expire:

```
/fi/vastaanotto/5-1/kierto-3?muoto=b&rooli=libero
/fi/puolustus/5-1/kierto-3?nosto=4&torjunta=2&raja=kiinni
/en/receive/5-1/rotation-3?variant=b&role=libero
```

A custom lineup or formation goes into a compact query string
(`?p=S1.2-0.8,OH4.1-3.0,...`). Labels are jersey numbers or roles. **No player
names in shareable URLs**: these are minors, and links end up in WhatsApp. Coach
mode can keep names on the device only. Every state has an Open Graph image
rendered from the same model, so a shared link shows the right rotation in the
chat preview.

### Mobile first, Finnish then English

- The court fills the width in portrait, with controls in the bottom third.
  It works one-handed in the hall.
- Static pages with one interactive island, so a phone on gym Wi-Fi gets a
  fast first paint. Budget: interactive court under ~60 kB gzipped JS.
- FI is the default at `/fi/`. EN comes later at `/en/`, written, not
  machine-translated. Terms come from a shared termbase. Finnish compounds get
  soft hyphens in the data (the kit's video recipe notes that Chrome has no
  Finnish hyphenation dictionary, and the same applies to narrow phone
  layouts).

### Video pipeline

The kit's video lane (`metamorphosis/kit/recipes/video/README.md`) fits
directly:

- **Remotion** for templated clips, because they are data-driven.
  Compositions read the same formation data:
  - `RotationTour`: six rotations, 9:16, about 20 s, one highlighted role.
  - `OverlapExplainer`: a fault appears, its pair turns red, then the fix.
  - `DefenceBySet`: the opponent sets 4, 3, then 2, and our side responds.
- The court component is shared with the web island. Animation uses
  `interpolate`/`spring` per frame, not CSS, as the recipe requires. Fonts are
  loaded locally.
- `remotion still` renders the carousel frames and OG images, so one template
  covers both.
- Captions are burned in, Finnish. Keep text inside platform safe areas.
- **Final Cut lane** for real-footage pieces (idea #11). Magistician exports
  the clips with an `edit.json` and the FCPXML rough cut, and Jarkko makes the
  edit.
- **Licence:** Remotion is free for individuals and companies of up to 3
  people. Jarkko rendering, with the club and other clubs receiving only video
  files, is fine. If the templates ever move into Magistician (a company) or to
  a club that runs them, recount headcount (kit README, "Licences").

### PDF from one source

- Today coachinglab PDFs come from **wkhtmltopdf 0.12.6 (Qt 4.8)**. The project
  is archived and its WebKit predates modern CSS. Replace it.
- **Recommendation:** a print route in the site (`/fi/tulosta/pelikirja`) with
  print CSS (`@page`, page breaks), with diagrams as inline SVG from the same
  model, rendered to PDF by **Playwright's `page.pdf()`**. jlaine.net already
  has Playwright. Add Paged.js only if running headers or footnotes are needed.
- The alternative is **Typst**: better typography, and it embeds the SVGs
  fine, but it is a second layout system to keep in sync. Worth it only if the
  PDF becomes the main product.
- One build makes the club edition (LP Kangasala theme, values page, logo) and
  a neutral coachinglab edition.

### The forced decision: coachinglab's site stack

The README defers the stack (Astro / Hugo / 11ty / Zola), the domain and the
host. The learning centre forces all three. A tool that clubs will link to
needs a stable home, and the stack must let **one TypeScript court model and
one court component** run in the web page, in Remotion (React) and in the PDF.

**Recommendation: Astro, static output, on Cloudflare Pages.**

- Content collections for the Markdown pieces already in `coachinglab/`. They
  move as-is.
- Islands: the court component hydrates only where it is interactive. The rest
  is zero-JS HTML.
- A React (or Preact-compat) component shared directly with Remotion. Write
  the court in plain JSX with no React-only APIs, so the web island can use
  Preact (about 4 kB) while Remotion uses React.
- Built-in i18n routing for `/fi/` and `/en/`. Static, so Cloudflare Pages is
  free and fast.
- Vendor the metamorphosis kit (`ds vendor`). Then `invariants`, `a11y`,
  `perf` and `visual` gate every diagram page at phone and desktop width, in
  light and dark, and motion tokens come from `motion.tokens.json`.

Trade-offs:

| Option | For | Against |
|---|---|---|
| **Astro** (recommended) | Islands, MD collections, i18n, React/Preact interop, same TS everywhere | Node toolchain, and the framework moves fast (pin versions, Renovate) |
| 11ty | Simpler, stable, no framework | Islands and TS bundling wired by hand; no shared component with Remotion without extra build steps |
| Hugo / Zola | Fastest builds, single binary | Templates in Go/Tera, so the court model can't be shared with Remotion; the interactive part becomes a separate app anyway |
| Keep it in jlaine.net (Jekyll) | Nothing new to host | A personal blog is the wrong home for a club and Magistician lead magnet; Ruby + Node build mix; the 2008-era Octopress layout |
| Inside Magistician (Phoenix) | One deploy, close to the product | Couples a free public tool to the product's release cycle and auth, and feels like marketing. Keep them apart, linked. |

This also forces **the name and the domain**. The tool will be shared with a
URL, so "coachinglab" as a placeholder becomes a cost the moment the first link
goes into a team chat. Decide the name before phase 1 ships. Phase 0 outputs
(PDF cards, video) don't need it.

---

## Open questions for Jarkko

1. **Rule check:** does the Finnish federation apply the FIVB 2025–2028
   serving-team change in national and junior series? This blocks idea #3 and
   the checker's scope.
2. **Outi:** credit only, or co-author of the update?
3. **Indoor mechanics:** who signs off on block and defence diagrams? Adding an
   indoor section to `mechanics.md` comes first either way.
4. **Footage consent** for real-rally clips (#11): which teams, and with which
   consent form?
5. **Name and domain** before phase 1.
6. **Catch or no catch** for the youngest (the open DECIDE in the development
   model) affects how the small-court section is written.
