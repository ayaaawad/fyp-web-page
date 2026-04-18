'use client';

import { FormEvent, useState } from 'react';
import { TopNav } from '@/components/top-nav';
import { apiPost } from '@/lib/api';
import { compactVector, generateSimulationVector } from '@/lib/vector';

type VerifyResponse = {
  user: {
    userId: string;
    email: string;
    role: string;
  };
  similarityScore: number;
  threshold: number;
  isMatch: boolean;
  verificationModel: string;
  complexity: string;
};

export default function VerifyPage() {
  const [userId, setUserId] = useState('customer-1001');
  const [machineId, setMachineId] = useState('ATM-SIM-01');
  const [transactionType, setTransactionType] = useState<
    'withdrawal' | 'transaction' | 'deposit' | 'balance-inquiry' | 'pin-change'
  >('transaction');
  const [liveVector, setLiveVector] = useState<number[]>([]);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');
    setResult(null);

    if (liveVector.length !== 128) {
      setStatus('Please generate a 128D live vector before verification.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiPost<VerifyResponse>('/users/verify', {
        userId,
        machineId,
        transactionType,
        liveVector,
      });
      setResult(response);
      setStatus('Verification completed successfully.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Verification failed');
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
            1:1 Verification Console
          </h1>
          <p className="text-muted">
            Backend performs direct document fetch by userId and single-template
            comparison for O(1) retrieval complexity.
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
              <span className="mb-1 block text-sm text-muted">Machine ID</span>
              <input
                className="input"
                value={machineId}
                onChange={(event) => setMachineId(event.target.value)}
                required
              />
            </label>

            <label className="md:col-span-2">
              <span className="mb-1 block text-sm text-muted">Transaction Type</span>
              <select
                className="select"
                value={transactionType}
                onChange={(event) =>
                  setTransactionType(event.target.value as typeof transactionType)
                }
              >
                <option value="withdrawal">withdrawal</option>
                <option value="transaction">transaction</option>
                <option value="balance-inquiry">balance-inquiry</option>
                <option value="deposit">deposit</option>
                <option value="pin-change">pin-change</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="btn"
              onClick={() => setLiveVector(generateSimulationVector(128))}
            >
              Generate Demo Live Vector
            </button>
            <button type="submit" className="btn btn-secondary" disabled={isSubmitting}>
              {isSubmitting ? 'Verifying...' : 'Verify Identity'}
            </button>
          </div>

          {status ? <p className="mt-3 text-sm text-cyan-100">{status}</p> : null}
        </form>

        <aside className="panel p-5">
          <h2
            className="text-lg"
            style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
          >
            Verification Result
          </h2>

          <pre className="mt-3 max-h-[180px] overflow-auto rounded-xl border border-cyan-200/20 bg-black/30 p-3 text-xs text-cyan-100">
            {compactVector(liveVector, 18)}
          </pre>

          {result ? (
            <div className="mt-4 space-y-2 text-sm">
              <p>
                Similarity Score: <strong>{result.similarityScore}</strong>
              </p>
              <p>
                Threshold: <strong>{result.threshold}</strong>
              </p>
              <p>
                Decision:{' '}
                <strong className={result.isMatch ? 'text-green-300' : 'text-red-300'}>
                  {result.isMatch ? 'MATCH' : 'NO MATCH'}
                </strong>
              </p>
              <p>
                Model: <strong>{result.verificationModel}</strong>
              </p>
              <p>
                Lookup Complexity: <strong>{result.complexity}</strong>
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">No verification result yet.</p>
          )}
        </aside>
      </section>
    </main>
  );
}
