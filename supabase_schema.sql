-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create conversations table
create table if not exists conversations (
  id uuid default gen_random_uuid() primary key,
  session_id text unique not null,
  messages jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create lead_profiles table
create table if not exists lead_profiles (
  id uuid default gen_random_uuid() primary key,
  session_id text unique not null,
  location_preference text,
  budget text,
  property_type text,
  special_preferences jsonb,
  raw_embedding vector(768), -- Gemini embedding dimension
  created_at timestamp with time zone default timezone('utc'::text, now())
);
