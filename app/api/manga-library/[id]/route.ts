import { NextRequest, NextResponse } from 'next/server';
import { getMangaById, deleteMangaFromLibrary, updateMangaInLibrary } from '@/lib/supabase';

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'IDが指定されていません' },
        { status: 400 }
      );
    }

    console.log('🗑️ 漫画削除API開始:', id);

    // 漫画が存在するかチェック
    const existingManga = await getMangaById(id);
    if (!existingManga) {
      return NextResponse.json(
        { success: false, error: '指定された漫画が見つかりません' },
        { status: 404 }
      );
    }

    // 削除実行
    const success = await deleteMangaFromLibrary(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: '漫画の削除に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '漫画が正常に削除されました',
      deletedManga: existingManga
    });

  } catch (error) {
    console.error('❌ 漫画削除API エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: `削除中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'IDが指定されていません' },
        { status: 400 }
      );
    }

    console.log('📝 漫画更新API開始:', id, body);

    // バリデーション
    const allowedFields = ['title', 'question', 'level'];
    const updates: any = {};
    
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && typeof value === 'string' && value.trim()) {
        updates[key] = value.trim();
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: '更新可能なフィールドが指定されていません' },
        { status: 400 }
      );
    }

    // 漫画が存在するかチェック
    const existingManga = await getMangaById(id);
    if (!existingManga) {
      return NextResponse.json(
        { success: false, error: '指定された漫画が見つかりません' },
        { status: 404 }
      );
    }

    // 更新実行
    const updatedManga = await updateMangaInLibrary(id, updates);

    if (!updatedManga) {
      return NextResponse.json(
        { success: false, error: '漫画の更新に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '漫画が正常に更新されました',
      manga: updatedManga
    });

  } catch (error) {
    console.error('❌ 漫画更新API エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: `更新中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
      },
      { status: 500 }
    );
  }
} 