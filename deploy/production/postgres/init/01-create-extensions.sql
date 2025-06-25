-- PostgreSQL Extensions for Beyond the AI Plateau Production Database
-- Performance monitoring, full-text search, and analytics optimization

-- Create extensions for performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS uuid-ossp;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Performance monitoring views
COMMENT ON EXTENSION pg_stat_statements IS 'Track execution statistics of all SQL statements';
COMMENT ON EXTENSION pg_trgm IS 'Text similarity measurement and index searching';
COMMENT ON EXTENSION btree_gin IS 'Support for indexing common datatypes in GIN';
COMMENT ON EXTENSION btree_gist IS 'Support for indexing common datatypes in GiST';
COMMENT ON EXTENSION pgcrypto IS 'Cryptographic functions';
COMMENT ON EXTENSION uuid-ossp IS 'Generate universally unique identifiers (UUIDs)';
COMMENT ON EXTENSION unaccent IS 'Text search dictionary that removes accents';

-- Create custom functions for performance optimization
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically update updated_at timestamp';

-- Create function for full-text search optimization
CREATE OR REPLACE FUNCTION create_search_vector(title TEXT, content TEXT, description TEXT DEFAULT '')
RETURNS tsvector AS $$
BEGIN
    RETURN setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
           setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
           setweight(to_tsvector('english', COALESCE(content, '')), 'C');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION create_search_vector(TEXT, TEXT, TEXT) IS 'Create weighted full-text search vector';

-- Create function for analytics data aggregation
CREATE OR REPLACE FUNCTION aggregate_daily_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
    metric_date DATE,
    total_users BIGINT,
    active_users BIGINT,
    new_registrations BIGINT,
    chapter_completions BIGINT,
    template_usage BIGINT,
    revenue_generated NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        target_date as metric_date,
        (SELECT COUNT(*) FROM users WHERE created_at::date <= target_date) as total_users,
        (SELECT COUNT(DISTINCT user_id) FROM user_sessions WHERE created_at::date = target_date) as active_users,
        (SELECT COUNT(*) FROM users WHERE created_at::date = target_date) as new_registrations,
        (SELECT COUNT(*) FROM learning_progress WHERE completed_at::date = target_date AND completed = true) as chapter_completions,
        (SELECT COUNT(*) FROM template_usage WHERE created_at::date = target_date) as template_usage,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE created_at::date = target_date AND status = 'completed') as revenue_generated;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION aggregate_daily_metrics(DATE) IS 'Aggregate daily business metrics for analytics';

-- Create function for customer health scoring
CREATE OR REPLACE FUNCTION calculate_customer_health_score(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    engagement_score INTEGER := 0;
    learning_score INTEGER := 0;
    usage_score INTEGER := 0;
    payment_score INTEGER := 0;
    total_score INTEGER := 0;
BEGIN
    -- Engagement Score (0-25 points)
    SELECT LEAST(25, (COUNT(*) * 2)) INTO engagement_score
    FROM user_sessions 
    WHERE user_id = user_id_param 
    AND created_at > CURRENT_DATE - INTERVAL '30 days';
    
    -- Learning Progress Score (0-30 points)
    SELECT LEAST(30, (COUNT(*) * 3)) INTO learning_score
    FROM learning_progress 
    WHERE user_id = user_id_param 
    AND completed = true
    AND completed_at > CURRENT_DATE - INTERVAL '30 days';
    
    -- Feature Usage Score (0-25 points)
    SELECT LEAST(25, (COUNT(*) * 1)) INTO usage_score
    FROM template_usage 
    WHERE user_id = user_id_param 
    AND created_at > CURRENT_DATE - INTERVAL '30 days';
    
    -- Payment Health Score (0-20 points)
    SELECT CASE 
        WHEN subscription_status = 'active' THEN 20
        WHEN subscription_status = 'past_due' THEN 10
        WHEN subscription_status = 'canceled' THEN 0
        ELSE 5
    END INTO payment_score
    FROM users 
    WHERE id = user_id_param;
    
    total_score := engagement_score + learning_score + usage_score + payment_score;
    
    RETURN LEAST(100, total_score);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_customer_health_score(UUID) IS 'Calculate customer health score based on engagement and usage';

-- Create function for content performance analysis
CREATE OR REPLACE FUNCTION analyze_content_performance(content_type_param VARCHAR DEFAULT NULL)
RETURNS TABLE(
    content_id UUID,
    content_title VARCHAR,
    content_type VARCHAR,
    total_starts BIGINT,
    total_completions BIGINT,
    completion_rate NUMERIC,
    avg_time_spent NUMERIC,
    user_rating NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as content_id,
        c.title as content_title,
        c.type as content_type,
        COUNT(lp.id) as total_starts,
        COUNT(CASE WHEN lp.completed = true THEN 1 END) as total_completions,
        CASE 
            WHEN COUNT(lp.id) > 0 THEN 
                ROUND((COUNT(CASE WHEN lp.completed = true THEN 1 END)::NUMERIC / COUNT(lp.id)) * 100, 2)
            ELSE 0 
        END as completion_rate,
        ROUND(AVG(lp.time_spent_seconds), 2) as avg_time_spent,
        ROUND(AVG(cf.rating), 2) as user_rating
    FROM content c
    LEFT JOIN learning_progress lp ON c.id = lp.content_id
    LEFT JOIN content_feedback cf ON c.id = cf.content_id
    WHERE (content_type_param IS NULL OR c.type = content_type_param)
    GROUP BY c.id, c.title, c.type
    ORDER BY completion_rate DESC, total_starts DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION analyze_content_performance(VARCHAR) IS 'Analyze content performance metrics and user engagement';

-- Create materialized view for real-time dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_metrics AS
SELECT 
    CURRENT_DATE as metric_date,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE subscription_status = 'active') as active_subscribers,
    (SELECT COUNT(*) FROM users WHERE created_at::date = CURRENT_DATE) as new_registrations_today,
    (SELECT COUNT(DISTINCT user_id) FROM user_sessions WHERE created_at::date = CURRENT_DATE) as daily_active_users,
    (SELECT COUNT(*) FROM learning_progress WHERE completed_at::date = CURRENT_DATE AND completed = true) as chapters_completed_today,
    (SELECT COUNT(*) FROM template_usage WHERE created_at::date = CURRENT_DATE) as templates_used_today,
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE created_at::date = CURRENT_DATE AND status = 'completed') as revenue_today,
    (SELECT ROUND(AVG(calculate_customer_health_score(id)), 2) FROM users WHERE subscription_status = 'active') as avg_health_score
