import { createProduct } from './app/admin/products/actions';

// Mock cookies and verifyAdmin
jest.mock('next/headers', () => ({
  cookies: () => ({ get: () => ({ value: 'mock-token' }) })
}));
jest.mock('@/lib/auth', () => ({
  verifyAdmin: async () => true
}));
jest.mock('next/cache', () => ({
  revalidatePath: () => {}
}));
jest.mock('next/navigation', () => ({
  redirect: () => { throw new Error('NEXT_REDIRECT'); },
  isRedirectError: (err: any) => err?.message === 'NEXT_REDIRECT'
}));

async function test() {
  const formData = new FormData();
  formData.append('name', 'منتج اختبار بدون صور');
  formData.append('price', '150');
  formData.append('stock', '10');
  // Simulate what the form sends when Advanced is hidden and no images are selected
  formData.append('slug', 'منتج-اختبار-بدون-صور'); // Even if slug is passed, let's see. If the user doesn't open Advanced, the hidden field (wait, there's no hidden field for slug. It's just a visible input inside the hidden div. The browser still submits inputs inside hidden divs!)
  formData.append('imageUrl', '');
  formData.append('images', '[]');
  formData.append('seoSearchPhrases', '[]');
  formData.append('seoScore', '0');

  try {
    await createProduct(formData);
    console.log('SUCCESS: Product created!');
  } catch (err: any) {
    if (err.message === 'NEXT_REDIRECT') {
      console.log('SUCCESS: Redirected to products list');
    } else {
      console.error('FAILED:', err);
    }
  }
}

test();
