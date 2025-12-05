#!/usr/bin/env node
/**
 * カード動画生成スクリプト
 * FAL AI Veo 3.1 を使用してカード画像を動画化
 */

import * as fal from '@fal-ai/serverless-client';
import fs from 'fs';
import path from 'path';
import https from 'https';

// FAL AI設定
fal.config({
  credentials: '2119fdd6-23d0-44a6-9c22-932a62b4126f:5881f0e3fb013f61564554ca663ea949'
});

// カード画像のパス
const CARD_IMAGES = [
  '/Users/okajima/Downloads/きんまんカード/ドラゴン１.png',
  '/Users/okajima/Downloads/きんまんカード/ウルフ１.png',
  '/Users/okajima/Downloads/きんまんカード/きんまん鳳凰１.png',
];

// きんまん3Dモデル
const KINMAN_3D_MODEL = '/Users/okajima/引き寄せノート講座ローンチプロジェクト/3DモデルKINMAN.png';

// 動画生成のプロンプト
const VIDEO_PROMPTS = {
  dragon: 'A mystical tarot card emerges from golden light particles, rotating slowly with magical sparkles, the dragon illustration glows with ethereal energy, cinematic lighting, 4K quality',
  wolf: 'A fortune card materializes from purple mist, spinning gracefully with magical aura, the wolf illustration pulses with power, mystical atmosphere, professional quality',
  phoenix: 'A sacred card descends from heavenly light, gentle rotation with golden particles swirling around, the phoenix illustration radiates warmth, spiritual energy, stunning visuals',
  kinman: 'A cute chibi character in white kimono robe appears from golden sparkles, the character bows gently and then opens eyes with a warm smile, magical particles floating around, spiritual zen atmosphere, soft lighting, high quality 3D animation style'
};

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

async function generateVideo(imagePath, prompt, outputName) {
  console.log(`\n🎬 動画生成開始: ${path.basename(imagePath)}`);
  console.log(`📝 プロンプト: ${prompt.substring(0, 50)}...`);
  
  try {
    const imageDataUrl = await imageToBase64(imagePath);
    
    // Veo 3.1 Image-to-Video
    const result = await fal.subscribe('fal-ai/veo3.1/image-to-video', {
      input: {
        image_url: imageDataUrl,
        prompt: prompt,
        duration: 5, // 5秒
        aspect_ratio: '9:16', // スマホ向け縦動画
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log(`⏳ 処理中...`);
        }
      }
    });

    console.log('✅ 生成完了！');
    console.log('結果:', JSON.stringify(result, null, 2));

    // 動画をダウンロード
    if (result.video && result.video.url) {
      const outputDir = '/Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha/public/videos';
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = path.join(outputDir, `${outputName}.mp4`);
      await downloadFile(result.video.url, outputPath);
      console.log(`💾 保存完了: ${outputPath}`);
      return outputPath;
    }

    return result;
  } catch (error) {
    console.error('❌ エラー:', error.message);
    
    // Veo 3.1が失敗した場合、Kling 2.5を試す
    console.log('\n🔄 Kling 2.5 Turbo Pro にフォールバック...');
    try {
      const imageDataUrl = await imageToBase64(imagePath);
      
      const result = await fal.subscribe('fal-ai/kling-video/v2.5-turbo/pro/image-to-video', {
        input: {
          image_url: imageDataUrl,
          prompt: prompt,
          duration: '5', // 5秒
          aspect_ratio: '9:16',
        },
        logs: true,
      });

      console.log('✅ Kling生成完了！');
      
      if (result.video && result.video.url) {
        const outputDir = '/Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha/public/videos';
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const outputPath = path.join(outputDir, `${outputName}.mp4`);
        await downloadFile(result.video.url, outputPath);
        console.log(`💾 保存完了: ${outputPath}`);
        return outputPath;
      }
      
      return result;
    } catch (klingError) {
      console.error('❌ Klingエラー:', klingError.message);
      throw klingError;
    }
  }
}

async function main() {
  console.log('🎥 カード動画生成ツール');
  console.log('========================\n');
  
  // きんまん3Dモデルで動画生成！
  console.log('🧘 きんまん3Dモデル動画を生成...\n');
  await generateVideo(KINMAN_3D_MODEL, VIDEO_PROMPTS.kinman, 'kinman-3d-animation');
  
  console.log('\n🎉 完了！');
}

main().catch(console.error);

