#!/usr/bin/env node

import { createHash } from 'node:crypto';

const rawArgs = process.argv.slice(2);
const metadataOnly = rawArgs.includes('--metadata-only') || process.env.LNURL_VERIFY_METADATA_ONLY === '1';
const names = rawArgs.filter((arg) => arg !== '--metadata-only');
const BASE_URL = process.env.LNURL_BASE_URL || 'https://klabo.world';
const AMOUNT_MSATS = 1000;

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function groupsToBytes(groups) {
  let acc = 0;
  let bits = 0;
  const bytes = [];
  for (const val of groups) {
    acc = (acc << 5) | val;
    bits += 5;
    while (bits >= 8) {
      bits -= 8;
      bytes.push((acc >> bits) & 0xff);
    }
  }
  return bytes;
}

function extractBolt11DescriptionHash(bolt11) {
  const invoice = String(bolt11 || '').toLowerCase();
  const sepIdx = invoice.lastIndexOf('1');
  if (sepIdx === -1) return null;
  const dataStr = invoice.slice(sepIdx + 1, -6); // strip checksum
  const data5 = [...dataStr].map((ch) => BECH32_CHARSET.indexOf(ch));
  if (data5.some((v) => v < 0)) return null;

  let pos = 7; // timestamp
  while (pos + 3 <= data5.length) {
    const type = data5[pos];
    const dataLen = data5[pos + 1] * 32 + data5[pos + 2];
    pos += 3;
    const groups = data5.slice(pos, pos + dataLen);
    if (type === 23) { // h: description_hash
      return Buffer.from(groupsToBytes(groups).slice(0, 32)).toString('hex');
    }
    pos += dataLen;
  }
  return null;
}

function sha256Hex(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}


if (names.length === 0) {
  console.log('Usage: node scripts/verify-lnurlp-case.mjs [--metadata-only] <name1> [name2...]');
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
  const metadataString = typeof payload.metadata === 'string' ? payload.metadata : JSON.stringify(payload.metadata);
  okLine(name, typeof metadataString === 'string' && metadataString.length > 0, 'metadata string present');
  const metadataHash = sha256Hex(metadataString);

  if (!payload.callback) {
    okLine(name, false, 'callback missing');
    return allPass;
  }

  const callbackUrl = new URL(payload.callback);
  const callbackUser = decodeURIComponent(callbackUrl.pathname.split('/').at(-2) ?? '');
  okLine(name, callbackUser === expectedLocal, `callback user=${callbackUser || '<missing>'}; expected=${expectedLocal}`);
  okLine(name, callbackUrl.search === '', `callback has empty query (${callbackUrl.search || '<empty>'}); expected <empty>`);
  if (metadataOnly) {
    return allPass;
  }

  const malformedInvoiceUrl = `${callbackUrl.origin}${callbackUrl.pathname}?amount=${AMOUNT_MSATS}&ns=${encodeURIComponent(name)}`;
  const invoiceRes = await fetchJson(malformedInvoiceUrl);
  okLine(name, invoiceRes.status === 200, `invoice status=${invoiceRes.status}`);
  if (invoiceRes.status !== 200) return allPass;

  const invoice = invoiceRes.json;
  const bolt11 = invoice && (invoice.pr || invoice.payment_request);
  okLine(name, Boolean(bolt11), 'invoice contains bolt11');
  okLine(name, typeof invoiceRes.text === 'string' && invoiceRes.text.length > 40, 'invoice body non-empty');
  const descriptionHash = extractBolt11DescriptionHash(bolt11);
  okLine(
    name,
    descriptionHash === metadataHash,
    `invoice description_hash=${descriptionHash || '<missing>'}; metadata sha256=${metadataHash}`
  );

  return allPass;
}

const results = await Promise.all(names.map((name) => verify(name)));
const failed = results.filter((result) => !result).length;

if (failed > 0) {
  console.log(`\nSummary: ${failed}/${results.length} case probes failed.`);
  process.exit(1);
}

console.log(`\nSummary: ${results.length}/${results.length} case probes passed${metadataOnly ? ' (metadata-only)' : ''}.`);
