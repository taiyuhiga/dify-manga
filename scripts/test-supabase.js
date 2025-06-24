#!/usr/bin/env node

// Supabase接続テストスクリプト
// 使用方法: node scripts/test-supabase.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('🔍 Supabase接続テストを開始します...\n');
  
  // 環境変数の確認
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase環境変数が設定されていません:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ 設定済み' : '❌ 未設定');
    console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ 設定済み' : '❌ 未設定');
    return;
  }
  
  console.log('✅ 環境変数チェック完了');
  console.log('   URL:', supabaseUrl);
  console.log('   ANON_KEY:', supabaseAnonKey.substring(0, 20) + '...\n');
  
  // Supabaseクライアントの作成
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // 1. データベース接続テスト
    console.log('🔍 データベース接続テスト...');
    const { data: dbTest, error: dbError } = await supabase
      .from('manga_library')
      .select('count', { count: 'exact', head: true });
    
    if (dbError) {
      console.error('❌ データベース接続エラー:', dbError.message);
    } else {
      console.log('✅ データベース接続成功');
      console.log(`   manga_libraryテーブル件数: ${dbTest?.length || 0}\n`);
    }
    
    // 2. Storageバケット確認
    console.log('🔍 Storageバケット確認...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Storage接続エラー:', bucketError.message);
    } else {
      console.log('✅ Storage接続成功');
      const mangaBucket = buckets.find(bucket => bucket.name === 'manga-images');
      if (mangaBucket) {
        console.log('✅ manga-imagesバケットが見つかりました');
        console.log(`   バケット設定: ${mangaBucket.public ? 'Public' : 'Private'}\n`);
      } else {
        console.error('❌ manga-imagesバケットが見つかりません');
        console.log('   存在するバケット:', buckets.map(b => b.name).join(', ') || 'なし\n');
      }
    }
    
    // 3. テストデータの挿入・削除
    console.log('🔍 データベースread/writeテスト...');
    const testData = {
      title: 'テスト漫画',
      question: 'これはテストです',
      level: 'テスト',
      image_urls: ['https://example.com/test.png'],
      workflow_run_id: `test-${Date.now()}`
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('manga_library')
      .insert([testData])
      .select('id')
      .single();
    
    if (insertError) {
      console.error('❌ データ挿入エラー:', insertError.message);
    } else {
      console.log('✅ データ挿入成功');
      
      // テストデータを削除
      const { error: deleteError } = await supabase
        .from('manga_library')
        .delete()
        .eq('id', insertData.id);
      
      if (deleteError) {
        console.error('❌ テストデータ削除エラー:', deleteError.message);
      } else {
        console.log('✅ テストデータ削除成功\n');
      }
    }
    
    console.log('🎉 Supabase接続テスト完了！');
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error.message);
  }
}

// スクリプト実行
testSupabaseConnection().catch(console.error); 