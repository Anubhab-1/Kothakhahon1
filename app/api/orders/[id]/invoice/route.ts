import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import {
  buildInvoiceFilename,
  buildInvoiceNumber,
  renderInvoiceHtml,
} from "@/lib/invoices";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;

  const order = await db.order.findFirst({
    where: {
      id,
      ...(session.role === "ADMIN"
        ? {}
        : {
            OR: [
              {
                userId: session.userId,
              },
              {
                userId: null,
                customerEmail: session.email,
              },
            ],
          }),
    },
    include: {
      items: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const invoiceNumber =
    order.invoiceNumber ?? buildInvoiceNumber(order.id, order.createdAt);
  const invoiceIssuedAt = order.invoiceIssuedAt ?? new Date();

  if (!order.invoiceNumber || !order.invoiceIssuedAt) {
    await db.order.update({
      where: { id: order.id },
      data: {
        invoiceNumber,
        invoiceIssuedAt,
      },
    });
  }

  const html = renderInvoiceHtml({
    ...order,
    invoiceNumber,
    invoiceIssuedAt,
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${buildInvoiceFilename(invoiceNumber)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
