export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) return Response.redirect('/?error=no_code', 302);
  const credentials = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.REDIRECT_URI,
    }),
  });
  if (!response.ok) return Response.redirect('/?error=auth_failed', 302);
  const data = await response.json();
  return Response.redirect(`/?access_token=${data.access_token}&refresh_token=${data.refresh_token}`, 302);
}
