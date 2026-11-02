// Netlify Function: proxies requests to TMDB so the browser never contacts
// api.themoviedb.org directly (avoids ISP blocks) and the API key stays secret.
// Set TMDB_KEY in Netlify -> Site configuration -> Environment variables.

exports.handler = async (event) => {
  const key = process.env.TMDB_KEY;
  if (!key) {
    return json(500, { error: 'TMDB_KEY environment variable is not set' });
  }

  const path = (event.queryStringParameters || {}).path || '';

  // Only allow the TMDB endpoints this site actually uses
  if (!/^\/(movie|tv|search|trending)\/[\w\/]+(\?[\w=&%.,\-+'!*()~]*)?$/.test(path)) {
    return json(400, { error: 'Invalid path' });
  }

  const sep = path.includes('?') ? '&' : '?';
  const url = `https://api.themoviedb.org/3${path}${sep}api_key=${key}&language=en-US`;

  try {
    const res  = await fetch(url);
    const body = await res.text();
    return {
      statusCode: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'
      },
      body
    };
  } catch (e) {
    return json(502, { error: 'Could not reach TMDB' });
  }
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  };
}
