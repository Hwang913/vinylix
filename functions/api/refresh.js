export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const body = await request.json();
  const credentials = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: body.refresh_token,
    }),
  });
  if (!response.ok) return new Response(JSON.stringify({ error: 'refresh_failed' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  const data = await response.json();
  return new Response(JSON.stringify({ access_token: data.access_token }), { headers: { 'Content-Type': 'application/json' } });
}
