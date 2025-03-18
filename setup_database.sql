-- =================================================================
-- DAILYNOTES APPLICATION DATABASE SETUP
-- =================================================================
-- Run this file in the Supabase SQL Editor to set up the database
-- schema and security policies for the DailyNotes application.
-- =================================================================

-- =================================================================
-- CREATE NOTES TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    mood TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add comment to the table
COMMENT ON TABLE public.notes IS 'Stores user notes for the DailyNotes application';

-- Add comments to columns
COMMENT ON COLUMN public.notes.id IS 'Unique identifier for the note';
COMMENT ON COLUMN public.notes.title IS 'Title of the note';
COMMENT ON COLUMN public.notes.content IS 'Content/body of the note';
COMMENT ON COLUMN public.notes.mood IS 'User-selected mood associated with the note';
COMMENT ON COLUMN public.notes.tags IS 'Array of tags associated with the note';
COMMENT ON COLUMN public.notes.created_at IS 'Timestamp when the note was created';
COMMENT ON COLUMN public.notes.user_id IS 'Foreign key to auth.users - identifies the note owner';

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);

-- Create index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at);

-- =================================================================
-- ENABLE ROW LEVEL SECURITY
-- =================================================================
-- Enable row level security on the notes table
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- CREATE RLS POLICIES
-- =================================================================
-- Allow users to select their own notes
CREATE POLICY select_own_notes ON public.notes
    FOR SELECT
    USING (user_id = auth.uid());

-- Allow users to insert their own notes with their user_id
CREATE POLICY insert_own_notes ON public.notes
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Allow users to update their own notes
CREATE POLICY update_own_notes ON public.notes
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own notes
CREATE POLICY delete_own_notes ON public.notes
    FOR DELETE
    USING (user_id = auth.uid());

-- =================================================================
-- CREATE PUBLIC ACCESS FOR SERVICE ROLES
-- =================================================================
-- Optional: If you want to allow service roles to access all notes
-- Uncomment the following policy if needed
/*
CREATE POLICY service_role_access ON public.notes
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
*/

-- =================================================================
-- CREATE FUNCTIONS FOR SEARCH
-- =================================================================
-- Create a function to search notes by title, content, or tags
CREATE OR REPLACE FUNCTION public.search_notes(search_query TEXT)
RETURNS SETOF public.notes AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.notes
    WHERE 
        user_id = auth.uid() AND 
        (
            title ILIKE '%' || search_query || '%' OR
            content ILIKE '%' || search_query || '%' OR
            EXISTS (
                SELECT 1
                FROM unnest(tags) tag
                WHERE tag ILIKE '%' || search_query || '%'
            )
        )
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- CREATE FUNCTION FOR COUNTING RECENT NOTES
-- =================================================================
-- Create a function to count notes created in a recent time period
CREATE OR REPLACE FUNCTION public.count_recent_notes(days_ago INTEGER)
RETURNS INTEGER AS $$
DECLARE
    note_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO note_count
    FROM public.notes
    WHERE 
        user_id = auth.uid() AND
        created_at >= (NOW() - (days_ago || ' days')::INTERVAL);
    
    RETURN note_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- CREATE FUNCTION FOR FETCHING UNIQUE TAGS
-- =================================================================
-- Create a function to get all unique tags for a user
CREATE OR REPLACE FUNCTION public.get_unique_tags()
RETURNS TABLE (tag TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT unnest(notes.tags)
    FROM public.notes
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- SETUP REALTIME SUBSCRIPTIONS (OPTIONAL)
-- =================================================================
-- Enable realtime for the notes table if you want to use Supabase Realtime
-- Uncomment the following if you want to use realtime:
/*
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE notes;
COMMIT;
*/

-- =================================================================
-- EXAMPLE DUMMY DATA (FOR DEVELOPMENT ONLY)
-- =================================================================
-- Uncomment and modify this section to add test data for development
/*
INSERT INTO public.notes (title, content, mood, tags, user_id)
VALUES 
    ('Welcome to DailyNotes', 'This is an example note to get you started.', 'Happy', ARRAY['welcome', 'intro'], 'YOUR_USER_ID_HERE'),
    ('Meeting Notes', 'Discussed project timeline and deliverables.', 'Neutral', ARRAY['work', 'meeting'], 'YOUR_USER_ID_HERE'),
    ('Ideas for Weekend', 'Go hiking, try new recipe, read book.', 'Excited', ARRAY['personal', 'weekend'], 'YOUR_USER_ID_HERE');
*/

-- =================================================================
-- VERIFICATION QUERY
-- =================================================================
-- Run this to verify that your setup was successful
SELECT 'Database setup completed successfully!' as result; 