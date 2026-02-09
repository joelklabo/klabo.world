import { NextRequest } from "next/server";

/**
 * NIP-05 identity verification.
 * Maps <name>@klabo.world → hex pubkey.
 * Add new names to the `identities` map below.
 */

const identities: Record<string, string> = {
  joel: "2f4fa408d85b962d1fe717daae148a4c98424ab2e10c7dd11927e101ed3257b2",
  max: "f2da534b47dbfe0580a42de3b758ca94119d45ed38e94e2f9be0c1568b31c555",
  _: "2f4fa408d85b962d1fe717daae148a4c98424ab2e10c7dd11927e101ed3257b2", // root fallback
};

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.toLowerCase() ?? "_";
  const pubkey = identities[name];

  if (!pubkey) {
    return Response.json(
      { error: "name not found" },
      { status: 404, headers: corsHeaders() },
    );
  }

  return Response.json(
    {
      names: { [name]: pubkey },
      relays: { [pubkey]: ["wss://nostr.klabo.world"] },
    },
    { headers: corsHeaders() },
  );
}

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Cache-Control": "public, max-age=3600",
  };
}
