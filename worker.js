// Minimal Worker entry point for Workers Assets.
//
// Wrangler 4.x requires a `main` entry even for assets-only deploys. The
// Cloudflare-managed build synthesised one for us; when deploying via
// our own GitHub Actions pipeline we have to provide it explicitly.
//
// All logic lives in the Assets binding (which honours the
// `not_found_handling: "single-page-application"` config in
// wrangler.jsonc), so the Worker just forwards every request to it.
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
