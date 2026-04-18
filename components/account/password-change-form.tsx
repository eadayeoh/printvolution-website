'use client';

import { useState, useTransition } from 'react';
import { changeMyPassword } from '@/app/(site)/account/actions';

export function PasswordChangeForm() {
  const [isPending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);
    if (newPassword !== confirm) { setErr('New passwords do not match'); return; }
    if (newPassword.length < 8) { setErr('Password must be at least 8 characters'); return; }
    startTransition(async () => {
      const r = await changeMyPassword({ currentPassword, newPassword });
      if (!r.ok) { setErr(r.error); return; }
      setOk(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      setTimeout(() => setOk(false), 4000);
    });
  }

  const inp = 'w-full rounded border-2 border-neutral-200 bg-white px-4 py-3 text-sm focus:border-pink focus:outline-none';

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink">Current password</span>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={inp}
          required
          maxLength={200}
          autoComplete="current-password"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink">New password</span>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={inp}
          required
          minLength={8}
          maxLength={200}
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink">Confirm new password</span>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inp}
          required
          minLength={8}
          maxLength={200}
          autoComplete="new-password"
        />
      </label>
      {err && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
          ✗ {err}
        </div>
      )}
      {ok && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-xs font-bold text-green-800">
          ✓ Password updated
        </div>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {isPending ? 'Updating…' : 'Change password'}
      </button>
    </form>
  );
}
