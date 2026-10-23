"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UserCircle2, 
  User, 
  ShoppingBag, 
  Star, 
  Bell, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Package, 
  Heart, 
  ChevronLeft,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import NotificationBadge from "./NotificationBadge";
import { logoutCustomer } from "@/app/account/actions";

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  avatarUrl?: string | null;
}

export default function AccountDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Fetch current user session
  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Refresh user state when opening dropdown
  const handleToggle = () => {
    if (!isOpen) {
      fetchUser();
    }
    setIsOpen((prev) => !prev);
  };

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const initials = user?.name ? user.name.trim().charAt(0).toUpperCase() : "";

  return (
    <div className="relative" ref={dropdownRef} dir="rtl">
      {/* Account Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="حسابي"
        aria-expanded={isOpen}
        className={`relative p-1.5 md:p-2 rounded-full transition-all duration-300 flex items-center justify-center ${
          isOpen
            ? "text-surface bg-surface/10 ring-1 ring-surface/20 shadow-sm"
            : "text-accent hover:text-surface hover:bg-white/5"
        }`}
      >
        <UserCircle2 className="w-[18px] h-[18px] md:w-5 md:h-5 transition-transform duration-300" strokeWidth={1.5} />
        <NotificationBadge />
      </button>

      {/* Flyout / Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 sm:left-auto sm:right-0 mt-3 w-[290px] sm:w-[320px] bg-white text-foreground rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-foreground/10 overflow-hidden z-[100]"
          >
            {/* Top decorative accent line */}
            <div className="h-1 w-full bg-gradient-to-r from-brand via-accent to-brand-deep" />

            {isLoading ? (
              <div className="p-6 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                <span className="text-xs text-foreground/50 font-medium">جاري التحميل...</span>
              </div>
            ) : user ? (
              /* LOGGED IN USER VIEW */
              <div className="p-4 sm:p-5">
                {/* User Info Header */}
                <div className="flex items-center gap-3 pb-4 mb-3 border-b border-foreground/5">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand/15 to-accent/20 border border-brand/20 flex items-center justify-center text-brand font-bold text-base shadow-inner shrink-0">
                    {initials || <User size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-foreground text-sm truncate">{user.name}</p>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    </div>
                    <p className="text-xs text-foreground/60 truncate font-mono" dir="ltr">
                      {user.phone || user.email}
                    </p>
                  </div>
                </div>

                {/* Quick Navigation Links */}
                <nav className="space-y-1">
                  <Link
                    href="/account"
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface text-foreground/80 hover:text-brand font-medium text-xs transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-brand/80 group-hover:text-brand" />
                      <span>الملف الشخصي</span>
                    </div>
                    <ChevronLeft className="w-3.5 h-3.5 text-foreground/30 group-hover:-translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/account/orders"
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface text-foreground/80 hover:text-brand font-medium text-xs transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShoppingBag className="w-4 h-4 text-brand/80 group-hover:text-brand" />
                      <span>طلباتي السابقة</span>
                    </div>
                    <ChevronLeft className="w-3.5 h-3.5 text-foreground/30 group-hover:-translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/account/points"
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface text-foreground/80 hover:text-brand font-medium text-xs transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Star className="w-4 h-4 text-brand/80 group-hover:text-brand" />
                      <span>رصيد المكافآت والنقاط</span>
                    </div>
                    <ChevronLeft className="w-3.5 h-3.5 text-foreground/30 group-hover:-translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/account/notifications"
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface text-foreground/80 hover:text-brand font-medium text-xs transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Bell className="w-4 h-4 text-brand/80 group-hover:text-brand" />
                      <span>الإشعارات</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="relative w-3.5 h-3.5">
                        <NotificationBadge />
                      </div>
                      <ChevronLeft className="w-3.5 h-3.5 text-foreground/30 group-hover:-translate-x-0.5 transition-transform" />
                    </div>
                  </Link>

                  <Link
                    href="/track"
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface text-foreground/80 hover:text-brand font-medium text-xs transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Package className="w-4 h-4 text-brand/80 group-hover:text-brand" />
                      <span>تتبع الشحنة</span>
                    </div>
                    <ChevronLeft className="w-3.5 h-3.5 text-foreground/30 group-hover:-translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/favorites"
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface text-foreground/80 hover:text-brand font-medium text-xs transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Heart className="w-4 h-4 text-brand/80 group-hover:text-brand" />
                      <span>قائمة المفضلة</span>
                    </div>
                    <ChevronLeft className="w-3.5 h-3.5 text-foreground/30 group-hover:-translate-x-0.5 transition-transform" />
                  </Link>
                </nav>

                {/* Logout Action */}
                <div className="pt-3 mt-3 border-t border-foreground/5">
                  <form action={logoutCustomer} className="w-full">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* GUEST / NOT LOGGED IN VIEW */
              <div className="p-5">
                <div className="text-center mb-4">
                  <div className="w-11 h-11 mx-auto rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-2.5 shadow-inner">
                    <Sparkles className="w-5 h-5 text-accent" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground">أهلاً بك في حسابك</h4>
                  <p className="text-xs text-foreground/60 mt-1 leading-relaxed">
                    سجّل دخولك لمتابعة شحناتك والاستفادة من مكافآت نقاطك وتجربة تسوق متكاملة.
                  </p>
                </div>

                {/* Main CTA Buttons */}
                <div className="space-y-2 mb-4">
                  <Link
                    href="/account/login"
                    className="w-full py-2.5 px-4 bg-brand text-surface hover:bg-brand-hover rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm transition-all duration-200"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول</span>
                  </Link>
                  <Link
                    href="/account/register"
                    className="w-full py-2.5 px-4 bg-surface text-brand hover:bg-foreground/5 border border-foreground/10 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 transition-all duration-200"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>إنشاء حساب جديد</span>
                  </Link>
                </div>

                {/* Helpful quick guest links */}
                <div className="pt-3 border-t border-foreground/5 space-y-1">
                  <Link
                    href="/track"
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface text-foreground/70 hover:text-brand text-xs font-medium transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-brand" />
                      <span>تتبع طلبك كزائر</span>
                    </div>
                    <ChevronLeft className="w-3 h-3 text-foreground/30 group-hover:-translate-x-0.5 transition-transform" />
                  </Link>
                  <Link
                    href="/favorites"
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface text-foreground/70 hover:text-brand text-xs font-medium transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Heart className="w-3.5 h-3.5 text-brand" />
                      <span>المفضلة</span>
                    </div>
                    <ChevronLeft className="w-3 h-3 text-foreground/30 group-hover:-translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
