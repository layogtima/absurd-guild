-- Migration: Create project_tasks table
-- Phase 1C: Task Management

-- Project Tasks (task management)
CREATE TABLE project_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  sort_order INTEGER DEFAULT 0,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Index
CREATE INDEX idx_project_tasks_project ON project_tasks(project_id);
