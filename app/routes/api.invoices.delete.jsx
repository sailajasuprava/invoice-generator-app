import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  // 🔐 REQUIRED for embedded apps
  await authenticate.admin(request);

  const { id } = await request.json();

  // ✅ Delete children first (FK safe)
  await prisma.lineItem.deleteMany({
    where: { invoiceId: id },
  });

  await prisma.invoice.delete({
    where: { id },
  });

  return Response.json({ success: true });
};
