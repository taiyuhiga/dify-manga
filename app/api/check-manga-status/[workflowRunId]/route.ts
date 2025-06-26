import { NextRequest, NextResponse } from 'next/server';
import { supabase, uploadImageToStorage, saveMangaToLibrary } from '@/lib/supabase';

// 出力からタイトルを抽出するヘルパー関数
function extractQuestionFromOutput(outputs: any): string | null {
  try {
    // outputs.textから質問やタイトルを抽出
    const text = outputs.text || outputs.question || outputs.title;
    if (typeof text === 'string') {
      // JSONパースを試す
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].question) {
          return parsed[0].question;
        }
      } catch {
        // JSONでない場合はそのまま返す
        return text.slice(0, 50); // 最初の50文字
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workflowRunId: string }> }
) {
  try {
    const { workflowRunId } = await params;

    // APIキーを直接設定（環境変数が使えない場合）
    const difyApiKey = process.env.DIFY_API_KEY || 'app-XeQCpyZqvXGFBTYVqdAx1byz';
    
    console.log('Calling Dify API status check for:', workflowRunId);
    
    const response = await fetch(`https://api.dify.ai/v1/workflows/run/${workflowRunId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${difyApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Dify API status response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Dify API status error response body:', errorData);
      return NextResponse.json(
        { error: `APIエラー: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Dify status check result:', JSON.stringify(result, null, 2));

    // レスポンス構造の確認とステータス判定
    const status = result.status || result.data?.status;
    let outputs = result.outputs || result.data?.outputs;

    if (status === 'succeeded') {
      // outputsが文字列の場合はJSONパースする
      if (typeof outputs === 'string') {
        try {
          outputs = JSON.parse(outputs);
        } catch (e) {
          console.error('❌ Failed to parse outputs string:', e);
          return NextResponse.json({ 
            status: status, 
            message: "漫画は生成されましたが、レスポンスの解析に失敗しました。" 
          });
        }
      }

      if (!outputs || !outputs.text) {
        console.error('❌ "outputs.text" is missing in the Dify response');
        return NextResponse.json({ 
          status: status, 
          message: "漫画は生成されましたが、画像が見つかりませんでした。レスポンスの形式が不正です。" 
        });
      }

      console.log('📝 Raw outputs.text:', outputs.text);
      
      let imageUrls;
      try {
        // outputs.textがJSON文字列の場合と、直接オブジェクトの場合の両方に対応
        const parsedText = typeof outputs.text === 'string' ? JSON.parse(outputs.text) : outputs.text;
        
        if (!Array.isArray(parsedText)) {
          console.error('❌ "outputs.text" is not an array after parsing:', parsedText);
          throw new Error('Parsed data is not an array.');
        }

        imageUrls = parsedText.flat().filter(item => item && typeof item.url === 'string').map(item => item.url);

        console.log('🖼️ Extracted image URLs:', imageUrls);

        if (imageUrls.length === 0) {
          console.error('❌ No image URLs found after filtering. Dify might have returned an empty result.');
          // Difyからの結果が空であることを示すカスタムステータスを返す
          return NextResponse.json({ 
            status: 'succeeded_but_empty', 
            message: "漫画は生成されましたが、Difyから画像が返されませんでした。Difyのワークフローを確認してください。"
          });
        }
      } catch (e) {
        console.error('❌ Failed to parse or process "outputs.text":', e);
        console.error('   Raw outputs.text was:', outputs.text);
        return NextResponse.json({ 
          status: status, 
          message: "漫画は生成されましたが、画像データの解析に失敗しました。"
        });
      }

      // 画像をSupabase Storageにアップロード（並列処理）
      console.log('🔄 画像をSupabase Storageに保存開始...');
      const uploadPromises = imageUrls.map(async (url, index) => {
        const filename = `${workflowRunId}_${index + 1}.png`;
        try {
          const storageUrl = await uploadImageToStorage(url, filename);
          // アップロード失敗時は元のDify URLを使用
          return storageUrl || url; 
        } catch (error) {
          console.error(`❌ 画像アップロードエラー (${filename}):`, error);
          console.log(`⚠️ Storage保存失敗、元のURLをフォールバックとして使用: ${url}`);
          // エラーが発生した場合も元のDify URLを返す
          return url;
        }
      });

      const processedImageUrls = await Promise.all(uploadPromises);
      console.log('✅ Supabase Storageへのアップロード処理完了:', processedImageUrls);

      // 漫画をライブラリーに保存する
      try {
        // `result.inputs` はDifyからのレスポンスに含まれる入力情報
        const inputs = typeof result.inputs === 'string' ? JSON.parse(result.inputs) : result.inputs;
        const question = inputs?.user_question || '質問不明';
        const level = inputs?.user_level || 'レベル不明';
        
        const mangaData = {
          title: question.slice(0, 50), // 質問の最初の50文字をタイトルに
          question: question,
          level: level,
          image_urls: processedImageUrls,
          workflow_run_id: workflowRunId
        };

        const libraryId = await saveMangaToLibrary(mangaData);
        if (libraryId) {
          console.log('✅ 漫画ライブラリー保存完了:', libraryId);
        } else {
          console.error('❌ 漫画ライブラリーへの保存に失敗しました。');
        }
      } catch (error) {
        console.error('❌ 漫画ライブラリー保存中に予期せぬエラー:', error);
      }

      return NextResponse.json({ 
        status: status, 
        imageUrls: processedImageUrls
      });
    }

    return NextResponse.json({ status: status });

  } catch (error) {
    console.error('Error in check-manga-status:', error);
    return NextResponse.json(
      { error: `処理中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}` },
      { status: 500 }
    );
  }
} 