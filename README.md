# Kartik Dubey — Portfolio

A cinematic, single-page portfolio. One continuous painted scene — forest canopy →
waterfall → pool — that you descend by scrolling, with a procedural origami dove
gliding through as a navigator. Built to feel like a piece of motion, not a webpage.

**Concept:** *Intense × Nature* — brutalist, screen-scale typography fused with a
serene painted world. One stitched background that scrolls as a single layer; the
content lives inside the scene rather than floating above it.

## Stack
- **Vite** — build tooling
- **Vanilla JS** (ES modules, no framework)
- **Three.js** — the procedural low-poly dove (navigator) + atmosphere
- **GSAP + ScrollTrigger** — scroll-driven choreography
- **Lenis** — smooth momentum scrolling

## Features
- One stitched, scroll-linked scene (canopy → falls → pool)
- Procedural Three.js dove with velocity-derived heading + wing-beat, weaving
  section to section and landing in the pool
- Screen-scale display type, kinetic marquee, live status HUD, blood-red accents
- Floating, box-free content with scramble-reveal headlines
- Dossier modals for each project & role
- Custom cursor, mobile fallback

## Run locally
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

## Contact
Kartik Dubey — Data Scientist · AI Engineer · Systems Architect
📍 Navi Mumbai · ✉️ kartikdubey1934@gmail.com
