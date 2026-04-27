export async function onRequest(context) {
  const { env } = context;
  const scope = 'streaming user-read-email user-read-private user-modify-playback-state';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: env.REDIRECT_URI,
  });
  return Response.redirect(`https://accounts.spotify.com/authorize?${params}`, 302);
}