WITH DATA;

COMMENT ON MATERIALIZED VIEW dashboard_metrics IS 'Real-time dashboard metrics for business intelligence';

-- Create index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_metrics_date ON dashboard_metrics (metric_date);

-- Create function to refresh dashboard metrics
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_dashboard_metrics() IS 'Refresh dashboard metrics materialized view';

-- Create function for data retention cleanup
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    cutoff_date DATE;
BEGIN
    cutoff_date := CURRENT_DATE - INTERVAL '1 day' * retention_days;
    
    -- Clean up old analytics events
    DELETE FROM analytics_events WHERE created_at < cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up old session data
    DELETE FROM user_sessions WHERE created_at < cutoff_date;
    
    -- Clean up old temporary data
    DELETE FROM template_usage WHERE created_at < cutoff_date;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_analytics_data(INTEGER) IS 'Clean up old analytics data beyond retention period';

-- Create function for database health monitoring
CREATE OR REPLACE FUNCTION get_database_health()
RETURNS TABLE(
    metric_name VARCHAR,
    metric_value NUMERIC,
    status VARCHAR,
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH health_metrics AS (
        SELECT 
            'cache_hit_ratio' as name,
            ROUND((SELECT SUM(heap_blks_hit) / NULLIF(SUM(heap_blks_hit + heap_blks_read), 0) * 100 FROM pg_statio_user_tables), 2) as value,
            CASE 
                WHEN (SELECT SUM(heap_blks_hit) / NULLIF(SUM(heap_blks_hit + heap_blks_read), 0) * 100 FROM pg_statio_user_tables) > 95 THEN 'excellent'
                WHEN (SELECT SUM(heap_blks_hit) / NULLIF(SUM(heap_blks_hit + heap_blks_read), 0) * 100 FROM pg_statio_user_tables) > 90 THEN 'good'
                WHEN (SELECT SUM(heap_blks_hit) / NULLIF(SUM(heap_blks_hit + heap_blks_read), 0) * 100 FROM pg_statio_user_tables) > 80 THEN 'warning'
                ELSE 'critical'
            END as status,
            CASE 
                WHEN (SELECT SUM(heap_blks_hit) / NULLIF(SUM(heap_blks_hit + heap_blks_read), 0) * 100 FROM pg_statio_user_tables) <= 80 THEN 'Consider increasing shared_buffers'
                ELSE 'Cache performance is optimal'
            END as recommendation
        
        UNION ALL
        
        SELECT 
            'connection_usage' as name,
            ROUND((SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active')::NUMERIC / (SELECT setting::NUMERIC FROM pg_settings WHERE name = 'max_connections') * 100, 2) as value,
            CASE 
                WHEN (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active')::NUMERIC / (SELECT setting::NUMERIC FROM pg_settings WHERE name = 'max_connections') < 0.7 THEN 'good'
                WHEN (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active')::NUMERIC / (SELECT setting::NUMERIC FROM pg_settings WHERE name = 'max_connections') < 0.85 THEN 'warning'
                ELSE 'critical'
            END as status,
            CASE 
                WHEN (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active')::NUMERIC / (SELECT setting::NUMERIC FROM pg_settings WHERE name = 'max_connections') >= 0.85 THEN 'Consider connection pooling'
                ELSE 'Connection usage is healthy'
            END as recommendation
        
        UNION ALL
        
        SELECT 
            'slow_queries_count' as name,
            (SELECT COUNT(*) FROM pg_stat_statements WHERE mean_exec_time > 1000) as value,
            CASE 
                WHEN (SELECT COUNT(*) FROM pg_stat_statements WHERE mean_exec_time > 1000) = 0 THEN 'excellent'
                WHEN (SELECT COUNT(*) FROM pg_stat_statements WHERE mean_exec_time > 1000) < 5 THEN 'good'
                WHEN (SELECT COUNT(*) FROM pg_stat_statements WHERE mean_exec_time > 1000) < 10 THEN 'warning'
                ELSE 'critical'
            END as status,
            CASE 
                WHEN (SELECT COUNT(*) FROM pg_stat_statements WHERE mean_exec_time > 1000) >= 10 THEN 'Review and optimize slow queries'
                ELSE 'Query performance is acceptable'
            END as recommendation
    )
    SELECT name, value, status, recommendation FROM health_metrics;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_database_health() IS 'Monitor database health metrics and provide recommendations';