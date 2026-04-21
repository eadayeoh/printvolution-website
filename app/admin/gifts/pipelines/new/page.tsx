import Link from 'next/link';
import { PipelineForm } from '../pipeline-form';
import { createPipeline } from '../actions';

export default function NewPipelinePage() {
  return (
    <div className="p-6">
      <div className="mb-4">
        <Link href="/admin/gifts/pipelines" className="text-xs underline">← Pipelines</Link>
      </div>
      <h1 className="mb-4 text-2xl font-black">New pipeline</h1>
      <PipelineForm action={createPipeline} isNew />
    </div>
  );
}
