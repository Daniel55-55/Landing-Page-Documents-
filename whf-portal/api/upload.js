// ═══════════════════════════════════════════════════════════════
// WHF Portal — Backend Proxy for DiGiFi API
// Keeps API Key server-side (never exposed to browser)
// Vercel Serverless Function
// ═══════════════════════════════════════════════════════════════

export const config = {
  api: {
    bodyParser: false,  // We handle raw multipart/form-data
  },
};

const DIGIFI_API_KEY     = process.env.DIGIFI_API_KEY;
const DIGIFI_BASE_URL    = 'https://api.cloud.digifi.io/application-documents';
const DIGIFI_API_VERSION = '2024-02-26';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Guard: API key must be set in Vercel env vars
  if (!DIGIFI_API_KEY) {
    return res.status(500).json({
      error: 'DIGIFI_API_KEY not configured in Vercel environment variables'
    });
  }

  try {
    // Read raw body as buffer
    const rawBody = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });

    // Forward to DiGiFi with the API key added server-side
    const digifiResponse = await fetch(DIGIFI_BASE_URL, {
      method: 'POST',
      headers: {
        'api-key':     DIGIFI_API_KEY,
        'api-version': DIGIFI_API_VERSION,
        'content-type': req.headers['content-type'], // preserve multipart boundary
      },
      body: rawBody,
    });

    const responseText = await digifiResponse.text();

    // Log for Vercel dashboard visibility
    console.log(`DiGiFi ${digifiResponse.status}:`, responseText.slice(0, 200));

    // Return DiGiFi's response back to the browser
    res.status(digifiResponse.status)
       .setHeader('Content-Type', 'application/json')
       .send(responseText);

  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
}
