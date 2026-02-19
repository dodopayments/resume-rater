import { NextRequest, NextResponse } from "next/server";
import DodoPayments from "dodopayments";
import pool from "@/lib/db";

/**
 * POST /api/checkout
 * Creates a Dodo Payments Checkout Session for a $3 one-time unlock.
 *
 * Request JSON:
 *  - sessionId (string, required): Your internal analysis session id
 *  - email (string, optional): Pre-fill customer email
 *  - name  (string, optional): Pre-fill customer name
 *
 * Behavior:
 *  - Adds metadata.sessionId so webhook can map back to your session
 *  - Sets return_url to "/?session={sessionId}" (absolute URL required by Dodo)
 */
export async function POST(req: NextRequest) {
  try {
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const sessionId = body?.sessionId as string | undefined;
    const email = body?.email as string | undefined;
    const name = body?.name as string | undefined;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    // Validate session exists and not already paid
    const existing = await pool.query("SELECT paid FROM sessions WHERE id = $1", [sessionId]);
    if (existing.rowCount === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (existing.rows[0]?.paid === true) {
      return NextResponse.json({ error: "Session already unlocked" }, { status: 409 });
    }

    // Required environment configuration
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    const env = process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode"; // 'test_mode' | 'live_mode'
    const productId = process.env.DODO_PAYMENTS_PRODUCT_ID; // one-time $3 product
    const appUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      req.nextUrl.origin; // fallback to request origin

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing DODO_PAYMENTS_API_KEY" },
        { status: 500 }
      );
    }
    if (!productId) {
      return NextResponse.json(
        { error: "Missing DODO_PAYMENTS_PRODUCT_ID" },
        { status: 500 }
      );
    }
    if (!appUrl) {
      return NextResponse.json(
        { error: "Missing APP_URL or NEXT_PUBLIC_APP_URL to build return_url" },
        { status: 500 }
      );
    }

    const client = new DodoPayments({
      bearerToken: apiKey,
      environment: env as "test_mode" | "live_mode",
    });

    const returnUrl = new URL(`/?session=${encodeURIComponent(sessionId)}`, appUrl).toString();

    const payload: any = {
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      metadata: {
        sessionId,
      },
      return_url: returnUrl,
    };

    if (email || name) {
      payload.customer = {
        ...(email ? { email } : {}),
        ...(name ? { name } : {}),
      };
    }

    const session = await client.checkoutSessions.create(payload);

    // Respond with the hosted checkout URL (client should redirect to this)
    return NextResponse.json(
      {
        checkout_url: session.checkout_url,
        dodo_session_id: session.session_id ?? null,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Checkout session creation failed:", err);
    // Hide internals from clients
    return NextResponse.json(
      { error: "Checkout session creation failed" },
      { status: 500 }
    );
  }
}
