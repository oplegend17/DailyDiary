# DailyNotes Application

A simple daily notes application built with React, Vite, and Supabase.

## Setup Instructions

### 1. Environment Setup

Make sure you have your `.env` file with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabase Database Setup

You need to set up the following tables in your Supabase project:

1. Go to your Supabase project dashboard
2. Go to SQL Editor
3. Create a new query and paste the contents of `setup_database.sql`
4. Run the query to create the necessary tables and policies

Or you can run these SQL commands manually:

```sql
-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT,
  tags TEXT[],
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policy for notes
CREATE POLICY "Users can CRUD their own notes" ON notes
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 3. Supabase Authentication Setup

1. Go to Authentication > Settings
2. Make sure Email auth is enabled
3. For development, you can disable email confirmations

### 4. Running the App

```
npm install
npm run dev
```

## Features

- User authentication (signup, login, logout)
- Create, read, update, and delete notes
- Dashboard with statistics
- Mood tracking for notes
- Tag notes for organization
