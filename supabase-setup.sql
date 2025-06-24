-- Supabase設定用SQLスクリプト
-- このスクリプトをSupabase Studioで実行してください

-- 1. manga_libraryテーブルの作成
CREATE TABLE IF NOT EXISTS public.manga_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    question TEXT NOT NULL,
    level TEXT NOT NULL,
    image_urls TEXT[] NOT NULL DEFAULT '{}',
    workflow_run_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Row Level Security (RLS) の有効化
ALTER TABLE public.manga_library ENABLE ROW LEVEL SECURITY;

-- 3. 全ユーザーに読み取り権限を付与するポリシー
CREATE POLICY "Allow all to read manga_library" ON public.manga_library
    FOR SELECT USING (true);

-- 4. 全ユーザーに書き込み権限を付与するポリシー
CREATE POLICY "Allow all to insert manga_library" ON public.manga_library
    FOR INSERT WITH CHECK (true);

-- 5. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_manga_library_created_at ON public.manga_library(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manga_library_workflow_run_id ON public.manga_library(workflow_run_id);

-- 6. Storage bucket の作成 (こちらはUI経由で作成する必要があります)
-- ストレージで以下を作成してください:
-- - Bucket名: 'manga-images'
-- - Public: true
-- - File size limit: 5MB
-- - Allowed MIME types: image/png, image/jpeg, image/webp

-- 7. Storage bucket のポリシー設定例 (必要に応じて調整)
-- INSERT POLICY: 
-- CREATE POLICY "Allow uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'manga-images');

-- SELECT POLICY:
-- CREATE POLICY "Allow public downloads" ON storage.objects FOR SELECT USING (bucket_id = 'manga-images');

-- 8. サンプルデータの挿入 (オプション)
-- INSERT INTO public.manga_library (title, question, level, image_urls, workflow_run_id) VALUES
--   ('光合成の仕組み', '光合成の仕組みを教えて', '小学6年生', '{}', 'sample-workflow-id-1'),
--   ('恐竜の生態', '恐竜について教えて', '小学3年生', '{}', 'sample-workflow-id-2');

-- 9. 新しいストリーミング用テーブル群

-- manga_generation_sessions テーブル: 生成セッションの管理
CREATE TABLE IF NOT EXISTS public.manga_generation_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_question TEXT NOT NULL,
    user_level TEXT NOT NULL,
    session_status TEXT NOT NULL DEFAULT 'planning' CHECK (session_status IN ('planning', 'generating', 'completed', 'failed')),
    total_panels INTEGER DEFAULT 0,
    completed_panels INTEGER DEFAULT 0,
    character_definitions JSONB DEFAULT '{}',
    story_structure JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- manga_panels テーブル: 個別パネルの管理
CREATE TABLE IF NOT EXISTS public.manga_panels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.manga_generation_sessions(id) ON DELETE CASCADE,
    panel_number INTEGER NOT NULL,
    panel_status TEXT NOT NULL DEFAULT 'pending' CHECK (panel_status IN ('pending', 'generating', 'completed', 'failed')),
    panel_description TEXT,
    image_prompt TEXT,
    image_url TEXT,
    storage_url TEXT,
    generation_attempts INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(session_id, panel_number)
);

-- character_profiles テーブル: キャラクタープロフィールの再利用
CREATE TABLE IF NOT EXISTS public.character_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    character_name TEXT NOT NULL,
    character_description JSONB NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. 新しいインデックス
CREATE INDEX IF NOT EXISTS idx_manga_generation_sessions_status ON public.manga_generation_sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_manga_generation_sessions_created_at ON public.manga_generation_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manga_panels_session_id ON public.manga_panels(session_id);
CREATE INDEX IF NOT EXISTS idx_manga_panels_status ON public.manga_panels(panel_status);
CREATE INDEX IF NOT EXISTS idx_manga_panels_session_panel ON public.manga_panels(session_id, panel_number);
CREATE INDEX IF NOT EXISTS idx_character_profiles_name ON public.character_profiles(character_name);

-- 11. RLS ポリシー設定
ALTER TABLE public.manga_generation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga_panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_profiles ENABLE ROW LEVEL SECURITY;

-- セッション読み取り権限
CREATE POLICY "Allow all to read manga_generation_sessions" ON public.manga_generation_sessions
    FOR SELECT USING (true);

-- セッション書き込み権限
CREATE POLICY "Allow all to insert manga_generation_sessions" ON public.manga_generation_sessions
    FOR INSERT WITH CHECK (true);

-- セッション更新権限
CREATE POLICY "Allow all to update manga_generation_sessions" ON public.manga_generation_sessions
    FOR UPDATE USING (true);

-- パネル読み取り権限
CREATE POLICY "Allow all to read manga_panels" ON public.manga_panels
    FOR SELECT USING (true);

-- パネル書き込み権限
CREATE POLICY "Allow all to insert manga_panels" ON public.manga_panels
    FOR INSERT WITH CHECK (true);

-- パネル更新権限
CREATE POLICY "Allow all to update manga_panels" ON public.manga_panels
    FOR UPDATE USING (true);

-- キャラクタープロフィール読み取り権限
CREATE POLICY "Allow all to read character_profiles" ON public.character_profiles
    FOR SELECT USING (true);

-- キャラクタープロフィール書き込み権限
CREATE POLICY "Allow all to insert character_profiles" ON public.character_profiles
    FOR INSERT WITH CHECK (true);

-- キャラクタープロフィール更新権限
CREATE POLICY "Allow all to update character_profiles" ON public.character_profiles
    FOR UPDATE USING (true);

-- 12. updated_at 自動更新のためのトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの作成
CREATE TRIGGER update_manga_generation_sessions_updated_at 
    BEFORE UPDATE ON public.manga_generation_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manga_panels_updated_at 
    BEFORE UPDATE ON public.manga_panels 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_character_profiles_updated_at 
    BEFORE UPDATE ON public.character_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 実行後の確認クエリ
SELECT * FROM public.manga_library ORDER BY created_at DESC LIMIT 5;
SELECT * FROM public.manga_generation_sessions ORDER BY created_at DESC LIMIT 5;
SELECT * FROM public.manga_panels ORDER BY created_at DESC LIMIT 5; 