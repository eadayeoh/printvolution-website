import { TrackForm } from '@/components/cart/track-form';

export const metadata = {
  title: 'Track your order',
  alternates: { canonical: 'https://printvolution.sg/track' },
};

export default function TrackPage({ searchParams }: { searchParams: { order?: string } }) {
  return (
    <div className="screen active">
      <div style={{ background: '#0D0D0D', color: '#fff', padding: '48px 28px 32px' }}>
        <div className="home-sec-inner" style={{ padding: 0 }}>
          <div className="hs-tag" style={{ color: '#E91E8C' }}>Track</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, color: '#fff', margin: '10px 0 0', lineHeight: 1.1 }}>
            Where&rsquo;s my order?
          </h1>
        </div>
      </div>
      <div className="home-sec-inner" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 720 }}>
        <TrackForm initialOrderNumber={searchParams.order ?? ''} />
      </div>
    </div>
  );
}
