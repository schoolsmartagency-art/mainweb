const BOARD_KEY = 'board';
const EMPTY_BOARD = JSON.stringify({ directions: [] });

export default {
  async fetch(request, env) {
    const authResponse = checkAuth(request, env);
    if (authResponse) return authResponse;

    const url = new URL(request.url);

    if (url.pathname === '/api/board') {
      return handleBoard(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleBoard(request, env) {
  if (request.method === 'GET') {
    const data = await env.BOARD_KV.get(BOARD_KEY);
    return new Response(data || EMPTY_BOARD, {
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  if (request.method === 'PUT') {
    const body = await request.text();
    try {
      JSON.parse(body);
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }
    await env.BOARD_KV.put(BOARD_KEY, body);
    return new Response('OK');
  }

  return new Response('Method not allowed', { status: 405 });
}

function checkAuth(request, env) {
  if (!env.DASHBOARD_PASSWORD) return null;

  const header = request.headers.get('Authorization') || '';
  const expected = 'Basic ' + btoa(`admin:${env.DASHBOARD_PASSWORD}`);

  if (header === expected) return null;

  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Cantor CRM"' },
  });
}
