import { useState } from 'react';
import { Clock3, LogOut, Menu, Plus, Settings, User, X } from 'lucide-react';
import { useAuth } from '@clerk/astro/react';

import { Button, Sheet, SheetContent, SheetTrigger } from '@/components/ui';
import { cn } from '@/lib/utils';

interface NavLink {
  href: string;
  label: string;
  icon: 'clock' | 'settings';
}

interface HeaderMobileSheetProps {
  username: string;
  userInitial: string;
  currentPath: string;
  navLinks: NavLink[];
}

export default function HeaderMobileSheet({
  username,
  userInitial,
  currentPath,
  navLinks,
}: HeaderMobileSheetProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useAuth();

  const runLogout = async () => {
    await signOut();
    window.location.assign('/sign-in');
  };

  return (
    <div className="flex items-center gap-1.5 md:hidden">
      <a href="/events/new" className="no-underline">
        <Button
          size="sm"
          className="min-h-11 min-w-11 gap-1.5 rounded-full px-3 text-xs font-medium"
        >
          <Plus className="h-3.5 w-3.5" />
          Opprett
        </Button>
      </a>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11 min-w-11 shrink-0 p-0"
            aria-label="Meny"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-72 p-0 [&>button]:hidden"
          showCloseButton={false}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {userInitial}
              </span>
              <div>
                <p className="m-0 text-sm leading-tight font-medium text-foreground">
                  {username}
                </p>
                <p className="m-0 text-xs leading-tight text-muted-foreground">
                  Konto
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setMobileOpen(false)}
              aria-label="Lukk meny"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="flex flex-col px-3 py-3" aria-label="Mobilnavigasjon">
            {navLinks.map((link) => {
              const isActive = currentPath === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'min-h-11 min-w-11 inline-flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground no-underline transition-colors hover:bg-secondary hover:text-foreground',
                    isActive && 'bg-secondary font-semibold text-foreground',
                  )}
                >
                  {link.icon === 'clock' && <Clock3 className="h-4 w-4" />}
                  {link.icon === 'settings' && <Settings className="h-4 w-4" />}
                  {link.label}
                </a>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-border px-3 py-3">
            <a
              href="/profile"
              onClick={() => setMobileOpen(false)}
              className="min-h-11 min-w-11 inline-flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground no-underline transition-colors hover:bg-secondary hover:text-foreground"
            >
              <User className="h-4 w-4" />
              Profil
            </a>
            <button
              type="button"
              className="min-h-11 min-w-11 inline-flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              onClick={async () => {
                setMobileOpen(false);
                await runLogout();
              }}
            >
              <LogOut className="h-4 w-4" />
              Logg ut
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
