import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FavoritesClient from "./FavoritesClient";
import { getStoreConfig } from '@/lib/store-config'

export async function generateMetadata() {
  const store = await getStoreConfig()
  return {
    title: `المفضلة | ${store.name}`,
    description: `منتجاتك المفضلة من ${store.name}`,
  }
}

export default function FavoritesPage() {
  return (
    <main className="min-h-screen bg-surface-alt font-sans flex flex-col" dir="rtl">
      <Navbar />
      <div className="flex-grow">
        <FavoritesClient />
      </div>
      <Footer />
    </main>
  );
}
