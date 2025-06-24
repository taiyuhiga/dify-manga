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
          console.error('❌ No image URLs found after filtering.');
          return NextResponse.json({ 
            status: status, 
            message: "漫画は生成されましたが、画像が見つかりませんでした。URLの抽出に失敗しました。"
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

      // Supabase Storageに画像をアップロード（並列処理）
      const uploadPromises = imageUrls.map(async (url, index) => {
        const filename = `${workflowRunId}_${index + 1}.png`;
        try {
          const storageUrl = await uploadImageToStorage(url, filename);
          return storageUrl || url; // アップロード失敗時は元のURLを使用
        } catch (error) {
          console.error(`❌ 画像アップロードエラー:`, error);
          console.log(`⚠️ Storage保存失敗、元のURLを使用: ${url}`);
          return url; // エラー時は元のURLを使用
        }
      });

      const processedImageUrls = await Promise.all(uploadPromises);

      // 漫画をライブラリーに保存
      try {
        const title = extractQuestionFromOutput(outputs) || '無題の漫画';
        
        await saveMangaToLibrary({
          title: title,
          question: title,
          level: '未設定',
          image_urls: processedImageUrls,
          workflow_run_id: workflowRunId
        });
        
        console.log('✅ 漫画ライブラリーに保存完了');
      } catch (error) {
        console.error('❌ 漫画ライブラリー保存エラー:', error);
        // ライブラリー保存に失敗しても画像は返す
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