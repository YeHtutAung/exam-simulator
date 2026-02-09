"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type HeaderUserMenuProps = {
  session: Session | null;
};

function getInitials(name?: string | null, email?: string | null) {
  const base = name?.trim() || email?.trim() || "";
  if (!base) return "U";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

export function HeaderUserMenu({ session }: HeaderUserMenuProps) {
  const [open, setOpen] = useState(false);
  const user = session?.user ?? null;
  const initials = useMemo(() => getInitials(user?.name, user?.email), [user?.name, user?.email]);
  const pathname = usePathname();
  const isOwnerRoute = pathname.startsWith("/owner");
  const tCommon = useTranslations("common");
  const tHeader = useTranslations("header");

  if (!user) {
    return (
      <>
        {isOwnerRoute ? (
          <Link href="/owner/signin" className="text-slate-700 hover:text-slate-900">
            {tHeader("ownerSignIn")}
          </Link>
        ) : (
          <Link href="/signin" className="text-slate-700 hover:text-slate-900">
            {tCommon("signIn")}
          </Link>
        )}
      </>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-sand-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name ?? "User"}
            className="h-7 w-7 rounded-full border border-sand-200 object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-sand-200 bg-sand-100 text-xs font-semibold text-slate-600">
            {initials}
          </span>
        )}
        <span className="hidden text-sm md:inline">{user.name ?? user.email ?? "User"}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 rounded-2xl border border-sand-300 bg-white p-2 text-sm shadow-lg"
        >
          {isOwnerRoute ? (
            <>
              <Link
                href="/owner"
                className="block rounded-xl px-3 py-2 text-slate-700 hover:bg-sand-100"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {tCommon("dashboard")}
              </Link>
              <Link
                href="/owner/exams"
                className="block rounded-xl px-3 py-2 text-slate-700 hover:bg-sand-100"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {tCommon("exams")}
              </Link>
              <Link
                href="/owner/questions"
                className="block rounded-xl px-3 py-2 text-slate-700 hover:bg-sand-100"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {tCommon("questions")}
              </Link>
              <Link
                href="/owner/users"
                className="block rounded-xl px-3 py-2 text-slate-700 hover:bg-sand-100"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {tCommon("users")}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="block rounded-xl px-3 py-2 text-slate-700 hover:bg-sand-100"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {tCommon("dashboard")}
              </Link>
              {user.role === "OWNER" && (
                <Link
                  href="/owner"
                  className="block rounded-xl px-3 py-2 text-slate-700 hover:bg-sand-100"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  {tCommon("ownerPortal")}
                </Link>
              )}
            </>
          )}
          <button
            type="button"
            className="block w-full rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-sand-100"
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            {tCommon("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
