import {
  type SendNotificationRequest,
  sendNotificationResponseSchema,
} from "@farcaster/miniapp-node";
import { connectToDatabase } from "@/lib/mongodb";
import { NotificationToken } from "@/lib/models/NotificationToken";

type SendResult =
  | { state: "success" }
  | { state: "no_token" }
  | { state: "rate_limited" }
  | { state: "error"; error: unknown };

/**
 * Send a Farcaster notification to a single user.
 */
export async function sendNotification({
  fid,
  title,
  body,
  targetUrl,
  notificationId,
}: {
  fid: number;
  title: string;
  body: string;
  targetUrl: string;
  notificationId?: string;
}): Promise<SendResult> {
  await connectToDatabase();

  const record = await NotificationToken.findOne({ fid, enabled: true }).lean();
  if (!record) {
    return { state: "no_token" };
  }

  try {
    const payload: SendNotificationRequest = {
      notificationId: notificationId ?? crypto.randomUUID(),
      title: title.slice(0, 32),
      body: body.slice(0, 128),
      targetUrl,
      tokens: [record.token],
    };

    const response = await fetch(record.notificationUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.status === 200) {
      const json = await response.json();
      const parsed = sendNotificationResponseSchema.safeParse(json);

      if (parsed.success) {
        if (parsed.data.result.invalidTokens.length) {
          await NotificationToken.deleteMany({
            token: { $in: parsed.data.result.invalidTokens },
          });
        }
        if (parsed.data.result.rateLimitedTokens.length) {
          return { state: "rate_limited" };
        }
      }

      return { state: "success" };
    }

    if (response.status === 410) {
      await NotificationToken.deleteOne({ fid });
    }

    return { state: "error", error: `HTTP ${response.status}` };
  } catch (error) {
    console.error(`Notification send failed for fid ${fid}:`, error);
    return { state: "error", error };
  }
}

/**
 * Send a notification to all enabled users. Batches tokens in groups of 100.
 */
export async function broadcastNotification({
  title,
  body,
  targetUrl,
}: {
  title: string;
  body: string;
  targetUrl: string;
}): Promise<{ sent: number; failed: number }> {
  await connectToDatabase();

  const tokens = await NotificationToken.find({ enabled: true }).lean();
  if (!tokens.length) {
    return { sent: 0, failed: 0 };
  }

  // Group tokens by notificationUrl (different clients use different URLs)
  const byUrl = new Map<string, string[]>();
  for (const t of tokens) {
    const existing = byUrl.get(t.notificationUrl) ?? [];
    existing.push(t.token);
    byUrl.set(t.notificationUrl, existing);
  }

  let sent = 0;
  let failed = 0;
  const notificationId = crypto.randomUUID();

  for (const [url, tokenList] of byUrl) {
    // Batch in groups of 100 (Farcaster API limit)
    for (let i = 0; i < tokenList.length; i += 100) {
      const batch = tokenList.slice(i, i + 100);

      try {
        const payload: SendNotificationRequest = {
          notificationId,
          title: title.slice(0, 32),
          body: body.slice(0, 128),
          targetUrl,
          tokens: batch,
        };

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.status === 200) {
          const json = await response.json();
          const parsed = sendNotificationResponseSchema.safeParse(json);

          if (parsed.success) {
            sent += parsed.data.result.successfulTokens.length;
            failed += parsed.data.result.invalidTokens.length;

            if (parsed.data.result.invalidTokens.length) {
              await NotificationToken.deleteMany({
                token: { $in: parsed.data.result.invalidTokens },
              });
            }
          }
        } else if (response.status === 410) {
          await NotificationToken.deleteMany({ token: { $in: batch } });
          failed += batch.length;
        } else {
          failed += batch.length;
        }
      } catch (error) {
        console.error(`Broadcast batch failed for ${url}:`, error);
        failed += batch.length;
      }
    }
  }

  return { sent, failed };
}
