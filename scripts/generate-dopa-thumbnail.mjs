import puppeteer from "puppeteer";
import fs from "fs";

const OUTPUT_PATH = "/Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha/public/gacha-thumbnail-dopa.png";
const BASE_URL = "http://localhost:3009";

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body { 
      width: 1200px; 
      height: 630px; 
      overflow: hidden;
      font-family: 'Zen Maru Gothic', sans-serif;
    }
    
    .container {
      width: 100%;
      height: 100%;
      background: 
        radial-gradient(ellipse at center, rgba(255,215,0,0.4) 0%, transparent 50%),
        radial-gradient(ellipse at 30% 30%, rgba(255,100,0,0.2) 0%, transparent 40%),
        radial-gradient(ellipse at 70% 70%, rgba(255,50,100,0.2) 0%, transparent 40%),
        linear-gradient(135deg, #1a0505 0%, #3d0a0a 30%, #5a1515 50%, #3d0a0a 70%, #1a0505 100%);
      position: relative;
      overflow: hidden;
    }
    
    /* 光線バースト */
    .light-burst {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 150%;
      height: 150%;
      background: conic-gradient(from 0deg, 
        transparent 0deg, rgba(255,215,0,0.3) 5deg, transparent 10deg,
        transparent 20deg, rgba(255,200,0,0.25) 25deg, transparent 30deg,
        transparent 40deg, rgba(255,215,0,0.3) 45deg, transparent 50deg,
        transparent 60deg, rgba(255,200,0,0.25) 65deg, transparent 70deg,
        transparent 80deg, rgba(255,215,0,0.3) 85deg, transparent 90deg,
        transparent 100deg, rgba(255,200,0,0.25) 105deg, transparent 110deg,
        transparent 120deg, rgba(255,215,0,0.3) 125deg, transparent 130deg,
        transparent 140deg, rgba(255,200,0,0.25) 145deg, transparent 150deg,
        transparent 160deg, rgba(255,215,0,0.3) 165deg, transparent 170deg,
        transparent 180deg, rgba(255,200,0,0.25) 185deg, transparent 190deg,
        transparent 200deg, rgba(255,215,0,0.3) 205deg, transparent 210deg,
        transparent 220deg, rgba(255,200,0,0.25) 225deg, transparent 230deg,
        transparent 240deg, rgba(255,215,0,0.3) 245deg, transparent 250deg,
        transparent 260deg, rgba(255,200,0,0.25) 265deg, transparent 270deg,
        transparent 280deg, rgba(255,215,0,0.3) 285deg, transparent 290deg,
        transparent 300deg, rgba(255,200,0,0.25) 305deg, transparent 310deg,
        transparent 320deg, rgba(255,215,0,0.3) 325deg, transparent 330deg,
        transparent 340deg, rgba(255,200,0,0.25) 345deg, transparent 350deg,
        transparent 360deg
      );
    }
    
    /* キラキラスター */
    .star {
      position: absolute;
      width: 30px;
      height: 30px;
      background: radial-gradient(circle, #fff 0%, #ffd700 40%, transparent 70%);
      border-radius: 50%;
    }
    .star::before {
      content: '✦';
      position: absolute;
      font-size: 40px;
      color: #ffd700;
      text-shadow: 0 0 20px #ffd700;
      top: -10px;
      left: -5px;
    }
    .star-1 { top: 8%; left: 12%; }
    .star-2 { top: 12%; right: 15%; }
    .star-3 { top: 35%; left: 3%; }
    .star-4 { top: 30%; right: 5%; }
    .star-5 { bottom: 35%; left: 8%; }
    .star-6 { bottom: 30%; right: 10%; }
    
    /* メインカード */
    .main-card {
      position: absolute;
      filter: drop-shadow(0 0 20px rgba(255,215,0,0.9)) drop-shadow(0 8px 25px rgba(0,0,0,0.6));
      border-radius: 10px;
    }
    
    .card-center { top: 20px; left: 50%; transform: translateX(-50%); width: 180px; z-index: 15; }
    .card-left-1 { top: 50px; left: 30%; transform: rotate(-10deg); width: 155px; z-index: 12; }
    .card-left-2 { top: 70px; left: 12%; transform: rotate(-20deg); width: 135px; z-index: 10; }
    .card-left-3 { top: 90px; left: -2%; transform: rotate(-30deg); width: 115px; z-index: 8; }
    .card-right-1 { top: 50px; right: 30%; transform: rotate(10deg); width: 155px; z-index: 12; }
    .card-right-2 { top: 70px; right: 12%; transform: rotate(20deg); width: 135px; z-index: 10; }
    .card-right-3 { top: 90px; right: -2%; transform: rotate(30deg); width: 115px; z-index: 8; }
    
    /* タイトルエリア */
    .title-area {
      position: absolute;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      z-index: 30;
    }
    
    .main-title {
      font-size: 80px;
      font-weight: 900;
      letter-spacing: 8px;
      background: linear-gradient(180deg, 
        #ffffff 0%,
        #fffacd 15%,
        #ffd700 30%,
        #ffb700 50%,
        #ff8c00 70%,
        #ff4500 90%,
        #cc0000 100%
      );
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      position: relative;
      display: inline-block;
      filter: drop-shadow(0 0 15px rgba(255,200,0,0.9));
    }
    
    .main-title::before {
      content: '夢タイプ診断';
      position: absolute;
      top: 0; left: 0;
      -webkit-text-stroke: 6px #8B0000;
      color: transparent;
      z-index: -1;
    }
    
    .main-title::after {
      content: '夢タイプ診断';
      position: absolute;
      top: 0; left: 0;
      -webkit-text-stroke: 12px #000;
      color: transparent;
      z-index: -2;
    }
    
    .sub-title {
      font-size: 28px;
      font-weight: 900;
      color: #fff;
      text-shadow: 
        0 0 25px rgba(255,100,180,1),
        0 0 50px rgba(200,50,150,0.7),
        3px 3px 0 #660033;
      margin-top: 10px;
      letter-spacing: 6px;
    }
    
    /* レインボーバー */
    .rainbow-bar {
      position: absolute;
      bottom: 85px;
      left: 50%;
      transform: translateX(-50%);
      width: 650px;
      height: 6px;
      background: linear-gradient(90deg, 
        #ff0000, #ff8800, #ffff00, #00ff00, #00ffff, #0088ff, #8800ff, #ff0088
      );
      border-radius: 3px;
      box-shadow: 0 0 15px rgba(255,255,255,0.5);
      z-index: 25;
    }
    
    .hot-text {
      position: absolute;
      bottom: 55px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 24px;
      font-weight: 900;
      color: #ffd700;
      text-shadow: 0 0 15px rgba(255,200,0,1), 2px 2px 0 #8B0000;
      letter-spacing: 8px;
      z-index: 26;
    }
    
    /* サブカード */
    .sub-cards {
      position: absolute;
      bottom: 5px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 6px;
      z-index: 20;
    }
    
    .sub-card {
      width: 75px;
      filter: drop-shadow(0 0 8px rgba(255,215,0,0.7));
      border-radius: 5px;
    }
    
    /* バッジ */
    .badge {
      position: absolute;
      font-weight: 900;
      padding: 10px 20px;
      border-radius: 10px;
      z-index: 50;
    }
    
    .badge-left {
      top: 15px; left: 15px;
      background: linear-gradient(135deg, #ff3333 0%, #cc0000 100%);
      color: white;
      font-size: 20px;
      border: 3px solid #ffd700;
      transform: rotate(-5deg);
      box-shadow: 0 0 25px rgba(255,0,0,0.5), 0 5px 15px rgba(0,0,0,0.4);
    }
    
    .badge-right {
      top: 15px; right: 15px;
      background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
      color: #1a0a1a;
      font-size: 20px;
      border: 3px solid #fff;
      transform: rotate(5deg);
      box-shadow: 0 0 25px rgba(255,200,0,0.5), 0 5px 15px rgba(0,0,0,0.4);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="light-burst"></div>
    
    <div class="star star-1"></div>
    <div class="star star-2"></div>
    <div class="star star-3"></div>
    <div class="star star-4"></div>
    <div class="star star-5"></div>
    <div class="star star-6"></div>
    
    <div class="badge badge-left">🔮 完全無料</div>
    <div class="badge badge-right">✨ 全9タイプ</div>
    
    <img class="main-card card-center" src="${BASE_URL}/cards/きんまん鳳凰１.png" />
    <img class="main-card card-left-1" src="${BASE_URL}/cards/きんまんペガサス１.png" />
    <img class="main-card card-left-2" src="${BASE_URL}/cards/きんまん狐１.png" />
    <img class="main-card card-left-3" src="${BASE_URL}/cards/きんまんシャーク１.png" />
    <img class="main-card card-right-1" src="${BASE_URL}/cards/きんまんドラゴン１.png" />
    <img class="main-card card-right-2" src="${BASE_URL}/cards/きんまんウルフ１.png" />
    <img class="main-card card-right-3" src="${BASE_URL}/cards/きんまん亀１.png" />
    
    <div class="title-area">
      <div class="main-title">夢タイプ診断</div>
      <div class="sub-title">〜 運命のカードがあなたを待つ 〜</div>
    </div>
    
    <div class="rainbow-bar"></div>
    <div class="hot-text">★ 激アツ確定演出 ★</div>
    
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
  console.log("🎰 パチンコ風ギラギラサムネイル生成開始...");
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
  
  await page.setContent(html, { waitUntil: 'load', timeout: 60000 });
  
  // 画像読み込み待機
  await new Promise(r => setTimeout(r, 3000));
  
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
