import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await verifyAdmin();
    const subscription = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    await prisma.adminSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh,
        auth,
        userAgent: req.headers.get('user-agent') || 'Unknown',
      },
      create: {
        endpoint,
        p256dh,
        auth,
        userAgent: req.headers.get('user-agent') || 'Unknown',
      },
    });
    await prisma.adminNotificationPreference.upsert({
      where: { id: 'singleton' },
      update: { pushEnabled: true },
      create: { id: 'singleton', pushEnabled: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await verifyAdmin();
    const { endpoint } = await req.json();

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
    }

    await prisma.adminSubscription.deleteMany({
      where: { endpoint },
    });
    const remainingSubscriptions = await prisma.adminSubscription.count();
    if (remainingSubscriptions === 0) {
      await prisma.adminNotificationPreference.upsert({
        where: { id: 'singleton' },
        update: { pushEnabled: false },
        create: { id: 'singleton', pushEnabled: false },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}
