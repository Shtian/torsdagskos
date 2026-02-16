import { useAuth } from '@clerk/astro/react';
import { useEffect, useRef, useState } from 'react';

interface HeaderProfileMenuProps {
  username: string;
  userInitial: string;
}

export default function HeaderProfileMenu({
  username,
  userInitial,
}: HeaderProfileMenuProps) {
  const { signOut } = useAuth();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [focusFirstItemOnOpen, setFocusFirstItemOnOpen] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !focusFirstItemOnOpen) {
      return;
    }

    const firstMenuItem =
      rootRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
    firstMenuItem?.focus();
    setFocusFirstItemOnOpen(false);
  }, [isOpen, focusFirstItemOnOpen]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!isOpen) {
        return;
      }

      const root = rootRef.current;
      if (root && !root.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const openMenu = (focusFirstItem = false) => {
    setIsOpen(true);
    setFocusFirstItemOnOpen(focusFirstItem);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setFocusFirstItemOnOpen(false);
  };

  const runLogout = async () => {
    closeMenu();
    await signOut();
    window.location.assign('/sign-in');
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      data-header-profile-menu
      data-hydrated={isHydrated ? 'true' : 'false'}
    >
      <button
        ref={triggerRef}
        type="button"
        id="header-profile-trigger"
        className="inline-flex h-9 items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-secondary"
        aria-haspopup="menu"
        aria-expanded={isOpen ? 'true' : 'false'}
        aria-label="Konto meny"
        aria-controls="header-profile-menu"
        data-header-profile-trigger
        onClick={() => {
          if (isOpen) {
            closeMenu();
            return;
          }
          openMenu();
        }}
        onKeyDown={(event) => {
          if (
            event.key === 'ArrowDown' ||
            event.key === 'Enter' ||
            event.key === ' '
          ) {
            event.preventDefault();
            openMenu(true);
          }
        }}
      >
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {userInitial}
        </span>
        <span className="max-w-32 truncate text-sm font-semibold text-foreground">
          {username}
        </span>
        <svg
          className="h-3.5 w-3.5 text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6"></path>
        </svg>
      </button>
      <div
        id="header-profile-menu"
        role="menu"
        aria-labelledby="header-profile-trigger"
        data-header-profile-content
        className="absolute right-0 z-50 mt-2 flex min-w-52 flex-col rounded-xl border bg-popover p-1.5 shadow-md"
        hidden={!isOpen}
      >
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Logget inn som{' '}
          <span className="font-semibold text-foreground">{username}</span>
        </div>
        <div className="my-1 h-px bg-border"></div>
        <a
          href="/profile"
          role="menuitem"
          className="min-h-11 min-w-11 inline-flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-popover-foreground no-underline transition hover:bg-muted"
          onClick={closeMenu}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="4"></circle>
            <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"></path>
          </svg>
          Profil
        </a>
        <div className="my-1 h-px bg-border"></div>
        <button
          type="button"
          role="menuitem"
          data-header-logout-button
          className="min-h-11 min-w-11 inline-flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-destructive transition hover:bg-destructive/10"
          onClick={runLogout}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <path d="m16 17 5-5-5-5"></path>
            <path d="M21 12H9"></path>
          </svg>
          Logg ut
        </button>
      </div>
    </div>
  );
}
