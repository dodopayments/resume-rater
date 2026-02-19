import { NextRequest, NextResponse } from "next/server";
import DodoPayments from "dodopayments";
import pool from "@/lib/db";

/**
 * POST /api/webhook
 * Verifies Dodo Payments webhook signature and processes events securely.
 *
 * - Uses headers: webhook-id, webhook-signature, webhook-timestamp
 * - On payment.succeeded: reads metadata.sessionId and marks session as paid
 *
 * Env vars required:
 * - DODO_PAYMENTS_API_KEY
 * - DODO_PAYMENTS_ENVIRONMENT = 'test_mode' | 'live_mode'
 * - DODO_PAYMENTS_WEBHOOK_KEY
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  const environment = (process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode") as
    | "test_mode"
    | "live_mode";
  const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;

  if (!apiKey || !webhookKey) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  // Raw body required for signature verification
  const rawBody = await req.text();

  // Required webhook headers
  const webhookHeaders = {
    "webhook-id": req.headers.get("webhook-id") || "",
    "webhook-signature": req.headers.get("webhook-signature") || "",
    "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
  };

  try {
    const client = new DodoPayments({
      bearerToken: apiKey,
      environment,
      webhookKey,
    });

    // Verify and parse event
    const event = client.webhooks.unwrap(rawBody, { headers: webhookHeaders });

    // Process only payment.succeeded for unlocking the report
    if (event?.type === "payment.succeeded" && event?.data) {
      // Per docs, payment payload is under event.data; custom metadata is event.data.metadata
      const payment: any = event.data;
      const meta = payment?.metadata || {};
      const sessionId =
        typeof meta?.sessionId === "string" ? (meta.sessionId as string) : undefined;

      if (sessionId) {
        try {
          const res = await pool.query(
            "UPDATE sessions SET paid = TRUE WHERE id = $1",
            [sessionId]
          );
          if (res.rowCount === 0) {
            console.warn(
              `payment.succeeded received for unknown sessionId: ${sessionId}`
            );
          }
        } catch (dbErr) {
          console.error("DB update failed for webhook payment.succeeded:", dbErr);
          // Return 500 to allow Dodo to retry delivery
          return NextResponse.json({ error: "DB update failed" }, { status: 500 });
        }
      } else {
        console.warn(
          "payment.succeeded received without metadata.sessionId; skipping"
        );
      }
    }

    // Acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
}
