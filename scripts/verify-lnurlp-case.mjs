#!/usr/bin/env node

const names = process.argv.slice(2);
const BASE_URL = process.env.LNURL_BASE_URL || 'https://klabo.world';
const AMOUNT_MSATS = 1000;

if (names.length === 0) {
  console.log('Usage: node scripts/verify-lnurlp-case.mjs <name1> [name2...]');
  process.exit(1);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'lnurl-verifier/1.0',
    },
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: response.status, headers: Object.fromEntries(response.headers.entries()), json, text };
}

async function verify(name) {
  const encoded = encodeURIComponent(name);
  const metadataUrl = `${BASE_URL}/.well-known/lnurlp/${encoded}`;
  const metadataRes = await fetchJson(metadataUrl);
  let allPass = true;
  const okLine = (label, pass, details) => {
    console.log(`${label}\t${pass ? 'PASS' : 'FAIL'}\t${details}`);
    if (!pass) {
      allPass = false;
    }
  };

  okLine(name, metadataRes.status === 200, `metadata status=${metadataRes.status}`);
  if (metadataRes.status !== 200 || !metadataRes.json) {
    okLine(name, false, `non-json response: ${metadataRes.text.slice(0, 120)}`);
    return allPass;
  }

  const payload = metadataRes.json;
  okLine(name, payload.tag === 'payRequest', `tag=${payload.tag}`);
  okLine(name, typeof payload.callback === 'string' && payload.callback.length > 0, `callback=${payload.callback}`);
  okLine(name, Number.isFinite(payload.minSendable), `minSendable=${payload.minSendable}`);
  okLine(name, Number.isFinite(payload.maxSendable), `maxSendable=${payload.maxSendable}`);

  let identifier = '';
  let plainText = '';
  try {
    if (typeof payload.metadata === 'string') {
      const parsed = JSON.parse(payload.metadata);
      if (Array.isArray(parsed)) {
        const idPair = parsed.find((entry) => Array.isArray(entry) && entry[0] === 'text/identifier');
        const plainPair = parsed.find((entry) => Array.isArray(entry) && entry[0] === 'text/plain');
        identifier = typeof idPair?.[1] === 'string' ? idPair[1] : '';
        plainText = typeof plainPair?.[1] === 'string' ? plainPair[1] : '';
      }
    }
  } catch {
    // Ignore parse errors.
  }

  okLine(name, identifier.includes(`${name}@`), `identifier metadata=${identifier || '<missing>'}`);
  okLine(name, plainText.includes(name), `plain metadata=${plainText || '<missing>'}`);

  if (!payload.callback) {
    okLine(name, false, 'callback missing');
    return allPass;
  }

  const callbackUrl = new URL(payload.callback);
  callbackUrl.searchParams.set('amount', String(AMOUNT_MSATS));
  const invoiceRes = await fetchJson(`${callbackUrl.toString()}&ns=${encodeURIComponent(name)}`);
  okLine(name, invoiceRes.status === 200, `invoice status=${invoiceRes.status}`);
  if (invoiceRes.status !== 200) return allPass;

  const invoice = invoiceRes.json;
  okLine(name, Boolean(invoice && (invoice.pr || invoice.payment_request)), 'invoice contains bolt11');
  okLine(name, typeof invoiceRes.text === 'string' && invoiceRes.text.length > 40, 'invoice body non-empty');

  return allPass;
}

const results = await Promise.all(names.map((name) => verify(name)));
const failed = results.filter((result) => !result).length;

if (failed > 0) {
  console.log(`\nSummary: ${failed}/${results.length} case probes failed.`);
  process.exit(1);
}

console.log(`\nSummary: ${results.length}/${results.length} case probes passed.`);
