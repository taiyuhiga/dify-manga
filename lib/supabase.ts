import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 漫画ライブラリーのタイプ定義
export interface MangaLibrary {
  id?: string
  title: string
  question: string
  level: string
  image_urls: string[]
  workflow_run_id: string
  created_at?: string
}

// シンプルなDifyワークフロー用のタイプ定義
export interface MangaWorkflow {
  id?: string
  workflow_run_id: string
  status: 'processing' | 'completed' | 'failed'
  created_at?: string
}

// 画像をSupabase Storageにアップロードする関数
export async function uploadImageToStorage(imageUrl: string, filename: string): Promise<string | null> {
  try {
    console.log('🔄 Supabase Storageに画像をアップロード中:', filename);
    
    // タイムアウトを設定したfetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒タイムアウト
    
    try {
      // Difyから画像データを取得
      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; dify-manga-app/1.0)',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`画像の取得に失敗: ${response.status}`);
      }
      
      const imageBuffer = await response.arrayBuffer();
      
      // ファイル形式を確認してMIMEタイプを設定
      const contentType = response.headers.get('content-type') || 'image/png';
      const file = new File([imageBuffer], filename, { type: contentType });
      
      // Supabase Storageにアップロード
      const { data, error } = await supabase.storage
        .from('manga-images')
        .upload(`mangas/${filename}`, file, {
          upsert: true,
          cacheControl: '3600',
          contentType: contentType
        });
      
      if (error) {
        console.error('❌ Supabase Storageアップロードエラー:', error);
        return null;
      }
      
      // 公開URLを取得
      const { data: publicUrlData } = supabase.storage
        .from('manga-images')
        .getPublicUrl(`mangas/${filename}`);
      
      console.log('✅ Supabase Storage アップロード成功:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('❌ 画像取得タイムアウト (30秒):', filename);
      } else {
        console.error('❌ 画像取得エラー:', fetchError);
      }
      return null;
    }
    
  } catch (error) {
    console.error('❌ 画像アップロードエラー:', error);
    return null;
  }
}

// 漫画をライブラリーに保存する関数
export async function saveMangaToLibrary(manga: Omit<MangaLibrary, 'id' | 'created_at'>): Promise<string | null> {
  try {
    console.log('🔄 漫画をライブラリーに保存中:', manga.title);
    
    const { data, error } = await supabase
      .from('manga_library')
      .insert([manga])
      .select('id')
      .single();
    
    if (error) {
      console.error('❌ 漫画ライブラリー保存エラー:', error);
      return null;
    }
    
    console.log('✅ 漫画ライブラリー保存成功:', data.id);
    return data.id;
    
  } catch (error) {
    console.error('❌ 漫画ライブラリー保存エラー:', error);
    return null;
  }
}

// ライブラリーから漫画一覧を取得する関数
export async function getMangaLibrary(): Promise<MangaLibrary[]> {
  try {
    console.log('🔄 漫画ライブラリーを取得中...');
    
    const { data, error } = await supabase
      .from('manga_library')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ 漫画ライブラリー取得エラー:', error);
      return [];
    }
    
    console.log('✅ 漫画ライブラリー取得成功:', data.length, '件');
    return data || [];
    
  } catch (error) {
    console.error('❌ 漫画ライブラリー取得エラー:', error);
    return [];
  }
}

// 特定の漫画を取得する関数
export async function getMangaById(id: string): Promise<MangaLibrary | null> {
  try {
    const { data, error } = await supabase
      .from('manga_library')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('❌ 漫画取得エラー:', error);
      return null;
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ 漫画取得エラー:', error);
    return null;
  }
}

// === シンプルなDifyワークフロー関連の関数 ===

// Difyワークフロー状態を記録
export async function createMangaWorkflow(workflowRunId: string): Promise<MangaWorkflow | null> {
  try {
    const { data, error } = await supabase
      .from('mangas')
      .insert([{
        workflow_run_id: workflowRunId,
        status: 'processing'
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ ワークフロー記録エラー:', error);
      return null;
    }

    console.log('✅ ワークフロー記録成功:', data.id);
    return data;
  } catch (error) {
    console.error('❌ ワークフロー記録エラー:', error);
    return null;
  }
}

// ワークフロー状態を更新
export async function updateMangaWorkflow(
  workflowRunId: string,
  status: 'processing' | 'completed' | 'failed'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('mangas')
      .update({ status })
      .eq('workflow_run_id', workflowRunId);

    if (error) {
      console.error('❌ ワークフロー状態更新エラー:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ ワークフロー状態更新エラー:', error);
    return false;
  }
} 