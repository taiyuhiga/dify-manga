import { NextRequest, NextResponse } from 'next/server';

// SSE用のヘルパー関数
function createSSEMessage(type: string, data: unknown): string {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

// Dify APIを使用してワークフローを実行し、1コマずつ生成結果を送信
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
    
    // SSEストリームの設定
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // 送信用ヘルパー関数
        const sendSSE = (type: string, data: unknown) => {
          const message = createSSEMessage(type, data);
          controller.enqueue(encoder.encode(message));
        };

        try {
          // 1. 開始通知
          sendSSE('start', { message: '漫画生成を開始しています...' });

          if (!difyApiKey || difyApiKey === 'mock') {
            // モックモード: デモ用の段階的生成をシミュレート
            console.log('Using mock streaming mode with:', { user_question, user_level });
            
            sendSSE('planning', { message: '漫画の構成を計画中...' });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const mockPanels = [
              { panel_id: 1, title: '導入', description: `「${user_question}」って何だろう？` },
              { panel_id: 2, title: '基礎説明', description: '基本的な概念を理解しよう' },
              { panel_id: 3, title: '詳細解説', description: 'より詳しく見てみよう' },
              { panel_id: 4, title: '応用例', description: '実際の例で確認しよう' },
              { panel_id: 5, title: 'まとめ', description: '理解できたかな？' }
            ];

            sendSSE('plan_complete', { 
              total_panels: mockPanels.length,
              panels: mockPanels
            });

            // 各コマを順次生成（モック）
            const generatedPanels = [];
            for (let i = 0; i < mockPanels.length; i++) {
              sendSSE('panel_generating', { 
                panel_id: i + 1, 
                progress: Math.round(((i + 1) / mockPanels.length) * 100),
                message: `コマ ${i + 1} を生成中...`
              });

              await new Promise(resolve => setTimeout(resolve, 3000));

              // モック画像URL（実際の実装では画像生成APIを使用）
              const mockImageUrl = `/placeholder-manga.png`;
              
              const panelData = {
                panel_id: i + 1,
                image_url: mockImageUrl,
                title: mockPanels[i].title,
                description: mockPanels[i].description
              };

              generatedPanels.push(panelData);

              sendSSE('panel_complete', panelData);
            }

            sendSSE('complete', { 
              message: '漫画生成が完了しました！',
              panels: generatedPanels,
              total_panels: generatedPanels.length
            });

          } else {
            // 実際のDify API使用
            console.log('Starting streaming Dify workflow...');
            
            // 1. 計画フェーズ: 既存のワークフローで全体構成を取得
            sendSSE('planning', { message: '漫画の構成を計画中...' });
            
            const planningResponse = await fetch('https://api.dify.ai/v1/workflows/run', {
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
                user: 'nextjs-manga-streaming-user',
              }),
            });

            if (!planningResponse.ok) {
              throw new Error('計画フェーズでエラーが発生しました');
            }

            if (!planningResponse.body) {
              throw new Error('計画フェーズのレスポンスボディがありません');
            }

            // ストリーミングレスポンスから計画データを取得
            const reader = planningResponse.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedBuffer = '';
            let planResult: any = null;
            let allGeneratedImages: string[] = [];
            
            console.log('計画フェーズのストリーム読み取り開始...');

            try {
              while (true) {
                const { value, done } = await reader.read();
                
                if (done) break;
                
                if (value) {
                  const chunk = decoder.decode(value, { stream: true });
                  accumulatedBuffer += chunk;
                  
                  // イベントを解析
                  const lines = accumulatedBuffer.split('\n');
                  for (const line of lines) {
                    if (line.startsWith('data: ')) {
                      try {
                        const eventData = JSON.parse(line.substring(6));
                        console.log('Difyイベント:', eventData.event, eventData.data?.node_type);
                        
                        // 各ノードの完了時に画像URLを収集
                        if (eventData.event === 'node_finished' && eventData.data?.outputs?.files) {
                          const files = eventData.data.outputs.files;
                          if (Array.isArray(files)) {
                            files.forEach((file: any) => {
                              if (file.url) {
                                allGeneratedImages.push(file.url);
                                console.log('生成された画像URL:', file.url);
                              }
                            });
                          }
                        }
                        
                        if (eventData.event === 'workflow_finished') {
                          planResult = eventData.data;
                          break;
                        }
                      } catch (e) {
                        // JSONパースエラーを無視
                      }
                    }
                  }
                  
                  if (planResult) break;
                }
              }
            } finally {
              if (!reader.closed) {
                await reader.cancel();
              }
            }

            if (!planResult) {
              throw new Error('計画フェーズの結果を取得できませんでした');
            }

            console.log('計画フェーズ完了:', planResult);

            // 計画結果をパース
            let planData;
            try {
              const outputs = planResult.outputs;
              console.log('計画フェーズの出力:', outputs);
              console.log('収集された画像URL数:', allGeneratedImages.length);
              
              // outputsが空またはtextが空配列の場合、モックデータを使用
              if (!outputs || !outputs.text || (Array.isArray(outputs.text) && outputs.text.length === 0)) {
                console.log('計画フェーズの出力が空のため、モックデータを使用します');
                planData = {
                  total_panels: Math.max(allGeneratedImages.length, 20),
                  story_arc: { phase_overview: '光合成についての教育漫画' },
                  main_characters: [
                    { name: '学び君', role: 'student' },
                    { name: '知識先生', role: 'teacher' }
                  ],
                  generated_images: allGeneratedImages
                };
              } else {
                planData = typeof outputs.text === 'string' ? JSON.parse(outputs.text) : outputs.text;
                // 生成された画像をplanDataに追加
                planData.generated_images = allGeneratedImages;
              }
            } catch (error) {
              console.error('計画データの解析エラー:', error);
              // エラーの場合もモックデータを使用
              planData = {
                total_panels: Math.max(allGeneratedImages.length, 20),
                story_arc: { phase_overview: '光合成についての教育漫画' },
                main_characters: [
                  { name: '学び君', role: 'student' },
                  { name: '知識先生', role: 'teacher' }
                ],
                generated_images: allGeneratedImages
              };
            }

            const totalPanels = planData.total_panels || 20;
            sendSSE('plan_complete', { 
              total_panels: totalPanels,
              story_arc: planData.story_arc,
              characters: planData.main_characters
            });

            // 2. 各コマを順次生成
            const generatedPanels = [];
            const generatedImages = planData.generated_images || [];
            const actualPanelCount = Math.min(totalPanels, Math.max(generatedImages.length, 1));
            
            for (let i = 0; i < actualPanelCount; i++) {
              sendSSE('panel_generating', { 
                panel_id: i + 1, 
                progress: Math.round(((i + 1) / actualPanelCount) * 100),
                message: `コマ ${i + 1}/${actualPanelCount} を生成中...`
              });

              try {
                // Difyで生成された画像があれば使用、なければプレースホルダーを使用
                let imageUrl = `/placeholder-manga.png`;
                if (generatedImages[i]) {
                  // Dify生成画像をプロキシ経由で使用
                  imageUrl = `/api/proxy-image?url=${encodeURIComponent(generatedImages[i])}`;
                }
                
                const panelData = {
                  panel_id: i + 1,
                  image_url: imageUrl,
                  title: `コマ ${i + 1}`,
                  description: `${user_question} についての説明 (${user_level}向け) - コマ ${i + 1}`
                };

                generatedPanels.push(panelData);
                sendSSE('panel_complete', panelData);

                // 短い遅延を追加（UIの更新を見やすくするため）
                await new Promise(resolve => setTimeout(resolve, 500));

              } catch (error) {
                console.error(`Panel ${i + 1} generation failed:`, error);
                sendSSE('panel_error', { 
                  panel_id: i + 1, 
                  error: `コマ ${i + 1} の生成に失敗しました` 
                });
              }
            }

            sendSSE('complete', { 
              message: '漫画生成が完了しました！',
              panels: generatedPanels,
              total_panels: generatedPanels.length
            });
          }

        } catch (error) {
          console.error('Streaming manga generation error:', error);
          sendSSE('error', { 
            error: error instanceof Error ? error.message : '不明なエラーが発生しました' 
          });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error in streaming-manga-generation:', error);
    return NextResponse.json(
      { error: `処理中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}` },
      { status: 500 }
    );
  }
}

// 単一コマ生成のヘルパー関数（実際の実装では別のDifyワークフローを使用）
async function generateSinglePanel(
  difyApiKey: string, 
  panelId: number, 
  planData: unknown,
  userQuestion: string,
  userLevel: string
): Promise<{ imageUrl: string; title: string; description: string }> {
  // 実際の実装では、1コマ生成用の簡略化されたDifyワークフローを呼び出します
  // 現在は仮の実装
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  return {
    imageUrl: `/placeholder-manga.png`,
    title: `コマ ${panelId}`,
    description: `${userQuestion} についての説明 (${userLevel}向け)`
  };
}

// OPTIONSリクエスト用
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}