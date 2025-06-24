import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: '画像URLが指定されていません' }, 
        { status: 400 }
      );
    }

    // セキュリティチェック: Difyドメインからの画像のみ許可
    if (!imageUrl.startsWith('https://upload.dify.ai/')) {
      console.warn('不正な画像URL:', imageUrl);
      return NextResponse.json(
        { error: '許可されていない画像URLです' }, 
        { status: 403 }
      );
    }

    console.log('プロキシ経由で画像を取得中:', imageUrl);

    // Difyから画像を取得（タイムアウト付き）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒タイムアウト

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'NextJS-Manga-App/1.0',
        // DifyのAPIキーは通常、画像URLには不要
        // URLに署名が含まれているため
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('画像取得失敗:', {
        status: response.status,
        statusText: response.statusText,
        url: imageUrl
      });
      
      return NextResponse.json(
        { error: `画像の取得に失敗しました: ${response.status}` }, 
        { status: response.status }
      );
    }

    // 画像データを取得
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    console.log('画像取得成功:', {
      size: imageBuffer.byteLength,
      contentType,
      url: imageUrl
    });

    // レスポンスヘッダーを設定
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=3600'); // 1時間キャッシュ
    headers.set('Content-Length', imageBuffer.byteLength.toString());
    
    // CORS対応
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET');

    return new NextResponse(imageBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('プロキシ画像取得エラー:', error);
    
    // タイムアウトエラーの場合
    if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
      return NextResponse.json(
        { error: '画像取得がタイムアウトしました' }, 
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: '画像の取得中にエラーが発生しました' }, 
      { status: 500 }
    );
  }
} 