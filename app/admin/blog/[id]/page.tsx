import { notFound } from 'next/navigation';
import { getPostByIdAdmin } from '@/lib/data/blog';
import { BlogPostEditor } from '@/components/admin/blog-post-editor';

export const dynamic = 'force-dynamic';

export default async function EditBlogPostPage({ params }: { params: { id: string } }) {
  const post = await getPostByIdAdmin(params.id);
  if (!post) notFound();
  return <BlogPostEditor post={post as any} />;
}
