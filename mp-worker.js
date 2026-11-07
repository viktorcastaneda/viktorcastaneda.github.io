/**
 * Proxy mínimo para la API Point de Mercado Pago (Cloudflare Worker).
 *
 * Por qué existe: el Access Token de Mercado Pago es secreto y la API no
 * acepta llamadas directas desde el navegador (CORS). Este Worker guarda el
 * token como secreto y sólo reenvía las rutas /point/integration-api/*.
 *
 * Variables (Workers → Settings → Variables, como "Secret"):
 *   MP_TOKEN      Access Token de producción de tu aplicación en Mercado Pago
 *   CASVEL_KEY    Clave que inventas; la misma que pones en ⚙️ de cobros.html
 *   ALLOW_ORIGIN  (texto) https://viktorcastaneda.github.io
 */
export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOW_ORIGIN || 'https://viktorcastaneda.github.io',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,X-Casvel-Key',
      'Vary': 'Origin'
    };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(req.url);
    if (req.headers.get('X-Casvel-Key') !== env.CASVEL_KEY)
      return new Response(JSON.stringify({ message: 'No autorizado' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (!url.pathname.startsWith('/point/integration-api/'))
      return new Response(JSON.stringify({ message: 'Ruta no permitida' }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } });

    const headers = { Authorization: 'Bearer ' + env.MP_TOKEN, 'Content-Type': 'application/json' };
    if (req.method === 'POST') headers['X-Idempotency-Key'] = crypto.randomUUID();
    const r = await fetch('https://api.mercadopago.com' + url.pathname + url.search, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.text()
    });
    return new Response(await r.text(), { status: r.status, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
};
