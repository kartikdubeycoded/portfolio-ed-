// Long-form detail content for the dossier windows. Markdown-light HTML.

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

      <h4>Right now</h4>
      <p>Final-year B.Tech Data Science at Manipal University Jaipur, based in Navi Mumbai.
      Three internships behind me; now building a portfolio of systems I'd want to be
      hired off of — multi-agent, RAG, applied ML.</p>

      <h4>How I am</h4>
      <p>Direct. I'd rather hear the truth than be managed, and I give the same back.
      Intense about the things I care about, allergic to busywork that ships nothing.</p>

      <h4>What I'm looking for</h4>
      <p>Real AI/ML work — systems that run for real users — or interesting freelance.
      <a href="mailto:kartikdubey1934@gmail.com">Say hello.</a></p>
    `,
  },

  'katti-os': {
    title: 'katti-os',
    tag: 'Personal AI Operating System · multi-agent',
    body: `
      <p>A personal AI operating system that runs your life like a company. A persistent
      COO-style agent sits at the top and orchestrates specialist sub-agents across your
      projects, study, health and money — each with its own scope, memory and judgment.</p>

      <h4>The idea</h4>
      <p>One brain, many hands. The COO holds a three-layer memory (working, episodic,
      long-term understanding) and delegates real work to project agents. A council of
      local models votes on hard calls so the system stays honest and never just agrees
      with itself. You talk to it by voice or WhatsApp; it runs 24/7 for about $25/mo.</p>

      <h4>Why it matters</h4>
      <p>Most "AI assistants" are a chat box. This is an org chart — delegation, memory,
      and an anti-sycophancy layer — the difference between a toy and a system you'd
      actually trust to act on your behalf.</p>
    `,
  },

  lexara: {
    title: 'Lexara',
    tag: 'Multi-agent legal intelligence',
    body: `
      <p>An ethical legal-RAG engine where four specialist agents run a question end to
      end — Parser, Librarian, Drafter, Critic — and hand work to each other like a real
      legal team.</p>

      <h4>The idea</h4>
      <p>Single-LLM legal chatbots sit around 65% accuracy and bluff when unsure. Lexara
      targets <strong>92–95%</strong> by splitting the job: hybrid retrieval finds the
      right passages, the Drafter cites every claim inline, and a Critic agent verifies
      each citation and sends it back if it doesn't hold up. It would rather refuse than
      hallucinate.</p>

      <h4>Why it matters</h4>
      <p>In law, a confident wrong answer is worse than no answer. Lexara is built so
      every sentence is traceable to a source — trust by construction, not by hope.</p>
    `,
  },

  grpo: {
    title: 'GRPO Trading',
    tag: 'Self-correcting multi-agent trading',
    body: `
      <p>A trading system where specialist agents — scalper, sentiment, momentum —
      compete on the same live market feed, and a relative-reward judge continuously
      reweights how much each one is trusted based on recent performance.</p>

      <h4>The idea</h4>
      <p>No single strategy wins forever. Borrowing from Group-Relative Policy
      Optimization, the system scores each agent against the group every cycle and shifts
      capital toward whoever's actually working right now — a market that picks its own
      experts and fires the cold ones.</p>

      <h4>Why it matters</h4>
      <p>It turns a static strategy into a living one: self-correcting allocation that
      adapts as the market changes, with a Streamlit cockpit to watch it think.</p>
    `,
  },

  tribe: {
    title: 'TRIBE-Industrial',
    tag: 'Tri-modal diagnostic AI · research',
    body: `
      <p>An AI that diagnoses industrial machines the way a senior engineer does — by
      fusing what it <em>sees</em>, what it <em>hears</em>, and what it's <em>told</em>
      into a single judgment, then pointing to the exact manual section that fixes it.</p>

      <h4>The idea</h4>
      <p>Point a camera at a failing machine, capture its sound and vibration, describe
      the symptom out loud — three signals, one answer. It adapts a frontier neuroscience
      architecture (built to predict brain activity from multimodal input) to the factory
      floor, working air-gapped where the cloud can't reach.</p>

      <h4>Why it matters</h4>
      <p>The senior engineer who can diagnose by feel is retiring everywhere. This is an
      attempt to capture that instinct — and target a <strong>15–20% jump</strong> in
      retrieval accuracy over text-only systems.</p>
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
      not a metric on a slide.</p>
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
        <li>Worked with business and compliance data to support risk flagging and
          reporting workflows.</li>
        <li>Translated messy operational data into clean, decision-ready views for
          stakeholders.</li>
      </ul>

      <p><em>(Kartik — fill in the real specifics here: what systems/tools, what you
      built, any outcome. I framed it from the title without inventing numbers.)</em></p>
    `,
  },
};
