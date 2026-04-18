import Link from 'next/link';

const links = [
  { href: '/', label: 'Mission Control' },
  { href: '/register', label: 'Enrollment' },
  { href: '/verify', label: 'Verification' },
  { href: '/login', label: 'Admin Login' },
  { href: '/dashboard', label: 'Admin Control' },
];

export function TopNav() {
  return (
    <nav className="panel mx-auto mb-6 flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 shadow-scanner">
      <div
        className="text-lg font-semibold uppercase tracking-[0.16em]"
        style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
      >
        Vein ATM Command
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md border border-cyan-300/20 px-3 py-1.5 hover:border-cyan-200/50"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
