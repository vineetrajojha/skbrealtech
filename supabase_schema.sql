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
  
  -- New Fields
  location_preference text,
  intent text, -- Buy, Rent, Invest
  budget text,
  property_type text,
  bedrooms text,
  special_preferences text,
  move_in_timeline text,
  preferred_builders text,
  visit_timeline text,
  contact_details text,
  
  -- Metadata
  raw_embedding vector(768), -- Gemini embedding dimension
  created_at timestamp with time zone default timezone('utc'::text, now())
);
