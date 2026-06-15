"use server";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/admin";
import { sendEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/env";

export async function sendNewsletterBroadcastAction(formData: FormData) {
  await requireAdminSession();

  const subject = (formData.get("subject") as string).trim();
  const body = (formData.get("body") as string).trim();

  if (!subject || !body) return;

  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");

  const subscribers = await db.newsletterSubscriber.findMany({
    where: { isActive: true },
    select: { email: true },
  });

  if (subscribers.length === 0) return;

  // Send in batches of 10 to respect rate limits
  const BATCH = 10;
  for (let i = 0; i < subscribers.length; i += BATCH) {
    const batch = subscribers.slice(i, i + BATCH);
    await Promise.allSettled(
      batch.map(({ email }) =>
        sendEmail({
          to: email,
          subject,
          html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="background:#1c1713;border-radius:20px;overflow:hidden;">
      <div style="padding:32px 36px;border-bottom:1px solid rgba(255,255,255,0.08);">
        <p style="margin:0;font-family:'Helvetica Neue',sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#c9973a;">KOTHAKHAHON PROKASHONI</p>
        <h1 style="margin:12px 0 0;font-size:28px;line-height:1.3;color:#faf6ef;">${subject}</h1>
      </div>
      <div style="padding:28px 36px;font-size:16px;line-height:1.8;color:#d4c9bb;white-space:pre-line;">${body}</div>
      <div style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#6b5a47;text-align:center;">
        <a href="${siteUrl}/books" style="color:#c9973a;text-decoration:none;">Browse Catalog</a>
        &nbsp;·&nbsp;
        <a href="${siteUrl}/api/newsletter?unsubscribe=${encodeURIComponent(email)}" style="color:#6b5a47;text-decoration:none;">Unsubscribe</a>
      </div>
    </div>
  </div>
</body>
</html>`,
        }),
      ),
    );
  }
}
