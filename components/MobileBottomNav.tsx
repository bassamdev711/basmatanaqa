"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, LayoutGrid, Heart, ShoppingCart, Package } from "lucide-react";
import { useCart } from "./CartProvider";
import { motion, AnimatePresence } from "framer-motion";
import { useCartAnimation } from "./CartAnimationProvider";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { triggerBounce, onBounceComplete } = useCartAnimation();

  const navItems = [
    {
      name: "الرئيسية",
      href: "/",
      icon: Home,
    },
    {
      name: "التصنيفات",
      href: "/products",
      icon: LayoutGrid,
    },
    {
      name: "المفضلة",
      href: "/favorites",
      icon: Heart,
    },
    {
      name: "السلة",
      href: "/cart",
      icon: ShoppingCart,
      badge: cartCount,
      isCart: true,
    },
    {
      name: "الطلبات",
      href: "/track",
      icon: Package,
    },
  ];

  // Don't render the bottom nav on admin pages or checkout
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/checkout")) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[90] bg-surface border-t border-black/10 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 px-2" dir="rtl">
        {navItems.map((item) => {
          const isActive = 
            item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
          
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-full h-full gap-1"
            >
              <div className="relative">
                {item.isCart ? (
                  <motion.div
                    animate={triggerBounce ? { scale: [1, 1.4, 0.9, 1.15, 1], rotate: [0, -8, 8, -4, 0] } : {}}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    onAnimationComplete={onBounceComplete}
                  >
                    <Icon
                      size={22}
                      strokeWidth={isActive ? 2.5 : 1.5}
                      className={`transition-colors duration-200 ${
                        isActive ? "text-brand" : "text-foreground/40"
                      }`}
                    />
                  </motion.div>
                ) : (
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    className={`transition-colors duration-200 ${
                      isActive ? "text-brand" : "text-foreground/40"
                    }`}
                  />
                )}
                
                <AnimatePresence>
                  {item.badge && item.badge > 0 ? (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className={`absolute -top-1.5 -right-2 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${
                        isActive ? "bg-accent text-brand" : "bg-brand text-white"
                      }`}
                    >
                      {item.badge}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>
              
              <span
                className={`text-[10px] font-bold transition-colors duration-200 ${
                  isActive ? "text-brand" : "text-foreground/40"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
