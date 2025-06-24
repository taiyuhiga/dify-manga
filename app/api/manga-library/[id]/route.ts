import { NextRequest, NextResponse } from 'next/server';
import { getMangaById } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('📖 特定漫画取得API開始:', id);
    
    const manga = await getMangaById(id);
    
    if (!manga) {
      return NextResponse.json({ 
        success: false,
        error: '指定された漫画が見つかりませんでした' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true,
      manga: manga
    });

  } catch (error) {
    console.error('❌ 特定漫画取得エラー:', error);
    return NextResponse.json(
      { 
        success: false,
        error: `漫画取得中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}` 
      },
      { status: 500 }
    );
  }
} 