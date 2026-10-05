// app/admin/store-visibility/actions.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { verifyAdmin } from '@/lib/auth'

export async function updateStoreVisibility(formData: FormData) {
  await verifyAdmin();
  const storeName = formData.get('storeName') as string;
  const storeDescription = formData.get('storeDescription') as string;
  const seoSearchPhrases = JSON.parse((formData.get('seoSearchPhrases') as string) || '[]');

  await prisma.storeSettings.upsert({
    where: { id: 'singleton' },
    update: {
      storeName,
      storeDescription,
      seoSearchPhrases,
    },
    create: {
      id: 'singleton',
      storeName,
      storeDescription,
      seoSearchPhrases,
    },
  });

  revalidatePath('/admin/store-visibility');
  revalidatePath('/', 'layout'); // revalidate entire site layout where title might be used
}
