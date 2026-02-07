import { NextRequest } from "next/server";

/**
 * LNURL payRequest callback (LUD-06).
 * Called by wallets after discovering /.well-known/lnurlp/<name>.
 * Generates a Lightning invoice via LNbits.
 *
 * Query params: name, amount (millisats), comment (optional)
 *
 * Env vars required:
 *   LNBITS_URL         — LNbits base URL
 *   LNBITS_INVOICE_KEY — invoice/read API key
 */

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = searchParams.get("name")?.toLowerCase();
  const amountStr = searchParams.get("amount");
  const comment = searchParams.get("comment") ?? "";

  if (!name || !amountStr) {
    return lnurlError("missing name or amount");
  }

  const amount = Number(amountStr);
  if (!Number.isFinite(amount) || amount < 1_000 || amount > 100_000_000_000) {
    return lnurlError("amount out of range");
  }

  const lnbitsUrl = process.env.LNBITS_URL;
  const invoiceKey = process.env.LNBITS_INVOICE_KEY;

  if (!lnbitsUrl || !invoiceKey) {
    return lnurlError("Lightning backend not configured");
  }

  const sats = Math.floor(amount / 1_000);
  const memo = comment
    ? `${name}@klabo.world: ${comment.slice(0, 159)}`
    : `Payment to ${name}@klabo.world`;

  const metadata = JSON.stringify([
    ["text/plain", `Sats for ${name}@klabo.world`],
    ["text/identifier", `${name}@klabo.world`],
  ]);

  try {
    const res = await fetch(`${lnbitsUrl}/api/v1/payments`, {
      method: "POST",
      headers: {
        "X-Api-Key": invoiceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        out: false,
        amount: sats,
        memo,
        unhashed_description: Buffer.from(metadata).toString("hex"),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("LNbits invoice error:", res.status, text);
      return lnurlError("invoice creation failed");
    }

    const data = await res.json();

    return Response.json(
      { pr: data.payment_request, routes: [] },
      { headers: corsHeaders() },
    );
  } catch (err) {
    console.error("LNbits connection error:", err);
    return lnurlError("could not reach Lightning backend");
  }
}

function lnurlError(reason: string) {
  return Response.json(
    { status: "ERROR", reason },
    { status: 200, headers: corsHeaders() }, // LNURL spec: errors are 200 with status=ERROR
  );
}

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
  };
}
