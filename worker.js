import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/login') {
      const scope = 'streaming user-read-email user-read-private user-modify-playback-state';
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: env.SPOTIFY_CLIENT_ID,
        scope,
        redirect_uri: env.REDIRECT_URI,
      });
      return Response.redirect(`https://accounts.spotify.com/authorize?${params}`, 302);
    }

    if (url.pathname === '/api/callback') {
      const code = url.searchParams.get('code');
      if (!code) return Response.redirect('/?error=no_code', 302);
      const credentials = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);
      const res = await fetch('https://accounts.spotify.com/api/token', {
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
      if (!res.ok) return Response.redirect('/?error=auth_failed', 302);
      const data = await res.json();
      return Response.redirect(`/?access_token=${data.access_token}&refresh_token=${data.refresh_token}`, 302);
    }

    if (url.pathname === '/api/refresh' && request.method === 'POST') {
      const body = await request.json();
      const credentials = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);
      const res = await fetch('https://accounts.spotify.com/api/token', {
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
      if (!res.ok) return new Response(JSON.stringify({ error: 'refresh_failed' }), { status: 400 });
      const data = await res.json();
      return new Response(JSON.stringify({ access_token: data.access_token }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      return await getAssetFromKV(
        { request, waitUntil: ctx.waitUntil.bind(ctx) },
        { ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: assetManifest }
      );
    } catch {
      return new Response('Not found', { status: 404 });
    }
  }
};
