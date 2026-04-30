import { notFound } from 'next/navigation';
import { serviceClient } from '@/lib/gifts/storage';
import { SurveyForm } from '@/components/survey/survey-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'How did we do?', robots: { index: false, follow: false } };

export default async function SurveyPage({ params }: { params: { token: string } }) {
  const sb = serviceClient();
  const { data: row } = await sb
    .from('nps_responses')
    .select('id, token, score, responded_at, order:orders(order_number)')
    .eq('token', params.token)
    .maybeSingle();
  if (!row) notFound();

  const orderNumber = (Array.isArray((row as any).order) ? (row as any).order[0]?.order_number : (row as any).order?.order_number) as string | undefined;
  const alreadyResponded = (row as any).responded_at !== null;

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '64px 24px 80px' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 8 }}>
        Quick check-in
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 12px' }}>
        How did <span style={{ color: '#E91E8C' }}>{orderNumber ?? 'your order'}</span> go?
      </h1>
      <p style={{ fontSize: 14, color: '#555', margin: '0 0 32px', lineHeight: 1.6 }}>
        On a scale of 0 to 10, how likely are you to recommend Printvolution to a friend?
      </p>
      {alreadyResponded ? (
        <div style={{
          padding: 24, borderRadius: 12, background: '#dcfce7', border: '1px solid #86efac',
          color: '#166534', fontSize: 14, fontWeight: 600, textAlign: 'center',
        }}>
          🙏 Thanks — we already have your response.
        </div>
      ) : (
        <SurveyForm token={params.token} />
      )}
    </main>
  );
}
