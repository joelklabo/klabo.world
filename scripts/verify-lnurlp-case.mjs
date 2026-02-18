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

function decodeUntilStable(rawName) {
  let value = rawName;
  for (let i = 0; i < 4; i += 1) {
    try {
      const next = decodeURIComponent(value);
      if (next === value) break;
      value = next;
    } catch {
      break;
    }
  }
  return value.replace(/%40/gi, '@');
}

function expectedLightningAddress(rawName, host) {
  const decoded = decodeUntilStable(rawName);
  const [local] = decoded.split('@');
  return `${local || decoded}@${host}`;
}

function expectedLocalPart(rawName) {
  const decoded = decodeUntilStable(rawName);
  const [local] = decoded.split('@');
  return local || decoded;
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

  const expectedLocal = expectedLocalPart(name);
  const expectedHost = (() => {
    try {
      return payload.callback ? new URL(payload.callback).host : new URL(BASE_URL).host;
    } catch {
      return new URL(BASE_URL).host;
    }
  })();
  const expectedIdentifier = expectedLightningAddress(name, expectedHost);
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
    } else if (Array.isArray(payload.metadata)) {
      const parsed = payload.metadata;
      const idPair = parsed.find((entry) => Array.isArray(entry) && entry[0] === 'text/identifier');
      const plainPair = parsed.find((entry) => Array.isArray(entry) && entry[0] === 'text/plain');
      identifier = typeof idPair?.[1] === 'string' ? idPair[1] : '';
      plainText = typeof plainPair?.[1] === 'string' ? plainPair[1] : '';
    } else if (payload.metadata && typeof payload.metadata === 'object') {
      const pairs = payload.metadata;
      identifier = typeof pairs?.['text/identifier'] === 'string' ? String(pairs['text/identifier']) : '';
      plainText = typeof pairs?.['text/plain'] === 'string' ? String(pairs['text/plain']) : '';
    }
  } catch {
    // Ignore parse errors.
  }

  okLine(
    name,
    identifier === expectedIdentifier,
    `identifier metadata=${identifier || '<missing>'}; expected=${expectedIdentifier}`
  );
  okLine(
    name,
    plainText === `Payment to ${expectedIdentifier}`,
    `plain metadata=${plainText || '<missing>'}; expected=${`Payment to ${expectedIdentifier}`}`
  );

  if (!payload.callback) {
    okLine(name, false, 'callback missing');
    return allPass;
  }

  const callbackUrl = new URL(payload.callback);
  const callbackUser = decodeURIComponent(callbackUrl.pathname.split('/').at(-2) ?? '');
  okLine(name, callbackUser === expectedLocal, `callback user=${callbackUser || '<missing>'}; expected=${expectedLocal}`);
  okLine(name, callbackUrl.search === '', `callback has empty query (${callbackUrl.search || '<empty>'}); expected <empty>`);
  const malformedInvoiceUrl = `${callbackUrl.origin}${callbackUrl.pathname}?amount=${AMOUNT_MSATS}&ns=${encodeURIComponent(name)}`;
  const invoiceRes = await fetchJson(malformedInvoiceUrl);
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
