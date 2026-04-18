'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateMyProfile } from '@/app/(site)/account/actions';

export function ProfileEditor({ initialName, initialPhone }: { initialName: string; initialPhone: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = name.trim() !== initialName.trim() || phone.trim() !== initialPhone.trim();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaved(false);
    startTransition(async () => {
      const r = await updateMyProfile({ name, phone });
      if (!r.ok) { setErr(r.error); return; }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    });
  }

  const inp = 'w-full rounded border-2 border-neutral-200 bg-white px-4 py-3 text-sm focus:border-pink focus:outline-none';

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink">Full name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inp}
          required
          maxLength={100}
          autoComplete="name"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink">Phone (optional)</span>
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inp}
          maxLength={30}
          placeholder="+65 XXXX XXXX"
          autoComplete="tel"
        />
      </label>
      {err && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
          ✗ {err}
        </div>
      )}
      {saved && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-xs font-bold text-green-800">
          ✓ Profile updated
        </div>
      )}
      <button
        type="submit"
        disabled={isPending || !dirty}
        className="rounded-full bg-pink px-6 py-2.5 text-sm font-bold text-white hover:bg-pink-dark disabled:opacity-50"
      >
        {isPending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
