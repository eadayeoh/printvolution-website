import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPipelineByIdAdmin } from '@/lib/gifts/pipelines';
import { PipelineForm } from '../pipeline-form';
import { updatePipeline, deletePipeline } from '../actions';

export const dynamic = 'force-dynamic';

export default async function EditPipelinePage({ params }: { params: { id: string } }) {
  const pipeline = await getPipelineByIdAdmin(params.id);
  if (!pipeline) notFound();

  const update = updatePipeline.bind(null, pipeline.id);
  const del = deletePipeline.bind(null, pipeline.id);

  return (
    <div className="p-6">
      <div className="mb-4">
        <Link href="/admin/gifts/pipelines" className="text-xs underline">← Pipelines</Link>
      </div>
      <h1 className="mb-4 text-2xl font-black">{pipeline.name}</h1>
      <PipelineForm pipeline={pipeline} action={update} />

      <form action={del} className="mt-8">
        <button
          type="submit"
          className="rounded border border-red-500 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
        >
          Delete pipeline
        </button>
        <p className="mt-1 text-xs text-neutral-500">
          Products referencing this pipeline will fall back to their mode default.
        </p>
      </form>
    </div>
  );
}
