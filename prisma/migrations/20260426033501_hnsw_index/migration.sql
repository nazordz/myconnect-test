-- Create HNSW index
CREATE INDEX IF NOT EXISTS attendees_embedding_hnsw_cosine_idx
ON attendees
USING hnsw (embedding vector_cosine_ops);
