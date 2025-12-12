import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export async function loader({ request, params }) {
  const { session } = await authenticate.admin(request);

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, shop: session.shop },
    include: { lineItems: true },
  });

  if (!invoice) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json(invoice);
}
