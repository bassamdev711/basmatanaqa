import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { reverseOrderPoints } from '@/lib/loyalty/service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pendingOrders = await prisma.order.findMany({
      where: {
        status: 'NEW',
        paymentStatus: 'PENDING',
        paymentMethod: { in: ['bank_transfer', 'wallets'] },
        createdAt: { lt: twentyFourHoursAgo },
      },
      include: { items: true },
    });

    const results = { successful: 0, failed: 0, details: [] as any[] };

    for (const order of pendingOrders) {
      try {
        await prisma.$transaction(async (tx) => {
          // Re-verify order status inside transaction to prevent race conditions
          const currentOrder = await tx.order.findUnique({
            where: { id: order.id },
            include: { items: true },
          });

          if (!currentOrder || currentOrder.status !== 'NEW' || currentOrder.paymentStatus !== 'PENDING') {
            throw new Error('Order state changed');
          }

          // 1. Mark as CANCELLED
          await tx.order.update({
            where: { id: order.id },
            data: { 
              status: 'CANCELLED',
              paymentStatus: 'FAILED' 
            },
          });

          // 2. Restore Stock
          for (const item of currentOrder.items) {
            if (item.variantId) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { increment: item.quantity } },
              });
            } else if (item.productId) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
              });
            }
          }

          // 3. Restore Coupon
          if (currentOrder.couponId) {
            await tx.coupon.update({
              where: { id: currentOrder.couponId },
              data: { usedCount: { decrement: 1 } },
            });
          }
        });

        // 4. Reverse Loyalty Points (outside the atomic order tx, but handles its own tx safely)
        await reverseOrderPoints(order.id);

        results.successful++;
        results.details.push({ id: order.id, status: 'success' });
      } catch (error: any) {
        console.error(`Failed to cancel order ${order.id}:`, error);
        results.failed++;
        results.details.push({ id: order.id, status: 'failed', error: error.message });
      }
    }

    return NextResponse.json({ success: true, processed: pendingOrders.length, results });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
