import puppeteer from "puppeteer";
import fs from "fs";

const CARDS_DIR = "/Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha/public/cards";
const OUTPUT_PATH = "/Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha/public/gacha-thumbnail-3d.png";

// Base64で画像を読み込む関数
function imageToBase64(filePath) {
  const data = fs.readFileSync(filePath);
  return `data:image/png;base64,${data.toString('base64')}`;
}

// 画像をBase64に変換
const cardImages = {
  kinmanPhoenix: imageToBase64(`${CARDS_DIR}/きんまん鳳凰１.png`),
  kinmanPegasus: imageToBase64(`${CARDS_DIR}/きんまんペガサス１.png`),
  kinmanDragon: imageToBase64(`${CARDS_DIR}/きんまんドラゴン１.png`),
  kinmanFox: imageToBase64(`${CARDS_DIR}/きんまん狐１.png`),
  kinmanWolf: imageToBase64(`${CARDS_DIR}/きんまんウルフ１.png`),
  kinmanShark: imageToBase64(`${CARDS_DIR}/きんまんシャーク１.png`),
  kinmanTurtle: imageToBase64(`${CARDS_DIR}/きんまん亀１.png`),
  kinmanElephant: imageToBase64(`${CARDS_DIR}/きんまんエレファント１.png`),
  kinmanDeer: imageToBase64(`${CARDS_DIR}/きんまん鹿１.png`),
};

