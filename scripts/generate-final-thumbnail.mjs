import puppeteer from "puppeteer";
import fs from "fs";

const OUTPUT_PATH = "/Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha/public/gacha-thumbnail-final.png";
const BASE_URL = "http://localhost:3009";

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body { 
      width: 1200px; 
      height: 630px; 
      overflow: hidden;
    }
    
    .container {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
    }
    
    /* スピリチュアル背景 */
    .spiritual-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    /* ゴールドオーバーレイ */
    .gold-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(ellipse at center, rgba(255,215,0,0.25) 0%, transparent 60%);
      pointer-events: none;
    }
    
    /* カード配置 - 上部に大きく扇状 */
    .main-card {
      position: absolute;
      filter: drop-shadow(0 0 30px rgba(255,215,0,1)) drop-shadow(0 10px 40px rgba(0,0,0,0.8));
      border-radius: 12px;
    }
    
    .card-center { top: -30px; left: 50%; transform: translateX(-50%); width: 210px; z-index: 25; }
    .card-left-1 { top: 10px; left: 28%; transform: rotate(-12deg); width: 180px; z-index: 22; }
    .card-left-2 { top: 40px; left: 8%; transform: rotate(-22deg); width: 155px; z-index: 20; }
    .card-left-3 { top: 70px; left: -8%; transform: rotate(-32deg); width: 130px; z-index: 18; }
    .card-right-1 { top: 10px; right: 28%; transform: rotate(12deg); width: 180px; z-index: 22; }
    .card-right-2 { top: 40px; right: 8%; transform: rotate(22deg); width: 155px; z-index: 20; }
    .card-right-3 { top: 70px; right: -8%; transform: rotate(32deg); width: 130px; z-index: 18; }
    
    /* メインタイトル（背景削除済み） */
    .main-title-img {
      position: absolute;
      bottom: 85px;
      left: 50%;
      transform: translateX(-50%);
      width: 650px;
      z-index: 35;
      filter: drop-shadow(0 0 50px rgba(255,200,0,1)) drop-shadow(0 5px 20px rgba(0,0,0,0.5));
    }
    
    /* リッチバッジ - 透過背景 */
    .badge-left-img {
      position: absolute;
      top: 12px;
      left: 12px;
      width: 220px;
      z-index: 50;
      transform: rotate(-5deg);
      filter: drop-shadow(0 0 25px rgba(255,0,0,0.9)) drop-shadow(0 3px 10px rgba(0,0,0,0.5));
    }
    
    .badge-right-img {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 200px;
      z-index: 50;
      transform: rotate(5deg);
      filter: drop-shadow(0 0 25px rgba(255,200,0,0.9)) drop-shadow(0 3px 10px rgba(0,0,0,0.5));
    }
    
    /* サブカード - 下部 */
    .sub-cards {
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;
      z-index: 30;
    }
    
    .sub-card {
      width: 78px;
      filter: drop-shadow(0 0 15px rgba(255,215,0,1));
      border-radius: 6px;
    }
    
    /* レインボーバー - 削除 */
    .rainbow-bar {
      display: none;
    }
    
    /* キラキラエフェクト */
    .sparkle {
      position: absolute;
      font-size: 50px;
      color: #ffd700;
      text-shadow: 0 0 30px #ffd700, 0 0 60px #fff;
      z-index: 40;
    }
    .sparkle-1 { top: 8%; left: 5%; }
    .sparkle-2 { top: 12%; right: 8%; }
    .sparkle-3 { top: 45%; left: 2%; }
    .sparkle-4 { top: 40%; right: 3%; }
    .sparkle-5 { bottom: 25%; left: 6%; }
    .sparkle-6 { bottom: 20%; right: 5%; }
    
    /* 引き寄せ力UPメッセージ */
    .hikiyose-message {
      position: absolute;
      bottom: 95px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 45;
      background: linear-gradient(135deg, rgba(255,215,0,0.95) 0%, rgba(255,150,100,0.95) 100%);
      padding: 8px 30px;
      border-radius: 30px;
      border: 3px solid #fff;
      box-shadow: 0 0 30px rgba(255,215,0,0.8), 0 5px 20px rgba(0,0,0,0.4);
      white-space: nowrap;
    }
    
    .hikiyose-message span {
      font-family: "Hiragino Mincho ProN", "Yu Mincho", serif;
      font-size: 22px;
      font-weight: 900;
      color: #4a1500;
      text-shadow: 0 1px 0 rgba(255,255,255,0.6);
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- スピリチュアル背景 -->
    <img class="spiritual-bg" src="${BASE_URL}/thumbnail-assets/spiritual-bg.png" />
    
    <!-- ゴールドオーバーレイ -->
    <div class="gold-overlay"></div>
    
    <!-- キラキラ -->
    <div class="sparkle sparkle-1">✦</div>
    <div class="sparkle sparkle-2">✦</div>
    <div class="sparkle sparkle-3">✦</div>
    <div class="sparkle sparkle-4">✦</div>
    <div class="sparkle sparkle-5">✦</div>
    <div class="sparkle sparkle-6">✦</div>
    
    <!-- リッチバッジ（クリーン透過） -->
    <img class="badge-left-img" src="${BASE_URL}/thumbnail-assets/badge-free-clean.png" />
    <img class="badge-right-img" src="${BASE_URL}/thumbnail-assets/badge-types-clean.png" />
    
    <!-- メインカード群 -->
    <img class="main-card card-center" src="${BASE_URL}/cards/きんまん鳳凰１.png" />
    <img class="main-card card-left-1" src="${BASE_URL}/cards/きんまんペガサス１.png" />
    <img class="main-card card-left-2" src="${BASE_URL}/cards/きんまん狐１.png" />
    <img class="main-card card-left-3" src="${BASE_URL}/cards/きんまんシャーク１.png" />
    <img class="main-card card-right-1" src="${BASE_URL}/cards/きんまんドラゴン１.png" />
    <img class="main-card card-right-2" src="${BASE_URL}/cards/きんまんウルフ１.png" />
    <img class="main-card card-right-3" src="${BASE_URL}/cards/きんまん亀１.png" />
    
    <!-- メインタイトル（背景削除済み） -->
    <img class="main-title-img" src="${BASE_URL}/thumbnail-assets/title-rainbow-nobg.png" />
    
    <!-- 引き寄せ力UPメッセージ -->
    <div class="hikiyose-message">
      <span>📱 待ち受けにして引き寄せ力UP！ ✨</span>
    </div>
    
    <!-- サブカード -->
    <div class="sub-cards">
      <img class="sub-card" src="${BASE_URL}/cards/鳳凰１.png" />
      <img class="sub-card" src="${BASE_URL}/cards/ペガサス１.png" />
      <img class="sub-card" src="${BASE_URL}/cards/ドラゴン１.png" />
      <img class="sub-card" src="${BASE_URL}/cards/狐１.png" />
      <img class="sub-card" src="${BASE_URL}/cards/ウルフ１.png" />
      <img class="sub-card" src="${BASE_URL}/cards/シャーク１.png" />
      <img class="sub-card" src="${BASE_URL}/cards/亀１.png" />
      <img class="sub-card" src="${BASE_URL}/cards/エレファント１.png" />
      <img class="sub-card" src="${BASE_URL}/cards/鹿１.png" />
    </div>
  </div>
</body>
</html>
`;

async function generateThumbnail() {
  console.log("🎰 最終サムネイル生成開始...");
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
  
  await page.setContent(html, { waitUntil: 'load', timeout: 60000 });
  
  // 画像読み込み待機
  await new Promise(r => setTimeout(r, 4000));
  
  await page.screenshot({
    path: OUTPUT_PATH,
    type: 'png',
    fullPage: false
  });
  
  await browser.close();
  
  const stats = fs.statSync(OUTPUT_PATH);
  console.log(`✅ サムネイル生成完了: ${OUTPUT_PATH}`);
  console.log(`   サイズ: ${Math.round(stats.size / 1024)}KB`);
}

generateThumbnail().catch(console.error);
