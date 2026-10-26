import leadModule from '../api/leads.js';
import eventModule from '../api/events.js';
import gateway from '../server/gateway.cjs';
import core from '../shared/core.cjs';

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-src https://calendly.com; form-action 'self'; frame-ancestors 'none'; base-uri 'self'"
};
function secure(response) {
  const result = new Response(response.body, response);
  for (const [key, value] of Object.entries(securityHeaders)) result.headers.set(key, value);
  return result;
}
async function limitedBody(request) {
  if (Number(request.headers.get('content-length')) > 16384) throw new Error('too_large');
  if (!request.body) return '';
  const reader = request.body.getReader(), decoder = new TextDecoder();
  let length = 0, result = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 16384) { await reader.cancel(); throw new Error('too_large'); }
      result += decoder.decode(value, { stream: true });
    }
    return result + decoder.decode();
  } finally { reader.releaseLock(); }
}
export async function handleApi(request, env, module, fetcher = fetch) {
  const headers = Object.fromEntries(request.headers);
  // Cloudflare sets this platform header. Ignore a browser's x-real-ip.
  headers['x-real-ip'] = request.headers.get('cf-connecting-ip') || 'unknown';
  let body;
  if (request.method === 'POST') {
    try { body = await limitedBody(request); }
    catch { return Response.json({ ok: false, code: 'invalid_body' }, { status: 400, headers: { 'Cache-Control': 'no-store' } }); }
  }
  const resultHeaders = new Headers();
  let response;
  const res = {
    statusCode: 200,
    setHeader(name, value) { resultHeaders.set(name, String(value)); },
    end(value) { response = new Response(value, { status: this.statusCode, headers: resultHeaders }); }
  };
  await module.createHandler(env, fetcher)({ method: request.method, headers, body }, res);
  return response || Response.json({ ok: false }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
}
export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.pathname === '/api/leads') return secure(await handleApi(request, env, leadModule));
      if (url.pathname === '/api/events') return secure(await handleApi(request, env, eventModule));
      if (url.pathname === '/assets/config.js') {
        if (!['GET', 'HEAD'].includes(request.method)) return secure(new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } }));
        const preview = env.FUNNEL_MODE === 'preview';
        const live = env.FUNNEL_MODE === 'live' && gateway.configured(env);
        const config = {
          previewMode: preview,
          leadEndpoint: live || preview ? '/api/leads' : '',
          bookingUrl: core.https(env.BOOKING_URL) ? env.BOOKING_URL : '',
          privacyUrl: core.https(env.PRIVACY_POLICY_URL) ? env.PRIVACY_POLICY_URL : '',
          bookingEmail: 'info@smartlearn.ca'
        };
        return secure(new Response(request.method === 'HEAD' ? null : `window.SMARTLEARN_CONFIG = Object.freeze(${JSON.stringify(config)});\n`, { headers: { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store', 'X-SmartLearn-Build': /^[a-f0-9]{40}$/.test(env.BUILD_COMMIT || '') ? env.BUILD_COMMIT : 'unversioned' } }));
      }
      // Explicit root mapping preserves the existing .html routes and link targets.
      if (url.pathname === '/') { url.pathname = '/index.html'; request = new Request(url, request); }
      if (!['GET', 'HEAD'].includes(request.method)) return secure(new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } }));
      return secure(await env.ASSETS.fetch(request));
    } catch {
      return secure(Response.json({ ok: false, code: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }));
    }
  }
};
