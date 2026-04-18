'use client';

import { FormEvent, useState } from 'react';
import { TopNav } from '@/components/top-nav';
import { apiPost } from '@/lib/api';
import { compactVector, generateSimulationVector } from '@/lib/vector';

type EnrollResponse = {
  message: string;
  user: {
    userId: string;
    email: string;
    role: string;
  };
};

export default function RegisterPage() {
  const [userId, setUserId] = useState('customer-1001');
  const [email, setEmail] = useState('customer1001@example.com');
  const [pin, setPin] = useState('4321');
  const [machineId, setMachineId] = useState('ATM-SIM-01');
  const [vector, setVector] = useState<number[]>([]);
  const [status, setStatus] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');

    if (vector.length !== 128) {
      setStatus('Please generate a 128D vector before enrollment.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiPost<EnrollResponse>('/users/enroll', {
        userId,
        email,
        pin,
        role: 'customer',
        vector,
        machineId,
      });

      setStatus(`${response.message}: ${response.user.userId}`);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Enrollment request failed',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl">
      <TopNav />

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <form className="panel p-5" onSubmit={onSubmit}>
          <h1
            className="text-2xl"
            style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
          >
            Customer Enrollment
          </h1>
          <p className="text-muted">
            New user details are validated, PIN is salted + PBKDF2-hashed, and
            biometric vectors are encrypted before storage.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label>
              <span className="mb-1 block text-sm text-muted">User ID</span>
              <input
                className="input"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                required
              />
            </label>

            <label>
              <span className="mb-1 block text-sm text-muted">Email</span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label>
              <span className="mb-1 block text-sm text-muted">PIN</span>
              <input
                className="input"
                type="password"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                required
              />
            </label>

            <label>
              <span className="mb-1 block text-sm text-muted">Machine ID</span>
              <input
                className="input"
                value={machineId}
                onChange={(event) => setMachineId(event.target.value)}
                required
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn"
              onClick={() => setVector(generateSimulationVector(128))}
            >
              Generate Demo 128D Scan
            </button>
            <button type="submit" className="btn btn-secondary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Enroll User'}
            </button>
          </div>

          {status ? <p className="mt-3 text-sm text-cyan-100">{status}</p> : null}
        </form>

        <aside className="panel p-5">
          <h2
            className="text-lg"
            style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
          >
            Vector Preview
          </h2>
          <p className="text-sm text-muted">
            {vector.length === 128
              ? `Dimension: ${vector.length}`
              : 'No vector generated yet.'}
          </p>
          <pre className="mt-3 max-h-[300px] overflow-auto rounded-xl border border-cyan-200/20 bg-black/30 p-3 text-xs text-cyan-100">
            {compactVector(vector, 24)}
          </pre>
        </aside>
      </section>
    </main>
  );
}
