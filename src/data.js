// Long-form detail content for modals. Markdown-light HTML strings.

export const details = {
  katti: {
    title: 'Katti',
    tag: 'Kartik Dubey · the person behind the work',
    body: `
      <p>I think in systems before I think in code. Give me a hard problem and the
      first thing that forms in my head isn't a function — it's an architecture:
      the agents, the memory layers, the data flow, where it breaks. That intuition
      is the thing I trust most about myself.</p>

      <h4>How I work</h4>
      <p>Architect first, engineer second — and closing that gap fast. I treat
      a frontier LLM as my engineering team and I do the part that matters: scoping the
      real problem, designing the system, deciding what's worth building. I'd
      rather ship one ugly real thing than design a perfect one that never runs.
      Output over input — making beats consuming, every day.</p>

      <h4>What I'm doing right now</h4>
      <p>I finished a year-long industrial-RAG internship at TCS and turned down
      the return offer — the pay was low and the stack was legacy. So I'm spending
      this window building the work I actually want to be hired off of: multi-agent
      systems, RAG pipelines, applied ML, in public, on a ~200-commit run. High
      risk, eyes open, on purpose.</p>

      <h4>How I am</h4>
      <p>Direct. I'd rather hear the truth than be managed, and I give the same
      back — I don't tell people what they want to hear, including the AI I build
      with. Intense about the things I care about, allergic to busywork that looks
      productive but ships nothing. Based in Navi Mumbai, final-year B.Tech Data
      Science at Manipal University Jaipur.</p>

      <h4>What I'm looking for</h4>
      <p>Real production AI/ML work — systems that actually run for real users —
      or interesting freelance that pays. If that's you,
      <a href="mailto:kartikdubey1934@gmail.com">say hello</a>.</p>
    `,
  },

  'katti-os': {
    title: 'katti-os',
    tag: 'Personal AI Operating System · multi-agent · in progress',
    body: `
      <p>A persistent COO-style LLM (a frontier LLM Sonnet) orchestrating specialist project
      agents (Haiku, Gemini) over a 3-layer memory system, with a council of local
      LLMs (Qwen, Gemma, Mistral, Phi, DeepSeek, Llama) acting as an
      anti-sycophancy verdict layer.</p>

      <h4>Architecture (outside-in)</h4>
      <ol>
        <li><strong>You (CEO)</strong> — WhatsApp + voice + dashboard interface.</li>
        <li><strong>J (COO brain)</strong> — a frontier LLM Sonnet via API, runs 24/7 on
          always-on laptop. Personality: direct, holds positions, never sycophantic.</li>
        <li><strong>Project Boss agents</strong> — Haiku, one per major life area
          (income, study, health, repos).</li>
        <li><strong>Sub-agents</strong> — Gemini 2.0 Flash free tier, do actual work
          under their Project Boss.</li>
        <li><strong>Council of local LLMs</strong> — Qwen + Gemma + Mistral + Phi
          + DeepSeek + Llama running on RTX 4050 via Ollama. Blind-first vote →
          critique round → verdict. J consults the council when uncertain.</li>
        <li><strong>Shared memory</strong> — 3-layer split: working (24h SQLite),
          episodic (full history), understanding (extracted patterns).</li>
        <li><strong>Voice front</strong> — Deepgram Flux (listening, barge-in,
          end-of-turn) → Sonnet → Cartesia Sonic-3 (talking). Plasma orb UI.</li>
        <li><strong>Orchestration</strong> — LangGraph for Project Boss state
          machines, conditional edges, token-count carried in state.</li>
      </ol>

      <h4>Hardware</h4>
      <p>Old i3 8GB Win10 = always-on katti-os server. Ryzen 9 + RTX 4050 = dev /
      heavy compute. Shared SQLite over LAN (later migrate to Supabase).</p>

      <h4>Build phases</h4>
      <ul>
        <li><strong>Phase 0</strong> — WSL2, Docker, folder skeleton, git, venv.</li>
        <li><strong>Phase 1</strong> — J's brain (Sonnet API + SQLite memory + morning briefing).</li>
        <li><strong>Phase 2</strong> — Voice (Deepgram + Cartesia + orb UI).</li>
        <li><strong>Phase 3</strong> — WhatsApp via Twilio webhook.</li>
        <li><strong>Phase 4</strong> — First project agent (isolated context, scope-locked).</li>
        <li><strong>Phase 5</strong> — Multi-agent orchestration + council voting.</li>
        <li><strong>Phase 6</strong> — Production infra (Supabase, GitHub Actions, Cloudflare R2).</li>
      </ul>

      <h4>Status</h4>
      <p>Designed in detail, not built. Architecture spec'd across 7 build phases.
      Target operating cost: $25/mo.</p>
    `,
  },

  lexara: {
    title: 'Lexara',
    tag: 'Multi-Agent Ethical Legal RAG · spec\'d',
    body: `
      <p>A 4-agent legal-document Q&A pipeline targeting <strong>92–95% legal-QA
      accuracy</strong> vs the ~65% baseline of single-LLM chatbots. Hybrid retrieval,
      typed inter-agent contracts, conditional correction loop, RAGAS evaluation.</p>

      <h4>The four agents</h4>
      <ul>
        <li><strong>Agent A — Parser:</strong> PaddleOCR 2.7 + PyMuPDF (200 DPI
          raster) for scanned PDFs → Phi-3.5 Mini (Q4_K_M, ~2.2GB VRAM) tags
          section boundaries → outputs structured JSON.</li>
        <li><strong>Agent B — Librarian:</strong> Qdrant vector store, BGE-M3 +
          BM25 parallel retrieval → RRF merge with 1/(60+rank) → BGE-Reranker-v2-m3
          cross-encoder picks top-5.</li>
        <li><strong>Agent C — Drafter:</strong> Gemini 1.5 Pro (free tier, 1M
          context) OR Llama-3.1 70B. Locked prompt: cite section_id inline, refuse
          if context insufficient.</li>
        <li><strong>Agent D — Critic:</strong> Gemma-2 27B (local on T4 / HF
          ZeroGPU) OR a frontier LLM 3.5. Verification: claim extraction → citation
          lookup → contradiction check. Returns approve or CorrectionNote.
          Loop back to Drafter, max 2 hops.</li>
      </ul>

      <h4>Pipeline</h4>
      <p>Strict sequential, JSON-over-FastAPI or direct Python in single-process.
      Pydantic schemas on every boundary — no loose dicts. ~500-token chunks, 10%
      overlap, metadata {section_id, doc_name, page, doc_type}.</p>

      <h4>Evaluation</h4>
      <p>RAGAS framework, target ≥0.7 on faithfulness, answer relevancy, context
      precision, context recall. Eval set: 50–100 Q&A pairs from CUAD (Contract
      Understanding Atticus Dataset).</p>

      <h4>Deployment</h4>
      <p>HuggingFace Spaces ZeroGPU — permanent URL <code>katti-lexara.hf.space</code>,
      A100 allocated per request, FastAPI via Gradio. Zero idle cost.</p>

      <h4>Corpus options</h4>
      <p>IndianKanoon (Indian judgments / acts), SEC EDGAR (NDAs, employment
      agreements), Legislative.gov.in (Companies Act, IT Act).</p>

      <h4>Status</h4>
      <p>Spec'd in depth, 667-line architecture MD exists, zero code shipped yet.</p>
    `,
  },

  grpo: {
    title: 'GRPO Trading System',
    tag: 'Multi-agent backtest + live-signal framework · spec\'d',
    body: `
      <p>A Group Relative Policy Optimization-inspired trading system where 3+
      specialist agents (Scalper / Sentiment / Momentum) act on shared market
      data via CCXT, with a GRPO judge computing relative reward per group of
      actions and dynamically reweighting agent influence based on recent
      profitability.</p>

      <h4>Structure</h4>
      <pre><code>grpo_trading_system/
├── agents/
│   ├── base_agent.py        # parent: get_thought_process(), act(), persona
│   ├── scalper_agent.py     # RSI + volume-spike logic
│   ├── sentiment_agent.py   # whale-tracking / macro
│   └── momentum_agent.py    # trend-following
├── rewards/
│   └── grpo_judge.py        # relative reward scoreboard
├── data/
│   └── market_feed.py       # CCXT wrapper, shared dataset
├── dashboard.py             # Streamlit live UI
├── main.py
└── requirements.txt</code></pre>

      <h4>Agent layer</h4>
      <p>All inherit BaseAgent. Each defines persona + get_thought_process() +
      act() → {Buy, Sell, Hold, size}. Two variants:</p>
      <ul>
        <li>Pure math (no LLM, ~4s end-to-end)</li>
        <li>LLM-powered (Sonnet API with different system prompts per persona,
          OR local Ollama 7B with model-per-agent, OR NVIDIA NIM free-tier
          giving Llama 3.1 70B + DeepSeek-R1 + Mistral Large)</li>
      </ul>

      <h4>GRPO judge</h4>
      <p>Takes a group of actions per timestep → computes relative reward (who
      beat the group average?) → maintains rolling weight per agent → outputs
      scoreboard. Pure Python math, no LLM.</p>

      <h4>Modes</h4>
      <ul>
        <li><strong>Backtest:</strong> 5 days of history, all agents run as if
          live, ~35–50s per run with Ollama.</li>
        <li><strong>Live:</strong> every 15 min cycle, ~45s work / 14 min idle.</li>
      </ul>

      <h4>Status</h4>
      <p>Architecture designed, no code yet. Zero API cost to start (pure math).
      LLM upgrade is optional. Designed to plug into katti-os as a Phase-6
      specialist agent.</p>
    `,
  },

  tribe: {
    title: 'TRIBE-Industrial',
    tag: 'Tri-modal foundation model · research idea',
    body: `
      <p>Adapting Meta's TRIBE v2 trimodal brain-encoder architecture (V-JEPA2
      vision + Wav2Vec-BERT audio + LLaMA 3.2 text → temporal-fusion transformer)
      from neuroscience to industrial knowledge-retrieval. Instead of predicting
      fMRI voxel activity, predicts the manual-section embedding a senior field
      engineer would consult given (a) thermal/video of the malfunctioning
      machine, (b) machine audio/vibration signature, (c) operator's spoken
      complaint — enabling zero-shot retrieval over OEM service manuals in
      air-gapped industrial environments.</p>

      <h4>Three frozen feature extractors</h4>
      <ul>
        <li><strong>Visual:</strong> V-JEPA2 (Meta, March 2026). Engineer points
          camera at machine. Latent embedding of physical scene + motion. ViT-B
          fits on RTX 4050 (6GB).</li>
        <li><strong>Audio:</strong> Wav2Vec-BERT. Captures bearing noise,
          cavitation, gas-flow turbulence, RF arcing. 768-dim per frame.</li>
        <li><strong>Text:</strong> LLaMA 3.2 (1B or 3B). Operator's spoken/typed
          description ("chamber pressure dropping, RF reflected power spiking").</li>
      </ul>

      <h4>Fusion head</h4>
      <p>Temporal transformer (4–6 layers, ~50M params trainable — only this
      layer is trained). Aligns modalities on a shared time axis. Output:
      1024-dim embedding.</p>

      <h4>Output target</h4>
      <p>Instead of fMRI voxels, predict the embedding of the correct manual
      section (from existing nomic-embed-text Qdrant index). Training objective:
      contrastive loss — positive = (multimodal input, correct section embedding),
      negatives = other sections.</p>

      <h4>Training data plan</h4>
      <ul>
        <li><strong>Synthetic:</strong> pair existing industrial manual sections
          with generated (caption, sound, video) triples via diffusion + TTS.</li>
        <li><strong>Real:</strong> engineer field recordings during troubleshooting
          sessions (~50–200 hours minimum — hardest part).</li>
      </ul>

      <h4>Eval target</h4>
      <p>Recall@5 on held-out (multimodal query → manual section) pairs. Compare
      against text-only baseline (existing industrial RAG system). Target:
      <strong>+15–20% Recall@5</strong> over text-only.</p>

      <h4>Compute</h4>
      <p>Training fusion head only ≈ 1–2 days on a single A100 (HF ZeroGPU or
      rented Runpod ~$10–20). Inference fits on RTX 4050.</p>

      <h4>Status</h4>
      <p>Idea-stage research project. No code, no data. Planned deliverable: a
      2,500-word technical write-up + architecture diagrams as the "paper"
      surrogate; the post itself doubles as the spec for implementation.</p>
    `,
  },

  tcs: {
    title: 'TCS · Industrial RAG',
    tag: 'Internship · 2025 – 2026 · shipped',
    body: `
      <p>An industrial-document Q&A system over OEM service manuals, built and
      deployed for field engineers at a major industrial client during my
      year-long TCS internship.</p>

      <h4>What it does</h4>
      <p>Engineers in the field can query thousands of pages of dense
      engineering documentation in natural language — "what's the procedure
      for replacing the fuel injector on this engine model?" — and get a
      grounded, citation-backed answer pointing them to the exact section of
      the exact manual.</p>

      <h4>Stack</h4>
      <ul>
        <li><strong>Embeddings:</strong> nomic-embed-text — open-source, on-prem
          friendly, strong on technical text.</li>
        <li><strong>Vector store:</strong> Qdrant — chosen for filtering by
          metadata (manual_id, section, machine_type) and on-prem deploy.</li>
        <li><strong>Chunking:</strong> custom strategy for engineering PDFs —
          standard splitters destroyed table structure and figure callouts;
          rewrote to preserve section hierarchy and table boundaries.</li>
        <li><strong>Generation:</strong> grounded answer with inline section
          citations; refuses if retrieval confidence is low.</li>
      </ul>

      <h4>What I owned</h4>
      <ul>
        <li>The chunking pipeline (the highest-leverage piece — bad chunks =
          bad retrieval, no matter how good the LLM).</li>
        <li>Qdrant schema + metadata filters.</li>
        <li>End-to-end pipeline integration and deployment.</li>
        <li>Eval — built a small held-out QA set with senior engineer review.</li>
      </ul>

      <h4>Outcome</h4>
      <p>System shipped into the client's engineering workflow. Internship
      completed April 2026. Return offer was declined (low pay + legacy
      hardcoding stack — see <em>independent</em> entry for what came next).</p>
    `,
  },

  reliance: {
    title: 'Reliance · Churn Prediction + EDA',
    tag: 'ML Internship · 2024 – 2025 · shipped',
    body: `
      <p>End-to-end customer-churn prediction model plus exploratory data
      analysis pipelines across several internal projects during my Reliance
      data-science stint.</p>

      <h4>Churn model</h4>
      <ul>
        <li><strong>Problem:</strong> predict customer churn from operational
          + usage data in time to intervene with retention plays.</li>
        <li><strong>Feature engineering:</strong> recency / frequency / monetary
          features, behavioural deltas (engagement curves), tenure-based
          segmentation.</li>
        <li><strong>Model:</strong> gradient-boosted classifier (XGBoost /
          LightGBM family), tuned on stratified CV, calibrated for downstream
          threshold tuning.</li>
        <li><strong>Explainability:</strong> SHAP values per prediction so
          retention teams could see <em>why</em> a customer was flagged — not
          just <em>that</em> they were.</li>
      </ul>

      <h4>EDA work across projects</h4>
      <ul>
        <li>Built exploratory analysis pipelines for multiple business
          questions — converting raw operational data into decision-ready
          summaries, distributions, and segment-level insight.</li>
        <li>Notebook + report workflow oriented toward non-ML stakeholders:
          the deliverable was always "what should we do?", not "look at this
          chart".</li>
      </ul>

      <h4>What I took away</h4>
      <p>The first time I shipped a model where the result was a business
      decision, not a metric on a slide. SHAP made the difference — explaining
      the model is what made non-ML teams trust it.</p>
    `,
  },

  independent: {
    title: 'Independent · ongoing',
    tag: '2026 — present',
    body: `
      <p>Building publicly. Designing and shipping the four projects above
      (katti-os, Lexara, GRPO Trading, TRIBE-Industrial) on a ~200-commit
      target over the next quarter.</p>

      <h4>Why this phase looks the way it does</h4>
      <p>I declined the TCS return offer in April 2026 — the pay was low and
      the stack was legacy. I have 3–6 months of runway and I'm using it to
      build the portfolio of work I want to be hired off of, not the work
      I'd been doing.</p>

      <h4>What I'm working with</h4>
      <ul>
        <li>a frontier LLM (Sonnet + Opus) as the engineering team. I'm the architect.</li>
        <li>Local compute: Ryzen 9 + RTX 4050 for dev, an i3 / 8GB as a 24/7
          server target.</li>
        <li>Free-tier inference where possible — Gemini, NVIDIA NIM, HF Spaces
          ZeroGPU — to keep the operating cost near zero.</li>
      </ul>

      <h4>What I'm looking for</h4>
      <p>AI / ML engineering roles where the work is real production systems —
      RAG, multi-agent orchestration, applied ML — not LLM-API-wrapper
      product work. Or interesting freelance that pays. Reach me at
      <a href="mailto:kartikdubey1934@gmail.com">kartikdubey1934@gmail.com</a>.</p>
    `,
  },
};
