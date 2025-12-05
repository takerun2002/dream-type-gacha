#!/usr/bin/env node
/**
 * きんまん動画用素材生成スクリプト
 * Step 1: NanoBanana Proでキャラクターシートから単体きんまんを生成
 * Step 2: その素材で動画生成
 */

import * as fal from '@fal-ai/serverless-client';
import fs from 'fs';
import path from 'path';
import https from 'https';

// FAL AI設定
fal.config({
  credentials: '2119fdd6-23d0-44a6-9c22-932a62b4126f:5881f0e3fb013f61564554ca663ea949'
});

// 元のキャラクターシート
const KINMAN_SHEET = '/Users/okajima/引き寄せノート講座ローンチプロジェクト/3DモデルKINMAN.png';

// 出力先
const OUTPUT_DIR = '/Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha/public/kinman-video-assets';

async function imageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(outputPath);
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

// Step 1: NanoBanana Pro (text-to-image) で単体きんまん素材を生成
async function generateKinmanAsset() {
  console.log('🎨 Step 1: NanoBanana Proで単体きんまん素材を生成...\n');
  
  // Text-to-imageでキャラを生成（キャラシートを参考に詳細に記述）
  const poses = [
    {
      name: 'standing',
      prompt: 'A single cute 3D chibi boy character, blonde short hair, big round brown eyes, wearing white traditional Japanese kimono robe with obi belt, standing pose with arms relaxed at sides, gentle warm smile, barefoot. High quality 3D render style like Nendoroid figure. Simple light gray gradient background. Full body view, centered composition. Soft lighting, adorable kawaii aesthetic.'
    },
    {
      name: 'meditation',
      prompt: 'A single cute 3D chibi boy character, blonde short hair, eyes closed peacefully, wearing white traditional Japanese kimono robe, sitting in lotus meditation pose with hands together in prayer position. High quality 3D render style like Nendoroid figure. Simple light gray gradient background. Spiritual zen atmosphere, serene expression. Full body centered.'
    },
    {
      name: 'greeting',
      prompt: 'A single cute 3D chibi boy character, blonde short hair, big round brown eyes, wearing white traditional Japanese kimono robe, bowing gracefully in traditional Japanese greeting pose, polite respectful gesture. High quality 3D render style like Nendoroid figure. Simple light gray gradient background. Full body centered.'
    }
  ];
  
  // 出力ディレクトリ作成
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const generatedAssets = [];
  
  for (const pose of poses) {
    console.log(`  📸 生成中: ${pose.name}...`);
    
    try {
      // NanoBanana Pro text-to-image
      const result = await fal.subscribe('fal-ai/nano-banana-pro', {
        input: {
          prompt: pose.prompt,
          image_size: {
            width: 1024,
            height: 1024
          },
          num_images: 1
        },
        logs: true
      });
      
      if (result.images && result.images[0]) {
        const outputPath = path.join(OUTPUT_DIR, `kinman-${pose.name}.png`);
        await downloadFile(result.images[0].url, outputPath);
        console.log(`  ✅ 保存: ${outputPath}`);
        generatedAssets.push(outputPath);
      }
    } catch (error) {
      console.error(`  ❌ エラー (${pose.name}):`, error.message);
    }
  }
  
  return generatedAssets;
}

// Step 2: 背景除去 (bria/background/removeを使用)
async function removeBackgrounds(assets) {
  console.log('\n🔧 Step 2: 背景除去...\n');
  
  const cleanAssets = [];
  
  for (const assetPath of assets) {
    const fileName = path.basename(assetPath, '.png');
    console.log(`  🧹 処理中: ${fileName}...`);
    
    try {
      const imageDataUrl = await imageToBase64(assetPath);
      
      // bria/background/remove を使用
      const result = await fal.subscribe('fal-ai/bria/background/remove', {
        input: {
          image_url: imageDataUrl
        }
      });
      
      if (result.image && result.image.url) {
        const outputPath = path.join(OUTPUT_DIR, `${fileName}-nobg.png`);
        await downloadFile(result.image.url, outputPath);
        console.log(`  ✅ 保存: ${outputPath}`);
        cleanAssets.push(outputPath);
      }
    } catch (error) {
      console.error(`  ❌ エラー:`, error.message);
      // エラー時は元の素材を使用
      cleanAssets.push(assetPath);
    }
  }
  
  return cleanAssets;
}

// Step 3: 動画生成
async function generateVideos(assets) {
  console.log('\n🎬 動画生成...\n');
  
  const videoPrompts = {
    'kinman-standing': 'The cute chibi character in white kimono slowly raises hand and waves in friendly greeting, subtle body movement, golden sparkles appear around, magical atmosphere, smooth animation',
    'kinman-meditation': 'The cute chibi character in white kimono meditating peacefully, gentle breathing motion with subtle chest movement, golden light energy aura glows softly, spiritual zen atmosphere, serene peaceful scene',
    'kinman-greeting': 'The cute chibi character in white kimono bows gracefully then slowly rises up with warm smile, cherry blossom petals gently falling, traditional Japanese atmosphere'
  };
  
  const videoDir = '/Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha/public/videos';
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }
  
  for (const assetPath of assets) {
    const fileName = path.basename(assetPath, '.png');
    const prompt = videoPrompts[fileName];
    
    if (!prompt) {
      console.log(`  ⚠️ プロンプトなし: ${fileName}`);
      continue;
    }
    
    console.log(`  🎥 動画生成: ${fileName}...`);
    console.log(`  📝 プロンプト: ${prompt.substring(0, 50)}...`);
    
    try {
      const imageDataUrl = await imageToBase64(assetPath);
      
      const result = await fal.subscribe('fal-ai/kling-video/v2.5-turbo/pro/image-to-video', {
        input: {
          image_url: imageDataUrl,
          prompt: prompt,
          duration: '5',
          aspect_ratio: '1:1' // 正方形で生成
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            console.log(`  ⏳ 処理中...`);
          }
        }
      });
      
      if (result.video && result.video.url) {
        const outputPath = path.join(videoDir, `${fileName}-video.mp4`);
        await downloadFile(result.video.url, outputPath);
        console.log(`  ✅ 保存: ${outputPath}`);
      }
    } catch (error) {
      console.error(`  ❌ エラー:`, error.message);
    }
  }
}

async function main() {
  console.log('🧘 きんまん動画素材生成ツール');
  console.log('================================\n');
  
  // 既存の素材を使用
  const existingAssets = [
    path.join(OUTPUT_DIR, 'kinman-standing.png'),
    path.join(OUTPUT_DIR, 'kinman-meditation.png'),
    path.join(OUTPUT_DIR, 'kinman-greeting.png')
  ];
  
  // 素材が存在するか確認
  const assets = existingAssets.filter(p => fs.existsSync(p));
  
  if (assets.length === 0) {
    console.log('❌ 素材がありません。先に素材を生成してください。');
    return;
  }
  
  console.log(`📦 ${assets.length}個の素材を検出\n`);
  
  // Step 3: 動画生成（瞑想ポーズで）
  await generateVideos([assets[1]]); // meditation
  
  console.log('\n🎉 完了！');
}

main().catch(console.error);

