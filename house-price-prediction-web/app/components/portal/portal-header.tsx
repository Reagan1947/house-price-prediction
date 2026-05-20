"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, LogOut, UserCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PortalHeaderProps = {
  userName?: string;
};

export function PortalHeader({ userName = "User" }: PortalHeaderProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      firstMenuItemRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isMenuOpen]);

  const signOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setIsMenuOpen(false);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      window.sessionStorage.removeItem("portal_user_name");
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <header className="portal-header">
      <div className="portal-header-brand">
        <Link href="/portal" className="portal-brand-link" aria-label="Go to portal home">
          <Image src="/landing/logo.png" alt="House Price Prediction" width={110} height={24} priority />
        </Link>
      </div>

      <div className="portal-user-menu" ref={menuRef}>
        <button
          ref={triggerRef}
          type="button"
          className="portal-user-trigger"
          aria-haspopup="true"
          aria-expanded={isMenuOpen}
          aria-controls="portal-user-dropdown"
          aria-label={`User menu for ${userName}`}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <UserCircle2 aria-hidden size={16} />
          <span className="portal-user-name">{userName}</span>
          <ChevronDown aria-hidden size={14} />
        </button>

        {isMenuOpen ? (
          <div id="portal-user-dropdown" className="portal-user-dropdown" aria-label="User menu">
            <button
              ref={firstMenuItemRef}
              type="button"
              className="portal-user-menu-item"
              onClick={signOut}
              disabled={isSigningOut}
            >
              <LogOut aria-hidden size={14} />
              <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
