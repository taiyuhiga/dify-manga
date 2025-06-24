import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import { supabase } from '@/lib/supabase';
// ReadableはNode.jsのストリームなので、Next.js Edge Runtimeでは使えない場合がある。
// 今回はWeb APIのReadableStreamを直接使うため、Readableのimportは不要。
// import { Readable } from 'stream'; 

// ReadableStreamをNode.jsのReadableストリームに変換するヘルパー
async function streamToBuffer(readableStream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = readableStream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  try {
    const { user_question, user_level } = await request.json();

    // バリデーション
    if (!user_question || !user_level) {
      return NextResponse.json(
        { error: 'user_question と user_level は必須です' },
        { status: 400 }
      );
    }

    const difyApiKey = process.env.DIFY_API_KEY;
    
    if (!difyApiKey || difyApiKey === 'mock') {
      // モックモードでの処理
      console.log('Using mock API with:', { user_question, user_level });

      const mockWorkflowRunId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await new Promise(resolve => setTimeout(resolve, 1000));

      return NextResponse.json({
        workflow_run_id: mockWorkflowRunId,
        task_id: `task_${mockWorkflowRunId}`,
        message: 'ワークフローの実行を開始しました（モックモード）'
      });
    }

    // 実際のDify APIを使用
    console.log('Calling Dify API (initiate) with:', { user_question, user_level });
    
    const response = await fetch('https://api.dify.ai/v1/workflows/run', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${difyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          user_question: user_question,
          user_level: user_level,
        },
        response_mode: 'streaming',
        user: 'nextjs-manga-viewer-user-polling-v2',
      }),
      redirect: 'follow', // リダイレクトを自動的に処理
    });

    console.log('Dify API (initiate) response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Dify API (initiate) error response body:', errorData);
      
      // APIエラーの場合はモックモードにフォールバック
      console.log('Falling back to mock mode due to API error');
      const mockWorkflowRunId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await new Promise(resolve => setTimeout(resolve, 1000));

      return NextResponse.json({
        workflow_run_id: mockWorkflowRunId,
        task_id: `task_${mockWorkflowRunId}`,
        message: 'ワークフローの実行を開始しました（モックモード - API接続エラーのため）'
      });
    }

    if (!response.body) {
      return NextResponse.json(
        { error: 'Dify APIからのレスポンスボディがありません。' },
        { status: 500 }
      );
    }

    // ストリームから workflow_run_id を抽出
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedBuffer = '';
    let workflowRunId: string | null = null;
    let taskId: string | null = null;
    
    console.log('Starting to read Dify API stream...');

    for (let i = 0; i < 5; i++) { // 最大5回読み取り
      const { value, done } = await reader.read();
      
      if (done) {
        console.log('Stream ended');
        break;
      }
      
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        console.log(`Stream chunk ${i + 1}:`, chunk);
        accumulatedBuffer += chunk;
        
        // イベントを解析
        const lines = accumulatedBuffer.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.substring(6));
              console.log('Parsed event:', eventData);
              
              if (eventData.event === 'workflow_started') {
                workflowRunId = eventData.workflow_run_id;
                taskId = eventData.task_id;
                console.log('Found workflow_run_id:', workflowRunId);
                break;
              }
            } catch (e) {
              // JSONパースエラーを無視
            }
          }
        }
        
        if (workflowRunId) break;
      }
    }

    if (!reader.closed) {
      await reader.cancel();
    }

    if (!workflowRunId) {
      console.error('Could not extract workflow_run_id from stream');
      return NextResponse.json(
        { error: 'ワークフローIDを取得できませんでした。' },
        { status: 500 }
      );
    }

    // Supabaseにレコードを作成
    const { data, error } = await supabase
      .from('mangas')
      .insert([
        { workflow_run_id: workflowRunId, status: 'processing' }
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save to database' }, { status: 500 });
    }

    console.log('✅ Supabase record created:', data);
    return NextResponse.json({ 
      workflow_run_id: workflowRunId, 
      task_id: taskId 
    });

  } catch (error) {
    console.error('Error in initiate-manga-generation:', error);
    
    // エラーが発生した場合もモックモードにフォールバック
    console.log('Falling back to mock mode due to error');
    const mockWorkflowRunId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return NextResponse.json({
      workflow_run_id: mockWorkflowRunId,
      task_id: `task_${mockWorkflowRunId}`,
      message: 'ワークフローの実行を開始しました（モックモード - エラーのため）'
    });
  }
} 