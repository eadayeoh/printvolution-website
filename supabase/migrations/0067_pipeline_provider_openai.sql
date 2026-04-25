-- Add 'openai' to the gift_pipeline_provider enum so pipelines can
-- call OpenAI's Images API directly (no Replicate proxy).

alter type gift_pipeline_provider add value if not exists 'openai';
