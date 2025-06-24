import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { imageId: string } }
) {
  try {
    const { imageId } = params;
    
    // 画像IDから実際のDify URLを取得（データベースやキャッシュから）
    // この例では、URLパラメータから取得
    const difyUrl = request.nextUrl.searchParams.get('url');
    
    if (!difyUrl) {
      return NextResponse.json(
        { error: '画像URLが指定されていません' },
        { status: 400 }
      );
    }

    // Difyの画像URLが正当かチェック
    if (!difyUrl.startsWith('https://upload.dify.ai/')) {
      return NextResponse.json(
        { error: '不正な画像URLです' },
        { status: 400 }
      );
    }

    // Difyから画像を取得
    const imageResponse = await fetch(difyUrl, {
      headers: {
        'User-Agent': 'NextJS-Manga-App/1.0',
      },
    });

    if (!imageResponse.ok) {
      console.error('画像取得失敗:', imageResponse.status, imageResponse.statusText);
      return NextResponse.json(
        { error: '画像の取得に失敗しました' },
        { status: 500 }
      );
    }

    // 画像データを取得
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/png';

    // キャッシュヘッダーを設定
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=3600'); // 1時間キャッシュ
    headers.set('Content-Length', imageBuffer.byteLength.toString());

    return new NextResponse(imageBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('プロキシ画像取得エラー:', error);
    return NextResponse.json(
      { error: '画像の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 