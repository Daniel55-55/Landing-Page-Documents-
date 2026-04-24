// ═══════════════════════════════════════════════════════════════
// WHF Portal — Backend Proxy for DiGiFi API
// Batch Upload + UUID resolution
// Vercel Serverless Function
// ═══════════════════════════════════════════════════════════════

export const config = {
  api: {
    bodyParser: false,
    maxDuration: 60,
  },
};

const DIGIFI_API_KEY      = process.env.DIGIFI_API_KEY;
const DIGIFI_API_VERSION  = '2024-02-26';
const DIGIFI_BATCH_URL    = 'https://api.cloud.digifi.io/application-documents/batch';
const DIGIFI_APP_LIST_URL = 'https://api.cloud.digifi.io/applications';

export default async function handler(req, res) {

  // ── CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!DIGIFI_API_KEY) {
    return res.status(500).json({ error: 'DIGIFI_API_KEY not configured in Vercel' });
  }

  try {
    // Read raw multipart body
    const rawBody = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end',  ()    => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });

    const contentType = req.headers['content-type'] || '';
    const boundary = contentType.split('boundary=')[1];

    // Extract displayId and productId from multipart form
    let displayId = null;
    let productId = null;
    if (boundary) {
      const bodyStr = rawBody.toString('latin1');
      const displayIdMatch = bodyStr.match(/name="applicationId"\r\n\r\n([^\r\n]+)/);
      const productIdMatch  = bodyStr.match(/name="productId"\r\n\r\n([^\r\n]+)/);
      if (displayIdMatch) displayId = displayIdMatch[1].trim();
      if (productIdMatch)  productId  = productIdMatch[1].trim();
    }

    console.log('displayId:', displayId, '| productId:', productId);

    // Resolve UUID from displayId
    let applicationUUID = displayId;

    if (displayId && productId) {
      try {
        const searchURL = `${DIGIFI_APP_LIST_URL}?search=${displayId}&productId=${productId}&limit=5`;
        const searchRes = await fetch(searchURL, {
          headers: {
            'api-key':     DIGIFI_API_KEY,
            'api-version': DIGIFI_API_VERSION,
            'accept':      'application/json'
          }
        });
        const searchData = await searchRes.json();
        console.log('Search response:', JSON.stringify(searchData).slice(0, 300));

        const items = searchData.items || searchData.applications || searchData.data || [];
        const match = items.find(app =>
          app.displayId === displayId ||
          app.application_display_id === displayId ||
          String(app.displayId) === String(displayId)
        );

        if (match) {
          applicationUUID = match.id || match._id || match.applicationId || displayId;
          console.log('Resolved UUID:', applicationUUID);
        } else {
          console.log('No UUID match, using displayId directly');
        }
      } catch (searchErr) {
        console.log('UUID resolution failed, using displayId:', searchErr.message);
      }
    }

    // Rebuild form replacing displayId with UUID if different
    let finalBody = rawBody;
    if (applicationUUID !== displayId && boundary) {
      const bodyStr = rawBody.toString('latin1');
      const updated = bodyStr.replace(
        /name="applicationId"\r\n\r\n[^\r\n]+/,
        `name="applicationId"\r\n\r\n${applicationUUID}`
      );
      finalBody = Buffer.from(updated, 'latin1');
    }

    // POST to DiGiFi batch endpoint
    const digifiResponse = await fetch(DIGIFI_BATCH_URL, {
      method: 'POST',
      headers: {
        'api-key':      DIGIFI_API_KEY,
        'api-version':  DIGIFI_API_VERSION,
        'content-type': contentType,
      },
      body: finalBody,
    });

    const responseText = await digifiResponse.text();
    console.log(`DiGiFi batch ${digifiResponse.status}:`, responseText.slice(0, 400));

    res.status(digifiResponse.status)
       .setHeader('Content-Type', 'application/json')
       .send(responseText);

  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
}
