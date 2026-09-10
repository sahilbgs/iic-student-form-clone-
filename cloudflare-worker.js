// ============================================================================
// Cloudflare Worker: Zero-Downtime Fallback Engine for GTU-ITR Portal
// Same-URL Registration Failover (Netlify + Firebase)
// ============================================================================
// KAAM KAISE KARTA HAI:
// 1. Jab student "https://iic-gtu-itr.aceglory.in/posts/12/register" open karega:
// 2. Agar aapka Linux server ON hai -> Normal server se page khulega.
// 3. Agar aapka server BAND hai (521 Error / 1033 Tunnel down / 502 Bad Gateway):
//    -> Cloudflare Worker turant Netlify se standby form fetch karke student ko
//       BILKUL SAME LINK PAR dikha dega!
//       Student ka URL change nahi hoga aur registration Firebase mein save ho jayegi!
// ============================================================================

// Yahan apna Netlify URL daalein:
const NETLIFY_SITE_URL = "https://gtu-itr-registration.netlify.app";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Sirf registration links ya poore domain ke liye failover handle karein
    const isRegistrationPath = url.pathname.includes('/register') || url.pathname.includes('/posts/');

    try {
      // 1. Primary server (Cloudflare Tunnel) ko request bhejte hain
      const response = await fetch(request);

      // Agar server 500, 502, 503, 504, 521, 522 status code de raha ho (Server Down)
      if (!response.ok && response.status >= 500 && isRegistrationPath) {
        console.warn(`[Failover] Server returned error ${response.status}. Serving Netlify standby form on same URL.`);
        return await serveStandbyForm(request, url);
      }

      return response;

    } catch (error) {
      // 2. Server completely band hai / Cloudflare Tunnel disconnected hai
      if (isRegistrationPath) {
        console.warn('[Failover] Primary server unreachable. Serving Netlify standby form on same URL.');
        return await serveStandbyForm(request, url);
      }
      
      // Agar registration ke alawa koi aur page ho, toh bhi friendly message ya standby page
      return await serveStandbyForm(request, url);
    }
  }
};

/**
 * Netlify se standalone registration bundle fetch karke same URL par serve karta hai
 */
async function serveStandbyForm(originalRequest, originalUrl) {
  try {
    // Standby bundle fetch karein
    const fallbackTarget = `${NETLIFY_SITE_URL}/standalone.html`;
    const netlifyRes = await fetch(fallbackTarget, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': originalRequest.headers.get('User-Agent') || 'Cloudflare-Worker-Failover'
      }
    });

    if (netlifyRes.ok) {
      const html = await netlifyRes.text();

      // Same URL par HTML return karte hain
      return new Response(html, {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=UTF-8',
          'x-server-status': 'standby-active',
          'cache-control': 'no-cache, no-store, must-revalidate'
        }
      });
    }
  } catch (err) {
    console.error('[Failover] Error fetching from Netlify:', err);
  }

  // Backup emergency message agar Netlify bhi na mile
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head><title>GTU-ITR Portal Standby</title></head>
    <body style="font-family:sans-serif; text-align:center; padding:50px;">
      <h2>GTU-ITR Activity Registration - Standby Mode</h2>
      <p>Primary server is currently offline for maintenance.</p>
      <p><a href="${NETLIFY_SITE_URL}" style="color:#0f52ba; font-weight:bold;">Click here to register on Netlify Cloud Mirror</a></p>
    </body>
    </html>
  `, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=UTF-8' }
  });
}
