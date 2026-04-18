import Link from 'next/link';
import Image from 'next/image';
import { TopNav } from '@/components/top-nav';

const modules = [
  {
    title: 'User Enrollment',
    href: '/register',
    description:
      'Add new users with secure PIN hashing and encrypted 128-dimensional vein templates.',
  },
  {
    title: 'Verification Engine',
    href: '/verify',
    description:
      'Run live verification with process-aware controls for withdrawal, deposit, and transaction decisions.',
  },
  {
    title: 'Admin Control Center',
    href: '/dashboard',
    description:
      'Control the system end-to-end: add users, remove users, configure process states, and review audit activity.',
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl">
      <TopNav />

      <section className="panel p-6 shadow-scanner">
        <p
          className="text-xs uppercase tracking-[0.32em] text-cyan-200/70"
          style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
        >
          Vein-Based ATM Authentication System
        </p>
        <h1
          className="mt-3 text-3xl font-bold md:text-5xl"
          style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
        >
          Vein ATM System Command Hub
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-muted">
          A complete software platform for secure enrollment, encrypted biometric
          storage, verification, and full administrative control of operational
          processes.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/register" className="btn">
            Start Enrollment
          </Link>
          <Link href="/verify" className="btn btn-secondary">
            Run Verification
          </Link>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-[1.15fr_0.85fr] md:items-center">
          <div>
            <p className="text-sm text-muted">
              Live system visual:
            </p>
            <p className="mt-1 text-sm text-muted">
              The latest project image is now integrated directly into the interface.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/40 p-2 shadow-scanner">
            <Image
              src="/images/fyp-background.jpg"
              alt="FYP system visual"
              width={1100}
              height={700}
              className="h-52 w-full rounded-xl object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {modules.map((module) => (
          <Link
            key={module.title}
            href={module.href}
            className="panel rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-scanner"
          >
            <h2
              className="text-xl"
              style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
            >
              {module.title}
            </h2>
            <p className="mt-2 text-sm text-muted">{module.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
