import prisma from "../db.server";

export const action = async ({ request }) => {
  const { id } = await request.json();

  // 1️⃣ Delete child records first
  await prisma.lineItem.deleteMany({
    where: { invoiceId: id },
  });

  // 2️⃣ Then delete the invoice
  await prisma.invoice.delete({
    where: { id },
  });

  return Response.json({ success: true });
};
