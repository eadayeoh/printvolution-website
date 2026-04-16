import { Placeholder } from '@/components/placeholder';

export default function BundlePage({ params }: { params: { slug: string } }) {
  return <Placeholder title={`Bundle: ${params.slug}`} description="Bundle details" />;
}
