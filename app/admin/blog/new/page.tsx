import { BlogPostEditor } from '@/components/admin/blog-post-editor';

export const dynamic = 'force-dynamic';

export default function NewBlogPostPage() {
  return <BlogPostEditor post={null} />;
}
