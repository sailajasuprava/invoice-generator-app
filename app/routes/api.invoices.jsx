import prisma from "../db.server";
import { authenticate } from "../shopify.server";

// GET → return all invoices
export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  const invoices = await prisma.invoice.findMany({
    where: { shop: session.shop },
    include: { lineItems: true },
  });

  return Response.json(invoices);
}

// api.invoices.jsx
export async function action({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const body = await request.json();

    const summary = body.summary || {}; // if you changed frontend as suggested

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

    console.log("invoiceData:", invoiceData);
    console.log("lineItems for Prisma:", lineItems);

    if (body.id) {
      const updated = await prisma.invoice.update({
        where: { id: body.id },
        data: {
          ...invoiceData,
          lineItems: {
            deleteMany: {},
            create: lineItems,
          },
        },
      });

      return Response.json({ ok: true, invoice: updated });
    }
    console.log("lineItems for Prisma:", lineItems);

    const data = {
      ...invoiceData,
      lineItems: {
        create: lineItems,
      },
    };
    console.log("Final data for Prisma:", JSON.stringify(data, null, 2));
    const created = await prisma.invoice.create({ data });

    return Response.json({ ok: true, invoice: created });
  } catch (error) {
    console.error("❌ API ERROR:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
