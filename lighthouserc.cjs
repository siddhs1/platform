/**
 * Lighthouse CI — mobile performance gate for the three seeded demo tenants.
 *
 * Lighthouse defaults to a mobile form factor with Moto-G-class CPU + network
 * throttling, which is exactly the Week-2 bar (>=95 mobile). The CI job adds
 * /etc/hosts entries so the demo subdomains resolve to the local server, then
 * lhci starts `next start`, navigates to each real demo URL (so the hostname
 * middleware resolves the right tenant from the Host header), runs Lighthouse,
 * and asserts the category scores below.
 *
 * Prerequisites (handled by the CI job):
 *   - app built:  pnpm --filter @platform/sites build
 *   - DATABASE_URL / DIRECT_URL pointing at the seeded Neon DB, so the demo
 *     hosts resolve to real published configs.
 *
 * numberOfRuns is 3 so the gate asserts against the MEDIAN run, not a single
 * noisy mobile audit. Lower it to 1 for faster (but flakier) CI if needed.
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: "pnpm --filter @platform/sites start",
      startServerReadyPattern: "Ready in",
      startServerReadyTimeout: 60000,
      numberOfRuns: 3,
      url: [
        "http://demo-roofing.localhost:3000/",
        "http://demo-dental.localhost:3000/",
        "http://demo-bistro.localhost:3000/",
      ],
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.95 }],
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
      },
    },
  },
};
