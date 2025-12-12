import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  const invoices = await prisma.invoice.findMany({
    where: { shop: session.shop },
    include: { lineItems: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(invoices);
}
