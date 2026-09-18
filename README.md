# catrinar_v6

Static website for Mihai Catrinar, focused on education, experiential learning, speaking, writing, and Outdoor Joy.

## Local preview

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Browser tests

The repository includes a pinned Playwright suite that serves the site from a `/catrinar_v6/` subpath to verify relative assets and navigation behavior.

```bash
npm ci
npm run test:e2e:install
npm run test:e2e
```

The tests cover:

- 390px, 768px, and 1440px layouts
- image loading and horizontal overflow checks
- section links and key CTA targets
- mobile menu open/close, Escape handling, and desktop resize cleanup
- lightbox focus trapping, backdrop/Escape close, and opener restore
- reduced-motion defaults, explicit motion toggling, and blocked `localStorage`
- no-JavaScript navigation and gallery fallback behavior
- console and page errors during scripted flows

## Motion behavior

- If the browser requests reduced motion and no explicit preference has been saved, motion starts off.
- The motion toggle stores only explicit user choices (`on` or `off`) and otherwise continues following the system preference.
- When motion is off, tilt, magnetic button movement, reveal animation, and smooth scrolling are disabled together.

## GitHub Pages deployment

A static Pages workflow is included at `.github/workflows/deploy-pages.yml`.

One-time repository settings are still required if GitHub Pages has not been enabled yet:

1. GitHub → **Settings** → **Pages**
2. Under **Build and deployment**, choose **GitHub Actions** as the source
3. Merge the branch that contains the workflow into the default branch

This repository does **not** claim a live public URL until those settings are enabled and the workflow runs successfully.

## Content sources and inspiration

Primary public links used in the site content:

- https://www.linkedin.com/in/mihaicatrinar
- https://linktr.ee/mihaicatrinar
- https://twitter.com/fitnwitpe
- https://www.conceptualtransfer.com/courses/conceptual-transfer-in-physical-ed-health
- https://fitnwitpe.wordpress.com/
- https://mihaicatrinar.wordpress.com/

Visual inspiration referenced for composition and motion direction only, without copying code or branded assets:

- https://www.framer.com/marketplace/templates/untitled/
- https://templates.webflow.com/html/cinematic-portfolio-website-template

## Limitations

- The site is a plain HTML/CSS/JS build with no CMS integration.
- Browser verification depends on a local Chromium/Playwright environment.
- Publication still depends on repository-level Pages activation and a successful workflow run after merge.
