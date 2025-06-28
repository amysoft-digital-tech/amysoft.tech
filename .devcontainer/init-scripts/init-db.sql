-- Initialize development database and schemas
-- Note: Database 'amysoft_dev' is already created via POSTGRES_DB environment variable

-- Create development schemas
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS analytics;