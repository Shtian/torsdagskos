import { useAuth } from '@clerk/astro/react';

interface HeaderLogoutButtonProps {
  className?: string;
}

export default function HeaderLogoutButton({
  className,
}: HeaderLogoutButtonProps) {
  const { signOut } = useAuth();

  const runLogout = async () => {
    await signOut();
    window.location.assign('/sign-in');
  };

  return (
    <button
      type="button"
      role="menuitem"
      data-header-logout-button
      className={className}
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
  );
}
