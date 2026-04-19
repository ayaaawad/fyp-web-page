'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/top-nav';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { compactVector, generateSimulationVector } from '@/lib/vector';

type AuditLog = {
  id: string;
  userId: string;
  machineId: string;
  transactionType: string;
  success: boolean;
  similarityScore?: number;
  dateTime: string;
};

type PublicUser = {
  userId: string;
  email: string;
  role: 'admin' | 'customer';
};

type ProcessControls = {
  withdrawal: boolean;
  transaction: boolean;
  deposit: boolean;
  updatedBy: string;
  updatedAt: string;
};

type EnrollResponse = {
  message: string;
  user: PublicUser;
};

const defaultControls: ProcessControls = {
  withdrawal: true,
  transaction: true,
  deposit: true,
  updatedBy: 'system-bootstrap',
  updatedAt: new Date(0).toISOString(),
};

export default function DashboardPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [status, setStatus] = useState('Loading admin control center...');
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [controls, setControls] = useState<ProcessControls>(defaultControls);
  const [controlStatus, setControlStatus] = useState('');
  const [userStatus, setUserStatus] = useState('');

  const [userId, setUserId] = useState('customer-2001');
  const [email, setEmail] = useState('customer2001@example.com');
  const [pin, setPin] = useState('5678');
  const [machineId, setMachineId] = useState('ATM-ADMIN-01');
  const [vector, setVector] = useState<number[]>([]);
  const [isSavingControls, setIsSavingControls] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const token = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return localStorage.getItem('vein_admin_token') ?? '';
  }, []);

  useEffect(() => {
    async function loadDashboardData() {
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const [auditLogs, managedUsers, processControls] = await Promise.all([
          apiGet<AuditLog[]>('/audit-logs?limit=100', { token }),
          apiGet<PublicUser[]>('/users/admin/list', { token }),
          apiGet<ProcessControls>('/users/admin/processes', { token }),
        ]);

        setLogs(auditLogs);
        setUsers(managedUsers);
        setControls(processControls);
        setStatus(
          `Loaded ${auditLogs.length} audit logs and ${managedUsers.length} users`,
        );
        setControlStatus('Process controls synced');
      } catch (error) {
        setStatus(
          error instanceof Error
            ? `${error.message}. Please login again.`
            : 'Failed to load admin data',
        );
      }
    }

    void loadDashboardData();
  }, [token, router]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshUsers();
      void refreshAuditLogs();
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [token]);

  async function refreshAuditLogs() {
    if (!token) {
      return;
    }

    try {
      const data = await apiGet<AuditLog[]>('/audit-logs?limit=100', { token });
      setLogs(data);
      setStatus(`Loaded ${data.length} logs`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to refresh logs');
    }
  }

  async function refreshUsers() {
    if (!token) {
      return;
    }

    try {
      const data = await apiGet<PublicUser[]>('/users/admin/list', { token });
      setUsers(data);
    } catch (error) {
      setUserStatus(error instanceof Error ? error.message : 'Failed to refresh users');
    }
  }

  async function saveProcessControls() {
    if (!token) {
      return;
    }

    try {
      setIsSavingControls(true);
      const updated = await apiPut<ProcessControls>(
        '/users/admin/processes',
        {
          withdrawal: controls.withdrawal,
          transaction: controls.transaction,
          deposit: controls.deposit,
        },
        { token },
      );
      setControls(updated);
      setControlStatus('Process controls updated successfully');
      await refreshAuditLogs();
    } catch (error) {
      setControlStatus(
        error instanceof Error ? error.message : 'Failed to update process controls',
      );
    } finally {
      setIsSavingControls(false);
    }
  }

  async function enrollUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    if (vector.length !== 128) {
      setUserStatus('Generate a 128D vector before enrolling a user.');
      return;
    }

    try {
      setIsEnrolling(true);
      const response = await apiPost<EnrollResponse>(
        '/users/admin/enroll',
        {
          userId,
          email,
          pin,
          role: 'customer',
          vector,
          machineId,
        },
        { token },
      );
      setUserStatus(`User added: ${response.user.userId}`);
      await Promise.all([refreshUsers(), refreshAuditLogs()]);
    } catch (error) {
      setUserStatus(error instanceof Error ? error.message : 'Failed to enroll user');
    } finally {
      setIsEnrolling(false);
    }
  }

  async function removeUser(userIdToDelete: string) {
    if (!token) {
      return;
    }

    const confirmed = window.confirm(
      `Remove ${userIdToDelete} from the system? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiDelete<{ userId: string; removed: true }>(
        `/users/admin/${encodeURIComponent(userIdToDelete)}`,
        { token },
      );
      setUserStatus(`User removed: ${userIdToDelete}`);
      await Promise.all([refreshUsers(), refreshAuditLogs()]);
    } catch (error) {
      setUserStatus(error instanceof Error ? error.message : 'Failed to remove user');
    }
  }

  return (
    <main className="mx-auto max-w-6xl">
      <TopNav />

      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1
              className="text-2xl"
              style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
            >
              Admin System Command Center
            </h1>
            <p className="text-muted">
              Administrator authority: add users, remove users, control withdrawal,
              transaction, and deposit processes, and monitor platform audit logs.
            </p>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => {
              localStorage.removeItem('vein_admin_token');
              localStorage.removeItem('vein_admin_email');
              router.replace('/login');
            }}
          >
            Logout
          </button>
        </div>

        <p className="mt-3 text-sm text-cyan-100">{status}</p>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="panel p-5">
          <h2
            className="text-xl"
            style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
          >
            Process Governance
          </h2>
          <p className="text-sm text-muted">
            Enable or disable core transaction pipelines across the full system.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {(['withdrawal', 'transaction', 'deposit'] as const).map((key) => (
              <label key={key} className="panel p-3">
                <span className="mb-2 block text-sm font-semibold capitalize">{key}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={controls[key]}
                    onChange={(event) =>
                      setControls((current) => ({
                        ...current,
                        [key]: event.target.checked,
                      }))
                    }
                  />
                  <span className="text-sm text-muted">
                    {controls[key] ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              className="btn"
              disabled={isSavingControls}
              onClick={() => void saveProcessControls()}
            >
              {isSavingControls ? 'Saving...' : 'Save Process Controls'}
            </button>
            <span className="text-sm text-muted">
              Last update: {new Date(controls.updatedAt).toLocaleString()}
            </span>
          </div>

          {controlStatus ? <p className="mt-3 text-sm text-cyan-100">{controlStatus}</p> : null}
        </article>

        <article className="panel p-5">
          <h2
            className="text-xl"
            style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
          >
            Add New User
          </h2>
          <p className="text-sm text-muted">
            Create customer records from the admin center with encrypted biometric
            storage.
          </p>

          <form className="mt-3 space-y-3" onSubmit={enrollUser}>
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

            <div className="grid gap-3 md:grid-cols-2">
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

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn"
                onClick={() => setVector(generateSimulationVector(128))}
              >
                Generate Demo 128D Scan
              </button>
              <button className="btn btn-secondary" disabled={isEnrolling}>
                {isEnrolling ? 'Adding User...' : 'Add User'}
              </button>
            </div>

            <pre className="max-h-[140px] overflow-auto rounded-xl border border-cyan-200/30 bg-white/40 p-3 text-xs text-slate-700">
              {compactVector(vector, 18)}
            </pre>
          </form>

          {userStatus ? <p className="mt-3 text-sm text-cyan-100">{userStatus}</p> : null}
        </article>
      </section>

      <section className="panel mt-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2
            className="text-xl"
            style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
          >
            User Administration
          </h2>
          <button className="btn btn-secondary" onClick={() => void refreshUsers()}>
            Refresh Users
          </button>
        </div>

        <div className="mt-4 overflow-auto rounded-xl border border-cyan-300/30">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-cyan-100/40">
              <tr>
                <th className="px-3 py-2">User ID</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userId} className="border-t border-cyan-300/20">
                  <td className="px-3 py-2">{user.userId}</td>
                  <td className="px-3 py-2">{user.email}</td>
                  <td className="px-3 py-2 capitalize">{user.role}</td>
                  <td className="px-3 py-2">
                    <button
                      className="btn btn-secondary"
                      disabled={user.role === 'admin'}
                      onClick={() => void removeUser(user.userId)}
                    >
                      {user.role === 'admin' ? 'Protected' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-muted" colSpan={4}>
                    No users available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel mt-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2
            className="text-xl"
            style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
          >
            Audit Stream
          </h2>
          <button className="btn btn-secondary" onClick={() => void refreshAuditLogs()}>
            Refresh Logs
          </button>
        </div>

        <div className="mt-4 overflow-auto rounded-xl border border-cyan-300/30">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-cyan-100/40">
              <tr>
                <th className="px-3 py-2">Machine ID</th>
                <th className="px-3 py-2">Date/Time</th>
                <th className="px-3 py-2">Transaction Type</th>
                <th className="px-3 py-2">Success/Fail</th>
                <th className="px-3 py-2">User ID</th>
                <th className="px-3 py-2">Similarity</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-cyan-300/20">
                  <td className="px-3 py-2">{log.machineId}</td>
                  <td className="px-3 py-2">{new Date(log.dateTime).toLocaleString()}</td>
                  <td className="px-3 py-2">{log.transactionType}</td>
                  <td
                    className={`px-3 py-2 ${log.success ? 'text-green-300' : 'text-red-300'}`}
                  >
                    {log.success ? 'Success' : 'Fail'}
                  </td>
                  <td className="px-3 py-2">{log.userId}</td>
                  <td className="px-3 py-2">
                    {typeof log.similarityScore === 'number'
                      ? log.similarityScore.toFixed(6)
                      : '-'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-muted" colSpan={6}>
                    No audit logs available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
