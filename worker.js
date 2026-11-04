// Cloudflare Worker: serves the site (static files) and proxies TMDB at /api/tmdb
// so the browser never contacts api.themoviedb.org directly and the key stays secret.
// Set TMDB_KEY in Cloudflare -> your Worker -> Settings -> Variables and Secrets (type: Secret).

export default {
  async fetch(request, env) {
    const u = new URL(request.url);
    if (u.pathname !== '/api/tmdb') return env.ASSETS.fetch(request);

    if (!env.TMDB_KEY) return json(500, { error: 'TMDB_KEY is not set' });
    const path = u.searchParams.get('path') || '';

    // Only allow the TMDB endpoints this site actually uses
    if (!/^\/(movie|tv|search|trending)\/[\w\/]+(\?[\w=&%.,\-+'!*()~]*)?$/.test(path)) {
      return json(400, { error: 'Invalid path' });
    }
    const sep = path.includes('?') ? '&' : '?';
    const url = `https://api.themoviedb.org/3${path}${sep}api_key=${env.TMDB_KEY}&language=en-US`;
    try {
      const res = await fetch(url);
      return new Response(await res.text(), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' }
      });
    } catch (e) {
      return json(502, { error: 'Could not reach TMDB' });
    }
  }
};

function json(status, obj) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
