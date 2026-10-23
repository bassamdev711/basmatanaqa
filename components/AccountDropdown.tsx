"use client";

import Link from "next/link";
import { UserCircle2 } from "lucide-react";
import NotificationBadge from "./NotificationBadge";

export default function AccountDropdown() {
  return (
    <Link
      href="/account"
      aria-label="ملفي الشخصي"
      className="relative p-1.5 md:p-2 rounded-full transition-all duration-300 flex items-center justify-center text-accent hover:text-surface hover:bg-white/5 group"
    >
      <UserCircle2 className="w-[18px] h-[18px] md:w-5 md:h-5 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} />
      <NotificationBadge />
    </Link>
  );
}
