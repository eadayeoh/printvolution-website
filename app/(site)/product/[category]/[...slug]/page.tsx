import { Placeholder } from '@/components/placeholder';

export default function ProductPage({ params }: { params: { category: string; slug: string[] } }) {
  const slug = params.slug[params.slug.length - 1] ?? '';
  return (
    <Placeholder
      title={`${slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`}
      description={`Category: ${params.category}`}
    />
  );
}
