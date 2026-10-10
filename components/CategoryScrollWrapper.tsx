"use client";

import React, { useState, useEffect, useRef } from "react";

export default function CategoryScrollWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      // Ignore small scroll jitters
      if (Math.abs(diff) < 5) {
        return;
      }

      if (diff > 0 && currentScrollY > 50) {
        // Scrolling down and passed a threshold
        if (isVisible) {
          setIsVisible(false);
        }
      } else if (diff < 0) {
        // Scrolling up
        if (!isVisible) {
          setIsVisible(true);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [isVisible]);

  return (
    <div
      className={`flex flex-col border-b border-black/5 bg-surface/95 backdrop-blur-md sticky top-14 md:top-[68px] z-40 transition-all duration-200 ease-in-out motion-reduce:transition-none ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      {children}
    </div>
  );
}
