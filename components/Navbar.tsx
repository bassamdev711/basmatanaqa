"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, ShoppingCart, Package, Heart, UserCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "./CartProvider";
import SearchModal from "./SearchModal";
import { useCartAnimation } from "./CartAnimationProvider";

export default function Navbar({
  storeName = 'بصمة أناقة',
  storeNameLatin = 'BASMAT ANAQAH',
}: {
  storeName?: string
  storeNameLatin?: string
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { cartCount } = useCart();
  const { cartIconRef, triggerBounce, onBounceComplete } = useCartAnimation();
  const localRef = useRef<HTMLDivElement>(null);
  const [topOffset, setTopOffset] = useState(0);

  // sync local ref into context ref
  useEffect(() => {
    if (localRef.current) {
      cartIconRef.current = localRef.current;
    }
  }, [cartIconRef]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    const checkOffset = () => {
      const bar = document.getElementById("announcement-bar");
      setTopOffset(bar ? bar.offsetHeight : 0);
    };

    // Initial check
    checkOffset();
    
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", checkOffset);
    
    // Also check after a short delay to ensure DOM is fully rendered
    const timeout = setTimeout(checkOffset, 100);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkOffset);
      clearTimeout(timeout);
    };
  }, []);

  const navLinks = [
    { name: "الرئيسية", href: "/" },
    { name: "المجموعة", href: "/products" },
    { name: "من نحن", href: "/#about" },
    { name: `تجربة ${storeName}`, href: "/#experience" },
    { name: "تواصل معنا", href: "/#contact" },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{ top: topOffset }}
      className={`fixed w-full z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-brand/95 backdrop-blur-md py-1.5 md:py-2 shadow-md"
          : "bg-brand py-2.5 md:py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="relative z-50 flex items-center gap-1.5 md:gap-2 group">
          <Image
            src="/basmat-anaqah-logo.webp"
            alt={`شعار ${storeName}`}
            width={42}
            height={42}
            className="h-8 w-8 md:h-10 md:w-10 object-contain"
            priority
          />
          <span className="flex flex-col leading-none gap-1">
            <span className="text-[10px] md:text-xs font-bold tracking-[0.18em] text-accent transition-colors duration-300">{storeNameLatin}</span>
            <span className="text-sm md:text-lg font-light text-surface tracking-[0.12em] transition-colors duration-300">{storeName}</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8" dir="rtl">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium tracking-wide text-surface/80 hover:text-accent transition-all duration-300 relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 right-0 w-0 h-[1px] bg-accent transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </div>

        {/* Actions & Mobile Menu Toggle */}
        <div className="flex items-center gap-2.5 md:gap-4 relative z-50">
          <Link 
            href="/track" 
            className="text-accent hover:text-surface transition-colors hidden sm:block" 
            aria-label="تتبع الطلب"
          >
            <Package className="w-[18px] h-[18px] md:w-5 md:h-5" strokeWidth={1.5} />
          </Link>
          <Link 
            href="/account" 
            className="text-accent hover:text-surface transition-colors hidden sm:block" 
            aria-label="حسابي"
          >
            <UserCircle2 className="w-[18px] h-[18px] md:w-5 md:h-5" strokeWidth={1.5} />
          </Link>
          <Link 
            href="/favorites" 
            className="text-accent hover:text-surface transition-colors relative hidden md:block" 
            aria-label="المفضلة"
          >
            <Heart className="w-[18px] h-[18px] md:w-5 md:h-5" strokeWidth={1.5} />
          </Link>
          <button 
            className="text-accent hover:text-surface transition-colors" 
            aria-label="البحث"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="w-[18px] h-[18px] md:w-5 md:h-5" strokeWidth={1.5} />
          </button>
          <div ref={localRef} className="relative hidden md:block">
            <Link href="/cart" className="text-accent hover:text-surface transition-colors relative flex items-center justify-center" aria-label="سلة المشتريات">
              <motion.div
                animate={triggerBounce ? { scale: [1, 1.4, 0.9, 1.15, 1], rotate: [0, -8, 8, -4, 0] } : {}}
                transition={{ duration: 0.5, ease: "easeOut" }}
                onAnimationComplete={onBounceComplete}
              >
                <ShoppingCart className="w-[18px] h-[18px] md:w-5 md:h-5" strokeWidth={1.5} />
              </motion.div>
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="absolute -top-1.5 -right-2 bg-accent text-brand text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>
          
          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-accent hover:text-surface transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={{
          opacity: isMobileMenuOpen ? 1 : 0,
          pointerEvents: isMobileMenuOpen ? "auto" : "none",
        }}
        className="fixed inset-0 bg-brand/98 backdrop-blur-xl z-40 flex flex-col items-center justify-center min-h-screen"
        dir="rtl"
      >
        <div className="flex flex-col items-center gap-5">
          {navLinks.map((link, i) => (
            <motion.div
              key={link.name}
              initial={{ y: 20, opacity: 0 }}
              animate={isMobileMenuOpen ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <Link
                href={link.href}
                className="text-lg font-medium tracking-wider text-surface hover:text-accent transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            </motion.div>
          ))}
          {/* زر الحساب في المنيو الجوال */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={isMobileMenuOpen ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ delay: navLinks.length * 0.1, duration: 0.4 }}
            className="border-t border-surface/10 pt-5 mt-2 flex flex-col items-center gap-3"
          >
            <Link
              href="/account"
              className="flex items-center gap-2 text-base font-semibold tracking-wider text-accent hover:text-surface transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <UserCircle2 size={20} strokeWidth={1.5} />
              حسابي
            </Link>
            <Link
              href="/account/login"
              className="text-sm text-surface/60 hover:text-accent transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/account/register"
              className="text-sm text-surface/60 hover:text-accent transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              إنشاء حساب جديد
            </Link>
          </motion.div>
        </div>
      </motion.div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </motion.nav>
  );
}