const html = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@900&display=swap');
    
    * { margin: 0; padding: 0; }
    body { 
      width: 1200px; 
      height: 630px; 
      overflow: hidden;
      background: radial-gradient(ellipse at center, #2a0a2a 0%, #0a0015 100%);
    }
    #canvas-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    
    /* オーバーレイUI */
    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 100;
    }
    
    .badge {
      position: absolute;
      font-family: 'Zen Maru Gothic', sans-serif;
      font-weight: 900;
      padding: 12px 24px;
      border-radius: 12px;
      transform: rotate(-5deg);
      box-shadow: 0 0 30px rgba(255,200,0,0.5), 0 5px 15px rgba(0,0,0,0.5);
    }
    
    .badge-left {
      top: 20px;
      left: 20px;
      background: linear-gradient(135deg, #ff3333 0%, #cc0000 100%);
      color: white;
      font-size: 24px;
      border: 3px solid #ffd700;
    }
    
    .badge-right {
      top: 20px;
      right: 20px;
      transform: rotate(5deg);
      background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
      color: #1a0a1a;
      font-size: 24px;
      border: 3px solid #fff;
    }
    
    .title-container {
      position: absolute;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
    }
    
    .main-title {
      font-family: 'Zen Maru Gothic', sans-serif;
      font-size: 85px;
      font-weight: 900;
      background: linear-gradient(180deg, 
        #ffffff 0%,
        #fff8dc 15%,
        #ffd700 35%,
        #ffa500 55%,
        #ff6600 75%,
        #ff0000 100%
      );
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      letter-spacing: 10px;
      filter: drop-shadow(0 0 20px rgba(255,200,0,0.8));
      position: relative;
    }
    
    .main-title::before {
      content: '夢タイプ診断';
      position: absolute;
      top: 0;
      left: 0;
      -webkit-text-stroke: 6px #8B0000;
      color: transparent;
      z-index: -1;
    }
    
    .main-title::after {
      content: '夢タイプ診断';
      position: absolute;
      top: 0;
      left: 0;
      -webkit-text-stroke: 12px #000;
      color: transparent;
      z-index: -2;
    }
    
    .sub-title {
      font-family: 'Zen Maru Gothic', sans-serif;
      font-size: 28px;
      font-weight: 900;
      color: #fff;
      text-shadow: 
        0 0 30px rgba(255,100,200,1),
        0 0 60px rgba(200,50,150,0.8),
        3px 3px 0 #660033;
      margin-top: 15px;
      letter-spacing: 8px;
    }
    
    .rainbow-bar {
      position: absolute;
      bottom: 70px;
      left: 50%;
      transform: translateX(-50%);
      width: 700px;
      height: 6px;
      background: linear-gradient(90deg, 
        #ff0000, #ff8800, #ffff00, #00ff00, #00ffff, #0088ff, #8800ff, #ff0088
      );
      border-radius: 3px;
      box-shadow: 0 0 20px rgba(255,255,255,0.6);
    }
    
    .hot-text {
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Zen Maru Gothic', sans-serif;
      font-size: 26px;
      font-weight: 900;
      color: #ffd700;
      text-shadow: 
        0 0 20px rgba(255,200,0,1),
        2px 2px 0 #990000;
      letter-spacing: 10px;
    }
  </style>
</head>
<body>
  <div id="canvas-container"></div>
  
  <div class="overlay">
    <div class="badge badge-left">🔮 完全無料</div>
    <div class="badge badge-right">✨ 全9タイプ</div>
    
    <div class="title-container">
      <div class="main-title">夢タイプ診断</div>
      <div class="sub-title">〜 運命のカードがあなたを待つ 〜</div>
    </div>
    
    <div class="rainbow-bar"></div>
    <div class="hot-text">★ 激アツ確定演出 ★</div>
  </div>
  
  <script>
    // カード画像データ
    const cardUrls = [
      "${cardImages.kinmanPhoenix}",
      "${cardImages.kinmanPegasus}",
      "${cardImages.kinmanDragon}",
      "${cardImages.kinmanFox}",
      "${cardImages.kinmanWolf}",
      "${cardImages.kinmanShark}",
      "${cardImages.kinmanTurtle}",
      "${cardImages.kinmanElephant}",
      "${cardImages.kinmanDeer}",
    ];
    
    // Three.js セットアップ
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1200 / 630, 0.1, 1000);
    camera.position.z = 8;
    camera.position.y = 0.5;
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      preserveDrawingBuffer: true 
    });
    renderer.setSize(1200, 630);
    renderer.setPixelRatio(2);
    renderer.setClearColor(0x000000, 0);
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // パーティクル（金色キラキラ）
    const particleCount = 500;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 20;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
      particleSizes[i] = Math.random() * 0.15 + 0.05;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    
    // 光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0xffd700, 2, 20);
    pointLight1.position.set(0, 5, 5);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xff6600, 1.5, 15);
    pointLight2.position.set(-5, -2, 3);
    scene.add(pointLight2);
    
    const pointLight3 = new THREE.PointLight(0xff00ff, 1, 15);
    pointLight3.position.set(5, -2, 3);
    scene.add(pointLight3);
    
    // カードを作成
    const cards = [];
    const textureLoader = new THREE.TextureLoader();
    
    const cardWidth = 1.4;
    const cardHeight = 2.0;
    
    // カード配置（円形に配置）
    const cardConfigs = [
      { angle: 0, radius: 0, y: 0.3, scale: 1.3 },           // 中央（大きめ）
      { angle: -0.5, radius: 3, y: 0.1, scale: 1.1 },        // 左1
      { angle: 0.5, radius: 3, y: 0.1, scale: 1.1 },         // 右1
      { angle: -0.9, radius: 4.5, y: -0.2, scale: 0.95 },    // 左2
      { angle: 0.9, radius: 4.5, y: -0.2, scale: 0.95 },     // 右2
      { angle: -1.3, radius: 5.5, y: -0.5, scale: 0.85 },    // 左3
      { angle: 1.3, radius: 5.5, y: -0.5, scale: 0.85 },     // 右3
      { angle: -1.6, radius: 6, y: -0.8, scale: 0.75 },      // 左4
      { angle: 1.6, radius: 6, y: -0.8, scale: 0.75 },       // 右4
    ];
    
    cardUrls.forEach((url, index) => {
      const texture = textureLoader.load(url);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      
      const geometry = new THREE.PlaneGeometry(cardWidth, cardHeight);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        metalness: 0.3,
        roughness: 0.4,
      });
      
      const card = new THREE.Mesh(geometry, material);
      
      const config = cardConfigs[index];
      card.position.x = Math.sin(config.angle) * config.radius;
      card.position.y = config.y;
      card.position.z = -Math.cos(config.angle) * config.radius * 0.3;
      card.scale.setScalar(config.scale);
      
      // カードを少し傾ける
      card.rotation.y = -config.angle * 0.3;
      card.rotation.x = Math.sin(index * 0.5) * 0.1;
      
      // アニメーション用データ
      card.userData = {
        originalY: card.position.y,
        originalRotX: card.rotation.x,
        originalRotZ: card.rotation.z,
        phase: index * 0.7,
        floatSpeed: 0.8 + Math.random() * 0.4,
        wobbleSpeed: 1.2 + Math.random() * 0.6,
      };
      
      cards.push(card);
      scene.add(card);
    });
    
    // アニメーションループ
    let time = 0;
    const targetFrame = 60; // キャプチャするフレーム
    let frameCount = 0;
    
    function animate() {
      time += 0.03;
      frameCount++;
      
      // カードアニメーション
      cards.forEach((card, index) => {
        const userData = card.userData;
        
        // 浮遊アニメーション
        card.position.y = userData.originalY + Math.sin(time * userData.floatSpeed + userData.phase) * 0.15;
        
        // 揺れアニメーション
        card.rotation.x = userData.originalRotX + Math.sin(time * userData.wobbleSpeed + userData.phase) * 0.05;
        card.rotation.z = Math.sin(time * userData.wobbleSpeed * 0.8 + userData.phase) * 0.03;
      });
      
      // パーティクルアニメーション
      const positions = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += 0.02;
        if (positions[i * 3 + 1] > 6) {
          positions[i * 3 + 1] = -6;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.y = time * 0.1;
      
      renderer.render(scene, camera);
      
      // キャプチャフレームに達したらフラグを立てる
      if (frameCount >= targetFrame) {
        window.captureReady = true;
      } else {
        requestAnimationFrame(animate);
      }
    }
    
    // テクスチャ読み込み完了を待つ
    setTimeout(() => {
      animate();
    }, 2000);
  </script>
</body>
</html>
`;

async function generateThumbnail() {
  console.log("🎰 Three.js 3Dカードサムネイル生成開始...");
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--use-gl=swiftshader'
    ]
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
  
  // HTMLを設定
  await page.setContent(html(), { waitUntil: 'networkidle0' });
  
  // アニメーションが完了するまで待機
  console.log("⏳ Three.jsアニメーション待機中...");
  await page.waitForFunction('window.captureReady === true', { timeout: 30000 });
  
  // 少し追加待機
  await new Promise(r => setTimeout(r, 500));
  
  // スクリーンショット
  await page.screenshot({
    path: OUTPUT_PATH,
    type: 'png',
    fullPage: false
  });
  
  await browser.close();
  
  const stats = fs.statSync(OUTPUT_PATH);
  console.log(`✅ 3Dサムネイル生成完了: ${OUTPUT_PATH}`);
  console.log(`   サイズ: ${Math.round(stats.size / 1024)}KB`);
}

generateThumbnail().catch(console.error);



