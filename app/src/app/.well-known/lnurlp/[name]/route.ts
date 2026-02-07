import { NextRequest } from "next/server";

/**
 * Lightning Address discovery endpoint (LUD-06/LUD-16).
 * Resolves <name>@klabo.world to a LNURL payRequest.
 *
 * Env vars required:
 *   LNBITS_URL       — public LNbits base URL (e.g. https://lnbits.klabo.world)
 *   LNBITS_INVOICE_KEY — invoice/read API key for the wallet
 */

const MIN_SENDABLE = 1_000; // 1 sat in millisats
const MAX_SENDABLE = 100_000_000_000; // 1M sats in millisats

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const lowerName = name.toLowerCase();

  if (!/^[a-z0-9._-]+$/.test(lowerName)) {
    return Response.json(
      { status: "ERROR", reason: "invalid name" },
      { status: 400, headers: corsHeaders() },
    );
  }

  const siteUrl = process.env.SITE_URL ?? "https://klabo.world";
  const metadata = JSON.stringify([
    ["text/plain", `Sats for ${lowerName}@klabo.world`],
    ["text/identifier", `${lowerName}@klabo.world`],
  ]);

  return Response.json(
    {
      tag: "payRequest",
      callback: `${siteUrl}/api/lnurlp/callback?name=${lowerName}`,
      minSendable: MIN_SENDABLE,
      maxSendable: MAX_SENDABLE,
      metadata,
      commentAllowed: 255,
    },
    { headers: corsHeaders() },
  );
}

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Cache-Control": "public, max-age=300",
  };
}
