export async function onRequestGet({ env }) {
  const data = await env.CALENDAR_KV.get('overrides');
  return new Response(data || '{}', {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json();
  await env.CALENDAR_KV.put('overrides', JSON.stringify(body));
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
