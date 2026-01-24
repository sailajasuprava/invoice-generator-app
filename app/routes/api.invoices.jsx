import prisma from "../db.server";
import { authenticate } from "../shopify.server";

// GET → return all invoices (UNCHANGED)
export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  const invoices = await prisma.invoice.findMany({
    where: { shop: session.shop },
    include: { lineItems: true },
  });

  return Response.json(invoices);
}

export async function action({ request }) {
  try {
    // 🔐 Authenticate + get Admin API
    const { session, admin } = await authenticate.admin(request);
    const shop = session.shop;

    // ✅ HANDLE DELETE
    if (request.method === "DELETE") {
      const { id } = await request.json();

      await prisma.invoice.delete({
        where: {
          id,
          shop,
        },
      });

      return Response.json({ ok: true });
    }

    // ✅ NEW: Shopify API usage (READ-ONLY, SAFE)
    const shopQuery = `#graphql
      query {
        shop {
          name
          email
          myshopifyDomain
          currencyCode
        }
      }
    `;

    const shopResponse = await admin.graphql(shopQuery);
    const shopData = await shopResponse.json();

    console.log("🏪 Shopify shop data:", shopData.data.shop);

    // ⬇️ Everything below remains EXACTLY as before
    const body = await request.json();
    const summary = body.summary || {};

    const invoiceData = {
      shop,
      invoiceNumber: body.invoiceNumber,
      invoiceDate: body.invoiceDate,
      dueDate: body.dueDate || null,

      businessName: body.businessName,
      businessAddress: body.businessAddress,
      gistn: body.gistn,
      customerName: body.customerName,
      billingAddress: body.billingAddress,
      email: body.email,
      mobile: body.mobile,

      subtotal: Number(summary.subtotal || 0),
      cgst: Number(summary.cgst || 0),
      sgst: Number(summary.sgst || 0),
      igst: Number(summary.igst || 0),
      total: Number(summary.total || 0),
    };

    const lineItems = (body.lineItems || []).map((item) => ({
      name: item.name,
      hsn: item.hsn,
      qty: Number(item.qty),
      price: Number(item.price),
      gst: Number(item.gst),
      total: Number(item.total),
    }));

    let invoice;

    if (body.id) {
      invoice = await prisma.invoice.update({
        where: { id: body.id },
        data: {
          ...invoiceData,
          lineItems: {
            deleteMany: {},
            create: lineItems,
          },
        },
      });
    } else {
      invoice = await prisma.invoice.create({
        data: {
          ...invoiceData,
          lineItems: {
            create: lineItems,
          },
        },
      });
    }

    return Response.json({ ok: true, invoice });
  } catch (error) {
    console.error("❌ API ERROR:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
