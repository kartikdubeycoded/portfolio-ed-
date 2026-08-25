// Long-form detail content for the dossier windows. Markdown-light HTML.
//
// Honesty rule for this file: every project here exists and has code behind it.
// Public repos carry a link; private ones get the same write-up and no link.
// Nothing in here is aspirational — if it isn't built, it isn't listed.

const repo = (url, label) =>
  `<p class="doc-repo"><a href="${url}" target="_blank" rel="noopener">${label} <span aria-hidden="true">↗</span></a></p>`

const closed = (why) => `<p class="doc-repo doc-repo--closed">${why}</p>`

export const details = {
  katti: {
    title: 'Kartik',
    tag: 'The person behind the work',
    body: `
      <p>I think in systems before I think in code. Give me a hard problem and the
      first thing that forms isn't a function — it's an architecture: the agents, the
      memory, the data flow, where it breaks. That instinct is what I trust most.</p>

      <h4>How I work</h4>
      <p>Architect first, engineer second — and closing that gap fast. I scope the real
      problem, design the system, and decide what's worth building. I'd rather ship one
      ugly real thing than design a perfect one that never runs.</p>

      <h4>The thread through all of it</h4>
      <p>Look at the projects and the same rule keeps surfacing: <strong>facts are never
      generated.</strong> Retrieval that cites the page it came from. A churn model that
      says <em>why</em> it flagged someone. An engineering rig with gates that block it
      from claiming more than it has verified. A caption model with an honesty floor it
      refuses to guess below. I care more about a system that admits what it doesn't know
      than one that sounds confident.</p>

      <h4>Right now</h4>
      <p>Final-year B.Tech Data Science at Manipal University Jaipur, based in Navi Mumbai.
      Three internships behind me; now building a portfolio of systems I'd want to be
      hired off of — multi-agent, retrieval, applied ML, and a few things that don't fit
      the categories.</p>

      <h4>How I am</h4>
      <p>Direct. I'd rather hear the truth than be managed, and I give the same back.
      Intense about the things I care about, allergic to busywork that ships nothing.</p>

      <h4>What I'm looking for</h4>
      <p>Real AI/ML work — systems that run for real users — or interesting freelance.
      <a href="mailto:kartikdubey1934@gmail.com">Say hello.</a></p>
    `,
  },

  jay: {
    title: 'Project Jay',
    tag: 'Local voice AI · the nervous system · live',
    body: `
      <p>A personal AI that lives on my own machine, watches my work, and <em>talks back</em>.
      It reads my agent sessions in real time, keeps its own memory, and only speaks up when
      something actually matters — a blocker, a finish, a decision — out loud. No chat box.
      An assistant that acts.</p>

      <h4>How it works</h4>
      <p>Local language models (via Ollama) classify every log line as it lands, state lives
      in SQLite, and a FastAPI hub drives a live dashboard plus a voice queue. Say "hey
      jarvis," it transcribes me on-CPU with Whisper and answers. A ChromaDB "brain" reads
      my own notes so it can answer questions about my work — and every answer cites its
      source. Sandboxed Docker workers, 63 passing tests.</p>

      <h4>Why it matters</h4>
      <p>Raw logs and private notes <strong>never leave the machine</strong>, it costs almost
      nothing to run, and it degrades to a plain deterministic answer if the internet dies.
      The hard rule underneath it: <em>facts are never generated.</em> Deterministic code
      decides what's true; the model only decides how it sounds. That's the line between a
      system you trust and a confident liar.</p>
      ${closed('Private repo — it reads my own logs and notes, so it stays closed. Happy to walk through the architecture.')}
    `,
  },

  'agentic-rag': {
    title: 'Agentic RAG Engine',
    tag: 'Grounded answers from thousand-page manuals · open source',
    body: `
      <p>Point it at a stack of technical PDFs and it becomes an expert on them. Ask a spec,
      ask for a procedure, or describe a fault and get a diagnosis — built only from the
      manuals, with inline citations and diagrams. It ships pre-loaded with Wärtsilä 32
      marine-engine service manuals, so you can clone it and ask a real question in about
      five minutes.</p>

      <h4>Why "agentic" is the point</h4>
      <p>A plain RAG pipeline retrieves once and hopes. This one runs a loop:
      <strong>rewrite → route → retrieve → grade</strong>. It rewrites your question into
      something a retriever can actually match, routes it to the right source, pulls
      candidates with hybrid search, reranks them, and then <em>grades its own retrieval</em>
      — if the evidence is too thin it refuses instead of improvising. Refusal is a feature.</p>

      <h4>The fault-cascade graph</h4>
      <p>Symptoms in machinery aren't independent — one failure drags others behind it. Vector
      search can't see that, because it only knows what text looks similar. So faults and their
      causes also live in a <strong>Neo4j graph</strong>, and a diagnosis walks the cascade
      rather than guessing from adjacent paragraphs.</p>

      <h4>Built to actually run</h4>
      <p>No Docker, no GPU, no separate database for the quickstart — embedded on-disk Qdrant,
      local embeddings, Groq for generation. The heavy options (fully offline local LLM, the
      Neo4j graph, a public tunnel) are opt-in. Role-based login separates the engineer who
      raises a ticket from the admin who approves the fix.</p>
      ${repo('https://github.com/kartikdubeycoded/agentic-rag-engine', 'github.com/kartikdubeycoded/agentic-rag-engine')}
    `,
  },

  ttm: {
    title: 'Talk Through Me',
    tag: 'Sign language → live captions · open source',
    body: `
      <p>Live sign-language-to-English captions on video calls — Meet, Zoom, Teams — as a
      Chrome extension. The webcam feed never leaves the machine. Built for Deaf and
      hard-of-hearing users, who currently get an interpreter or get nothing.</p>

      <h4>How it works</h4>
      <p>Webcam → MediaPipe extracts 21 hand landmarks (63 numbers per frame) → a model
      trained on those numbers predicts the sign → text appears live on the call. Working on
      landmarks instead of raw pixels is what makes it small and fast enough to run in a
      browser tab <em>during</em> a call.</p>

      <h4>The honesty floor</h4>
      <p>The number I'm proudest of isn't the accuracy — it's the floor. Every sign has a
      threshold below which it's guessed too rarely to be worth showing, and the model stays
      silent rather than putting a wrong word in someone's mouth. Teaching the word model to
      read the <strong>face and upper body</strong>, not just the hand, lifted the vocabulary
      above that floor from 39 signs to 185. Fingerspelling runs at 93.6%.</p>

      <h4>Scaling it</h4>
      <p>The pipeline now ingests Microsoft's ASL Citizen dataset — 2,731 signs across roughly
      40,000 clips — entirely on-device. There isn't disk to unpack a 43 GB archive, so each
      video is streamed straight out of it, landmarked, and turned into a training sequence.
      A fifty-sign pilot reads 55% correctly from <em>signers it has never seen</em> — the
      number that matters, because it shows the pipeline generalises past the people who
      recorded it. Indian Sign Language is the planned expansion.</p>
      ${repo('https://github.com/kartikdubeycoded/TTM-Talk-Through-Me', 'github.com/kartikdubeycoded/TTM-Talk-Through-Me')}
    `,
  },

  gyk: {
    title: 'get-your-knowledge-right',
    tag: 'A knowledge engine that returns work, not reading · open source',
    body: `
      <p>Everyone in this field drowns in input — repos, papers, launches, threads, saved
      links that rot unopened. All of it feels like progress and none of it is. This ranks
      the whole firehose against <em>my</em> topics and hands back something to do.</p>

      <h4>The radar</h4>
      <p>Nine sources on a six-hourly refresh: trending repos, GitHub in my topics, Hacker
      News, twenty RSS feeds, topic-targeted news, arXiv, Reddit — plus two that are different
      on purpose. <strong><code>opps</code></strong> tracks hackathons I can still enter, with
      deadlines. <strong><code>ycrfs</code></strong> tracks what YC is asking founders to build.
      Most sources answer "what exists." Those two answer "what can I do" and "what does
      someone with money want built" — the ones that produce output instead of more input.</p>

      <h4>The idea space</h4>
      <p>The part that turns information into knowledge. It reads across two or more unrelated
      sources, finds the gap between them, and proposes a concrete <em>build</em> or
      <em>paper</em> idea that I accept or reject. Accept one and it deepens into a real plan
      — stack, pieces, first week.</p>

      <h4>Built honest</h4>
      <p>Every source uses an official API, a public feed, or a published page — no scraping,
      no logging into anyone's account. The LLM sits behind one interface, so Groq, DeepSeek,
      Qwen or NIM is a one-line swap. And the scheduler runs in-process, which means it can't
      refresh while the machine is off — so the header states when it last synced instead of
      implying coverage it doesn't have.</p>
      ${repo('https://github.com/kartikdubeycoded/getyour-kb-right', 'github.com/kartikdubeycoded/getyour-kb-right')}
    `,
  },

  hands: {
    title: 'Get Your Hands Right',
    tag: 'Inspect a 3D model with your bare hands · open source',
    body: `
      <p>Turn a 3D model with your hands, through an ordinary webcam. No headset, no depth
      sensor, no cloud. MediaPipe reads 21 hand landmarks off the camera, and those landmarks
      drive everything.</p>

      <h4>The control idea</h4>
      <p>The model is locked to the <strong>viewport</strong> — not to the world, and not to
      your hand. That one decision is the whole thing: it means the object stays put and your
      hands act as a controller instead of a mount, so it doesn't drift away every time you
      move. Pinch and drag to rotate, pinch with both hands and pull apart to scale, open palm
      to place.</p>

      <h4>The filter stack</h4>
      <p>A second mode runs composable real-time filters — thermal, night vision, edges,
      burning, glitch, pixelate. Each is a small class behind a shared interface, so adding
      another is one file and no changes anywhere else. That's the part I'd point at in a code
      review: the extension point, not the effects.</p>

      <h4>Constraint</h4>
      <p>100% offline, CPU only. The webcam feed never leaves the machine.</p>
      ${repo('https://github.com/kartikdubeycoded/get-your-hands-right', 'github.com/kartikdubeycoded/get-your-hands-right')}
    `,
  },

  buddy: {
    title: 'BUDDY',
    tag: 'A ducted-fan aircraft, written as code · open source',
    body: `
      <p>A 115 mm ducted-fan companion aircraft, thrust-vectored by control vanes in the
      exhaust. The entire design lives in the repo as code: the geometry is parametric
      OpenSCAD, the physics is a chain of Python solvers. Change one number in
      <code>00_master_parameters.scad</code> and the ducts, vanes, spine, shells and the whole
      mass budget move with it.</p>

      <h4>A dependency chain, not a folder</h4>
      <p>Files are numbered because each stage eats the one before it. <code>00–02</code> is a
      contract layer — parameters, hardware, materials — and nothing downstream is allowed to
      hardcode a dimension. <code>04–06</code> are the solvers: propulsion, control authority,
      structural loads. <code>10–23</code> is geometry, <code>16–18</code> sizing,
      <code>24–36</code> budgets and gates.</p>

      <h4>The gates — the part I'd point at first</h4>
      <p>Four scripts exist purely to stop the project lying to itself. A feasibility gate that
      labels every result <em>verified</em> or <em>assumed</em>. An architecture gate that
      checks internal consistency before more geometry gets drawn. And a build-readiness gate
      that <strong>refuses to let the design claim it's manufacturable</strong> while critical
      hardware inputs are still unknown — deliberately conservative, by design.</p>

      <h4>Scope, stated up front</h4>
      <p>This is analytical screening: closed-form propulsion, control and structural estimates.
      Not CFD, not FEA, not flight-certified, no hardware validated. The repo enforces that
      claim on itself rather than asking you to trust the README — which is the actual point.</p>
      ${repo('https://github.com/kartikdubeycoded/BUDDY', 'github.com/kartikdubeycoded/BUDDY')}
    `,
  },

  nucdesal: {
    title: 'Siting Nuclear Desalination for India',
    tag: 'Research paper · in development',
    body: `
      <p>India is short of fresh water and short of firm power, and the two shortages make
      each other worse: desalination is enormously energy-hungry, so solving water with
      fossil power just moves the cost somewhere else. A nuclear plant is one of the few
      things that can supply both at once — steady electricity, plus the low-grade waste
      heat that desalination actually wants.</p>

      <p>That turns the interesting question into a <strong>geospatial</strong> one:
      <em>where in India should such a plant go?</em> This paper treats that as a
      multi-criteria site-selection problem rather than an opinion.</p>

      <h4>The approach</h4>
      <p>Assemble the geologic and geographic record for India — terrain, seismic and
      ground conditions, coastal and water access, existing water stress, population and
      demand, land use, grid proximity — and score candidate locations against all of it
      together. A site that is geologically sound but far from the people who need the
      water is not a good site; neither is a thirsty region sitting on the wrong ground.
      The output is a ranking with the reasoning attached, not a single answer.</p>

      <h4>One plant, three loads</h4>
      <ul>
        <li><strong>Power</strong> — firm baseload into the regional grid.</li>
        <li><strong>Desalination</strong> — fresh water, driven largely by heat that would
          otherwise be dumped.</li>
        <li><strong>Algae treatment</strong> — warm-water algal tanks for biological water
          cleaning, fed by the same low-grade heat further down the temperature cascade.</li>
      </ul>
      <p>The point of the stacking is that each stage uses what the stage above it throws
      away, so the siting criteria have to satisfy all three at once — which is precisely
      what makes it a harder and more honest optimisation than siting for power alone.</p>

      <h4>Scope, stated up front</h4>
      <p>This is a <strong>screening study</strong>: it identifies and ranks candidate
      regions from open geospatial data. It is not a reactor design, not a safety case, and
      not a regulatory submission — those are different disciplines with different evidence
      bars. Assumptions are labelled as assumptions, the same discipline I build into the
      software: the work is only worth as much as what it refuses to claim.</p>

      <h4>Status</h4>
      <p>In development — data assembly and method design. I'll publish it here when there's
      something worth reading rather than something worth announcing.</p>
    `,
  },

  'katti-os': {
    title: 'katti-os',
    tag: 'The frame the rest plug into · in progress',
    body: `
      <p>katti-os isn't one more project in the list — it's the frame the others sit inside. A
      personal operating system that runs my work like an org: a persistent COO-style agent at
      the top, delegating to specialist sub-agents across projects, study, health and money,
      each with its own scope, memory and judgment.</p>

      <h4>The idea</h4>
      <p>One brain, many hands. The COO holds a three-layer memory — working, episodic,
      long-term understanding — and delegates real work to project agents. A council of local
      models votes on hard calls so the system stays honest and never just agrees with
      itself.</p>

      <h4>Where it actually is</h4>
      <p>Being built, one organ at a time — and I'd rather say that than call it finished.
      <strong>Project Jay is the nervous system, and Jay already works.</strong> The other
      projects here are the limbs: retrieval that cites, models that explain, tools that refuse
      to overclaim. The orchestration layer on top is the part still under the bench.</p>

      <h4>Why it matters</h4>
      <p>Most "AI assistants" are a chat box. This is an org chart — delegation, memory, and an
      anti-sycophancy layer. That's the difference between a toy and a system you'd trust to act
      on your behalf.</p>
    `,
  },

  tcs: {
    title: 'TCS · Industrial RAG',
    tag: 'Internship · 2025–2026 · shipped',
    body: `
      <p>Built and deployed an industrial-document Q&A system over thousands of pages of
      OEM service manuals, so field engineers can ask in plain language and get a
      grounded, citation-backed answer pointing to the exact section.</p>

      <h4>What I owned</h4>
      <ul>
        <li>The <strong>chunking pipeline</strong> — the highest-leverage piece. Standard
          splitters destroyed tables and figure callouts; I rewrote it to preserve section
          hierarchy and table structure.</li>
        <li>Qdrant schema + metadata filters (manual, section, machine type).</li>
        <li>End-to-end integration, deployment, and a small eval set reviewed by a senior engineer.</li>
      </ul>

      <h4>Outcome</h4>
      <p>Shipped into the client's engineering workflow. Stack: nomic-embed-text + Qdrant,
      grounded generation that refuses when retrieval confidence is low.</p>

      <h4>What I did with it after</h4>
      <p>The client's manuals stayed the client's. The <em>architecture</em> came with me — I
      rebuilt it in the open on public marine-engine manuals and pushed it further, with an
      agentic retrieval loop and a fault-cascade graph. You can run that one yourself.</p>
      ${repo('https://github.com/kartikdubeycoded/agentic-rag-engine', 'See the open version → agentic-rag-engine')}
    `,
  },

  reliance: {
    title: 'Reliance · Churn Prediction',
    tag: 'ML Internship · 2024–2025 · shipped',
    body: `
      <p>End-to-end customer-churn prediction plus exploratory analysis across several
      internal projects — turning raw operational data into decisions, not just charts.</p>

      <h4>The work</h4>
      <ul>
        <li>RFM + behavioural features, tenure-based segmentation.</li>
        <li>Gradient-boosted classifier (XGBoost/LightGBM), stratified CV, calibrated for
          threshold tuning.</li>
        <li><strong>SHAP explainability</strong> per prediction — so retention teams saw
          <em>why</em> a customer was flagged, not just that they were. That's what made
          non-ML teams trust it.</li>
      </ul>

      <h4>Takeaway</h4>
      <p>The first time I shipped a model where the deliverable was a business decision,
      not a metric on a slide. It's also where the rule in everything since came from: a
      prediction nobody can interrogate doesn't get used.</p>
    `,
  },

  'reliance-retail': {
    title: 'Reliance Retail · Risk & Compliance',
    tag: 'Internship · Risk & Compliance',
    body: `
      <p>A data internship inside Reliance Retail's risk &amp; compliance function —
      working with operational data in a large, regulated enterprise environment to
      support risk monitoring and compliance reporting.</p>

      <h4>The work</h4>
      <ul>
        <li>Worked with business and compliance data to support risk-flagging and
          reporting workflows.</li>
        <li>Turned messy operational data into clean, decision-ready views for
          stakeholders.</li>
      </ul>

      <h4>Takeaway</h4>
      <p>Early exposure to how data moves — and how much it matters — inside a large,
      regulated organisation. Unglamorous, and the reason I take data hygiene seriously.</p>
    `,
  },
}
