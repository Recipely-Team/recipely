/**
 * Checks the LIVE production API certificate chain against the pins the app
 * ships (plugins/withApiCertificatePinning.js). Run before every release and
 * after any change to the API host's TLS: a chain that matches no pin means the
 * pinned app cannot reach the API at all.
 *
 * Needs the network, so it is not part of check:structure. `npm run verify:pins`.
 */
import { createHash, X509Certificate } from 'node:crypto';
import { createRequire } from 'node:module';
import tls from 'node:tls';

const require = createRequire(import.meta.url);
const { PINNED_HOST, ROOT_PINS } = require('../plugins/withApiCertificatePinning.js');

const spki = (cert) =>
  createHash('sha256').update(cert.publicKey.export({ type: 'spki', format: 'der' })).digest('base64');

const chain = await new Promise((resolve, reject) => {
  const socket = tls.connect({ host: PINNED_HOST, port: 443, servername: PINNED_HOST }, () => {
    const certs = [];
    let cert = socket.getPeerCertificate(true);
    const seen = new Set();
    while (cert && cert.raw && !seen.has(cert.fingerprint256)) {
      seen.add(cert.fingerprint256);
      certs.push(new X509Certificate(cert.raw));
      cert = cert.issuerCertificate;
    }
    socket.end();
    resolve(certs);
  });
  socket.setTimeout(15_000, () => socket.destroy(new Error(`timed out connecting to ${PINNED_HOST}`)));
  socket.on('error', reject);
});

const pins = new Map(ROOT_PINS.map((pin) => [pin.spkiSha256, pin.name]));
let matched = null;
for (const cert of chain) {
  const digest = spki(cert);
  const name = pins.get(digest);
  console.log(`  ${name ? '✓' : '·'} ${cert.subject.replace(/\n/g, ', ')}  ${digest}`);
  matched ??= name ?? null;
}
if (matched === null) {
  console.error(`verify:pins — ${PINNED_HOST}'s chain matches none of the app's pins; the pinned app would be offline.`);
  process.exit(1);
}
console.log(`verify:pins — OK: ${PINNED_HOST} chains to ${matched}`);
