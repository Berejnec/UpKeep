-- Create merged_issues table for grouping related issues
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE merged_issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE'
);

-- Create junction table for many-to-many relationship between issues and merged_issues
CREATE TABLE issue_merges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merged_issue_id UUID REFERENCES merged_issues(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(merged_issue_id, issue_id)
);

-- Add indexes for better performance
CREATE INDEX idx_issue_merges_merged_issue_id ON issue_merges(merged_issue_id);
CREATE INDEX idx_issue_merges_issue_id ON issue_merges(issue_id);
CREATE INDEX idx_merged_issues_created_by ON merged_issues(created_by);
CREATE INDEX idx_merged_issues_status ON merged_issues(status);

-- Add RLS policies for security
ALTER TABLE merged_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_merges ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view merged issues
CREATE POLICY "Anyone can view merged issues" ON merged_issues
  FOR SELECT USING (true);

-- Policy: Only authenticated users can create merged issues
CREATE POLICY "Authenticated users can create merged issues" ON merged_issues
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Only creators can update their merged issues
CREATE POLICY "Users can update their own merged issues" ON merged_issues
  FOR UPDATE USING (auth.uid() = created_by);

-- Policy: Only creators can delete their merged issues
CREATE POLICY "Users can delete their own merged issues" ON merged_issues
  FOR DELETE USING (auth.uid() = created_by);

-- Policy: Anyone can view issue merges
CREATE POLICY "Anyone can view issue merges" ON issue_merges
  FOR SELECT USING (true);

-- Policy: Only authenticated users can create issue merges
CREATE POLICY "Authenticated users can create issue merges" ON issue_merges
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Only authenticated users can delete issue merges
CREATE POLICY "Authenticated users can delete issue merges" ON issue_merges
  FOR DELETE USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE merged_issues IS 'Groups of issues that represent the same practical problem';
COMMENT ON TABLE issue_merges IS 'Junction table linking individual issues to merged issue groups';
COMMENT ON COLUMN merged_issues.title IS 'Title for the merged issue group';
COMMENT ON COLUMN merged_issues.description IS 'Description explaining why these issues are grouped together';
COMMENT ON COLUMN merged_issues.status IS 'Status of the merged group (ACTIVE, RESOLVED, CLOSED)';
COMMENT ON COLUMN issue_merges.merged_issue_id IS 'Reference to the merged issue group';
COMMENT ON COLUMN issue_merges.issue_id IS 'Reference to the individual issue';

-- Verify tables were created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('merged_issues', 'issue_merges')
ORDER BY table_name, ordinal_position;
