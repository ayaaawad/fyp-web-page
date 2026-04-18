'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/top-nav';
import { apiPost } from '@/lib/api';

type LoginResponse = {
  accessToken: string;
  admin: {
    userId: string;
    email: string;
    role: string;
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('awadaya18@gmail.com');
  const [password, setPassword] = useState('1234554321');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');

    try {
      setIsSubmitting(true);
      const response = await apiPost<LoginResponse>('/auth/admin/login', {
        email,
        password,
      });

      localStorage.setItem('vein_admin_token', response.accessToken);
      localStorage.setItem('vein_admin_email', response.admin.email);
      setStatus('Login successful, redirecting...');
      router.push('/dashboard');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl">
      <TopNav />

      <section className="panel mx-auto max-w-xl p-5">
        <h1
          className="text-2xl"
          style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
        >
          Admin Authentication
        </h1>
        <p className="text-muted">
          Sign in as system administrator to manage users, process rules, and full
          platform operations.
        </p>

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <label>
            <span className="mb-1 block text-sm text-muted">Admin Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            <span className="mb-1 block text-sm text-muted">Password</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button className="btn w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Authenticating...' : 'Login as Admin'}
          </button>
        </form>

        {status ? <p className="mt-3 text-sm text-cyan-100">{status}</p> : null}
      </section>
    </main>
  );
}
