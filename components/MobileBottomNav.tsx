"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, LayoutGrid, Heart, ShoppingCart, UserCircle2 } from "lucide-react";
import { useCart } from "./CartProvider";
import { motion, AnimatePresence } from "framer-motion";
import { useCartAnimation } from "./CartAnimationProvider";
import NotificationBadge from "./NotificationBadge";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { mobileCartIconRef, triggerBounce, onBounceComplete } = useCartAnimation();
  const localCartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localCartRef.current && mobileCartIconRef) {
      mobileCartIconRef.current = localCartRef.current;
    }
  }, [mobileCartIconRef]);

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
      name: "السلة",
      href: "/cart",
      icon: ShoppingCart,
      badge: cartCount,
      isCart: true,
    },
    {
      name: "المفضلة",
      href: "/favorites",
      icon: Heart,
    },
    {
      name: "حسابي",
      href: "/account",
      icon: UserCircle2,
      hasNotificationBadge: true,
    },
  ];

  // Don't render the bottom nav on admin pages or checkout
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/checkout")) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[90] bg-surface/95 backdrop-blur-md border-t border-black/10 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 px-1 relative" dir="rtl">
        {navItems.map((item) => {
          const isActive = 
            item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
          
          const Icon = item.icon;

          if (item.isCart) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex items-center justify-center flex-1 h-full group"
                aria-label="سلة المشتريات"
              >
                <div ref={localCartRef} className="relative">
                  {/* Distinct Integrated Luxury Action Circle */}
                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    animate={
                      triggerBounce
                        ? { scale: [1, 1.25, 0.92, 1.15, 1], rotate: [0, -8, 8, -4, 0] }
                        : {}
                    }
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    onAnimationComplete={onBounceComplete}
                    className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? "bg-brand text-accent ring-2 ring-accent ring-offset-2 ring-offset-surface shadow-md shadow-brand/30 scale-105"
                        : "bg-brand text-accent hover:brightness-110 shadow-sm shadow-brand/20 border border-brand/20"
                    }`}
                  >
                    {/* Subtle Luxury Gradient Glow */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-accent/20 to-transparent pointer-events-none" />

                    <Icon
                      size={21}
                      strokeWidth={2.3}
                      className="text-accent transition-transform duration-200 group-hover:scale-110 relative z-10"
                    />

                    {/* Subtle pulse effect if cart has items */}
                    {item.badge && item.badge > 0 ? (
                      <span className="absolute inset-0 rounded-full bg-accent/25 animate-ping opacity-35 pointer-events-none" />
                    ) : null}
                  </motion.div>

                  {/* Badge Counter */}
                  <AnimatePresence>
                    {item.badge && item.badge > 0 ? (
                      <motion.span
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.4, opacity: 0 }}
                        className="absolute -top-1 -right-1 z-20 min-w-[18px] h-[18px] px-1 bg-accent text-brand text-[9px] font-black rounded-full flex items-center justify-center border-2 border-surface shadow-sm leading-none"
                      >
                        {item.badge}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center flex-1 h-full gap-1 active:scale-95 transition-transform"
            >
              <div className="relative">
                <Icon
                  size={21}
                  strokeWidth={isActive ? 2.4 : 1.6}
                  className={`transition-colors duration-200 ${
                    isActive ? "text-brand" : "text-foreground/45"
                  }`}
                />
                
                {/* Account Notification Badge */}
                {item.hasNotificationBadge && <NotificationBadge />}
              </div>
              
              <span
                className={`text-[10px] font-bold transition-colors duration-200 leading-none ${
                  isActive ? "text-brand font-extrabold" : "text-foreground/50"
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
