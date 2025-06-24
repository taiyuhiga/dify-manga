import { NextRequest, NextResponse } from 'next/server';
import { getMangaLibrary } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('📚 漫画ライブラリー取得API開始');
    
    const mangas = await getMangaLibrary();
    
    return NextResponse.json({ 
      success: true,
      mangas: mangas,
      count: mangas.length
    });

  } catch (error) {
    console.error('❌ 漫画ライブラリー取得エラー:', error);
    return NextResponse.json(
      { 
        success: false,
        error: `ライブラリー取得中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}` 
      },
      { status: 500 }
    );
  }
} 