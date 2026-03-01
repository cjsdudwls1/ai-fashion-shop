-- Add internal tracking columns for handling video generation without timeout
ALTER TABLE products ADD COLUMN kling_task_id TEXT;
ALTER TABLE products ADD COLUMN tryon_image_url TEXT;

-- We don't need to change the enum type if the column is a generic TEXT or varchar, but if it's strictly an enum we might need to.
-- Assuming `video_status` is just TEXT. If it's an ENUM, the frontend app maps it so we add the new string statuses.
