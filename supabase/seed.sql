-- ==============================================================================
-- Panel Interview Hub — Seed Data for PostgreSQL / Supabase
-- Realistic Seed Records for NIAT Engineering Cohort
-- ==============================================================================

-- 1. Seed Tracks
INSERT INTO tracks (id, name, code, description, icon_name, color, is_active) VALUES
('11111111-0000-0000-0000-000000000001', 'AI Models Mastery', 'AI_MODELS', 'Master frontier LLM architectures, fine-tuning, embeddings, and prompt orchestration.', 'Cpu', '#3B82F6', TRUE),
('11111111-0000-0000-0000-000000000002', 'Applied Generative AI Development', 'GENAI_DEV', 'Build enterprise-grade GenAI applications, multi-agent frameworks, and resilient RAG systems.', 'Sparkles', '#8B5CF6', TRUE),
('11111111-0000-0000-0000-000000000003', 'UI Engineering', 'UI_ENG', 'Craft high-performance, accessible, and delightful interactive web applications with modern design systems.', 'Layout', '#10B981', TRUE),
('11111111-0000-0000-0000-000000000004', 'Data Science & Machine Learning', 'DS_ML', 'End-to-end data pipelines, statistical modeling, feature engineering, and production ML pipelines.', 'BarChart3', '#F59E0B', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Badges
INSERT INTO badges (id, track_id, name, level, display_order, description, criteria_summary, is_active) VALUES
('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'AI Foundations & Prompting', 'Novice', 1, 'Demonstrates core competency in LLM prompting, system design, evaluation, and tokenomics.', 'Complete 4 required skill contests with minimum 80% score.', TRUE),
('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Fine-Tuning & Quantization', 'Intermediate', 2, 'Proficiency in parameter-efficient fine-tuning (LoRA), quantization, and model alignment.', 'Complete LoRA project and benchmarking contest.', TRUE),
('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', 'Full-Stack GenAI Builder', 'Novice', 1, 'Demonstrates building end-to-end LLM applications with streaming, function calling, and state persistence.', 'Complete 4 full-stack GenAI laboratory tasks.', TRUE),
('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000003', 'Modern Design Systems & React', 'Novice', 1, 'Mastery over modular React component architecture, accessibility (WCAG), and responsive Tailwind systems.', 'Deliver accessible component library with 100% test coverage.', TRUE),
('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000004', 'Data Exploration & Statistical Modeling', 'Novice', 1, 'Expertise in exploratory data analysis, hypothesis testing, feature transformations, and predictive modeling.', 'Complete 4 statistical analysis case studies.', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Badge Requirements
INSERT INTO badge_requirements (id, badge_id, skill_id, skill_name, description, is_mandatory, minimum_score) VALUES
('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'skill-prompt-eng', 'Prompt Engineering & Few-Shot Reasoning', 'Design structured prompts with zero-shot, few-shot, and Chain-of-Thought techniques.', TRUE, 80.00),
('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'skill-llm-arch', 'LLM Architecture & Attention Mechanisms', 'Demonstrate deep understanding of Transformer encoders, decoders, and self-attention.', TRUE, 75.00),
('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', 'skill-model-eval', 'Model Evaluation & Benchmarking', 'Implement automated evaluation pipelines using BERTScore, ROUGE, and LLM-as-a-judge.', TRUE, 80.00),
('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001', 'skill-tokenomics', 'Tokenization Fundamentals & Context Windows', 'Manage token counts, BPE encoding, cost optimization, and window truncation strategies.', TRUE, 75.00)
ON CONFLICT (badge_id, skill_id) DO NOTHING;

-- 4. Seed Primary Demo Users
INSERT INTO users (id, full_name, email, role, avatar_url, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'Aarav Sharma', 'student@Panel.demo', 'STUDENT', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', TRUE),
('00000000-0000-0000-0000-000000000002', 'Dr. Priya Ramanathan', 'interviewer@Panel.demo', 'INTERVIEWER', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', TRUE),
('00000000-0000-0000-0000-000000000003', 'Chief Coordinator Vikram Roy', 'admin@Panel.demo', 'ADMIN', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', TRUE)
ON CONFLICT (email) DO NOTHING;

-- 5. Seed Students
INSERT INTO students (id, user_id, student_code, batch, academic_year, college, miles_earned, qualiflyer_rank) VALUES
('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'NIAT-2026-0101', '2023-2027', '3rd Year', 'NIAT Hyderabad Main Campus', 4850, 12)
ON CONFLICT (student_code) DO NOTHING;

-- 6. Seed Interviewers
INSERT INTO interviewers (id, user_id, active, timezone, title, bio, specialization, max_interviews_per_day) VALUES
('bbbbbbbb-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', TRUE, 'Asia/Kolkata', 'Principal AI Scientist & Senior Evaluator', 'Ex-Google Research Fellow with 10+ years evaluating frontier model implementations.', ARRAY['AI Models Mastery', 'Applied Generative AI'], 6)
ON CONFLICT (id) DO NOTHING;

