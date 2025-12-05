"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

interface SpiritualBackgroundProps {
  intensity?: "low" | "medium" | "high";
}

export default function SpiritualBackground({
  intensity = "medium",
}: SpiritualBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number>(0);

  // パフォーマンス設定
  const getSettings = useCallback(() => {
    const base = {
      low: { particles: 30, orbs: 2, pixelRatio: 1 },
      medium: { particles: 60, orbs: 4, pixelRatio: 1.5 },
      high: { particles: 100, orbs: 6, pixelRatio: 2 },
    };
    return base[intensity];
  }, [intensity]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const settings = getSettings();

    const initScene = async () => {
      try {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Scene
        const scene = new THREE.Scene();

        // Camera
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 30;

        // Renderer（軽量設定）
        const renderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: true,
          powerPreference: "low-power",
          failIfMajorPerformanceCaveat: false,
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.pixelRatio));
        rendererRef.current = renderer;
        container.appendChild(renderer.domElement);

        // テクスチャローダー
        const textureLoader = new THREE.TextureLoader();

        // 背景テクスチャを読み込み
        const loadTexture = (path: string): Promise<THREE.Texture> => {
          return new Promise((resolve, reject) => {
            textureLoader.load(
              path,
              (texture) => resolve(texture),
              undefined,
              (err) => reject(err)
            );
          });
        };

        // 背景画像を設定
        try {
          const bgTexture = await loadTexture("/textures/starfield-bg.png");
          bgTexture.colorSpace = THREE.SRGBColorSpace;
          scene.background = bgTexture;
        } catch {
          // フォールバック: グラデーション背景
          const gradientCanvas = document.createElement("canvas");
          gradientCanvas.width = 2;
          gradientCanvas.height = 256;
          const gradientCtx = gradientCanvas.getContext("2d")!;
          const gradient = gradientCtx.createLinearGradient(0, 0, 0, 256);
          gradient.addColorStop(0, "#1a0a2e");
          gradient.addColorStop(0.5, "#16213e");
          gradient.addColorStop(1, "#0f0f23");
          gradientCtx.fillStyle = gradient;
          gradientCtx.fillRect(0, 0, 2, 256);
          scene.background = new THREE.CanvasTexture(gradientCanvas);
        }

        // オーロラ波動オーバーレイ
        let auroraPlane: THREE.Mesh | null = null;
        try {
          const auroraTexture = await loadTexture("/textures/aurora-wave.png");
          auroraTexture.colorSpace = THREE.SRGBColorSpace;
          const auroraGeometry = new THREE.PlaneGeometry(80, 45);
          const auroraMaterial = new THREE.MeshBasicMaterial({
            map: auroraTexture,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          auroraPlane = new THREE.Mesh(auroraGeometry, auroraMaterial);
          auroraPlane.position.z = -10;
          scene.add(auroraPlane);
        } catch {
          console.log("Aurora texture not loaded");
        }

        // 神聖幾何学模様（中央に配置）
        let sacredGeometry: THREE.Mesh | null = null;
        try {
          const sacredTexture = await loadTexture("/textures/sacred-geometry.png");
          sacredTexture.colorSpace = THREE.SRGBColorSpace;
          const sacredGeo = new THREE.PlaneGeometry(20, 20);
          const sacredMaterial = new THREE.MeshBasicMaterial({
            map: sacredTexture,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          sacredGeometry = new THREE.Mesh(sacredGeo, sacredMaterial);
          sacredGeometry.position.z = -5;
          scene.add(sacredGeometry);
        } catch {
          console.log("Sacred geometry texture not loaded");
        }

        // スターダストパーティクル
        let stardustSprite: THREE.Sprite | null = null;
        try {
          const stardustTexture = await loadTexture("/textures/stardust-particles.png");
          stardustTexture.colorSpace = THREE.SRGBColorSpace;
          const stardustMaterial = new THREE.SpriteMaterial({
            map: stardustTexture,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
          });
          stardustSprite = new THREE.Sprite(stardustMaterial);
          stardustSprite.scale.set(40, 40, 1);
          stardustSprite.position.z = 5;
          scene.add(stardustSprite);
        } catch {
          console.log("Stardust texture not loaded");
        }

        // 光のオーブを追加
        const orbs: THREE.Mesh[] = [];
        let orbTexture: THREE.Texture | null = null;
        try {
          orbTexture = await loadTexture("/textures/light-orb.png");
          orbTexture.colorSpace = THREE.SRGBColorSpace;
        } catch {
          console.log("Orb texture not loaded");
        }

        for (let i = 0; i < settings.orbs; i++) {
          let orb: THREE.Mesh;
          
          if (orbTexture) {
            const orbGeometry = new THREE.PlaneGeometry(4, 4);
            const orbMaterial = new THREE.MeshBasicMaterial({
              map: orbTexture,
              transparent: true,
              opacity: 0.3 + Math.random() * 0.2,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            });
            orb = new THREE.Mesh(orbGeometry, orbMaterial);
          } else {
            // フォールバック: 球体
            const orbGeometry = new THREE.SphereGeometry(0.5, 8, 8);
            const hue = 0.8 + Math.random() * 0.2;
            const orbMaterial = new THREE.MeshBasicMaterial({
              color: new THREE.Color().setHSL(hue, 0.8, 0.6),
              transparent: true,
              opacity: 0.3,
            });
            orb = new THREE.Mesh(orbGeometry, orbMaterial);
          }

          orb.position.set(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 10 + 10
          );
          orb.userData = {
            speed: 0.0005 + Math.random() * 0.001,
            amplitude: 3 + Math.random() * 5,
            offset: Math.random() * Math.PI * 2,
            baseY: orb.position.y,
            baseX: orb.position.x,
          };
          orbs.push(orb);
          scene.add(orb);
        }

        // 追加のスターパーティクル（シェーダー）
        const starsGeometry = new THREE.BufferGeometry();
        const starPositions: number[] = [];
        const starColors: number[] = [];
        const starSizes: number[] = [];

        for (let i = 0; i < settings.particles; i++) {
          starPositions.push(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 50
          );

          const colorChoice = Math.random();
          if (colorChoice < 0.3) {
            starColors.push(0.8, 0.3, 0.5);
          } else if (colorChoice < 0.6) {
            starColors.push(0.6, 0.4, 0.8);
          } else if (colorChoice < 0.85) {
            starColors.push(0.9, 0.8, 0.5);
          } else {
            starColors.push(1, 1, 1);
          }

          starSizes.push(Math.random() * 2 + 0.5);
        }

        starsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
        starsGeometry.setAttribute("color", new THREE.Float32BufferAttribute(starColors, 3));
        starsGeometry.setAttribute("size", new THREE.Float32BufferAttribute(starSizes, 1));

        const starsMaterial = new THREE.ShaderMaterial({
          uniforms: { time: { value: 0 } },
          vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            varying float vAlpha;
            uniform float time;
            
            void main() {
              vColor = color;
              float twinkle = sin(time * 2.0 + position.x * 0.5 + position.y * 0.3) * 0.5 + 0.5;
              vAlpha = 0.4 + twinkle * 0.6;
              
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = size * (300.0 / -mvPosition.z) * (0.8 + twinkle * 0.4);
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            varying vec3 vColor;
            varying float vAlpha;
            
            void main() {
              float dist = length(gl_PointCoord - vec2(0.5));
              if (dist > 0.5) discard;
              float glow = 1.0 - dist * 2.0;
              glow = pow(glow, 1.5);
              gl_FragColor = vec4(vColor, glow * vAlpha);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        const stars = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(stars);

        setIsLoading(false);

        // アニメーション
        let time = 0;
        const animate = () => {
          time += 0.016;

          // 星の瞬き
          starsMaterial.uniforms.time.value = time;

          // 星のゆっくり回転
          stars.rotation.y += 0.0001;
          stars.rotation.x += 0.00005;

          // オーロラの揺らぎ
          if (auroraPlane) {
            auroraPlane.position.y = Math.sin(time * 0.2) * 2;
            (auroraPlane.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(time * 0.5) * 0.1;
          }

          // 神聖幾何学の回転
          if (sacredGeometry) {
            sacredGeometry.rotation.z += 0.001;
            (sacredGeometry.material as THREE.MeshBasicMaterial).opacity = 0.1 + Math.sin(time * 0.3) * 0.05;
          }

          // スターダストの揺らぎ
          if (stardustSprite) {
            stardustSprite.position.y = Math.sin(time * 0.3) * 3;
            stardustSprite.material.opacity = 0.5 + Math.sin(time * 0.4) * 0.1;
          }

          // オーブのふわふわ移動
          orbs.forEach((orb) => {
            const { speed, amplitude, offset, baseY, baseX } = orb.userData;
            orb.position.y = baseY + Math.sin(time * speed * 100 + offset) * amplitude;
            orb.position.x = baseX + Math.cos(time * speed * 50 + offset) * amplitude * 0.5;
          });

          renderer.render(scene, camera);
          animationIdRef.current = requestAnimationFrame(animate);
        };

        animate();

        // リサイズ対応
        const handleResize = () => {
          const newWidth = window.innerWidth;
          const newHeight = window.innerHeight;
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        };

        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("resize", handleResize);
          cancelAnimationFrame(animationIdRef.current);
          renderer.dispose();
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        };
      } catch (err) {
        console.error("Three.js 初期化エラー:", err);
        setError("背景の読み込みに失敗しました");
        setIsLoading(false);
      }
    };

    const cleanup = initScene();
    return () => {
      cleanup?.then((fn) => fn?.());
    };
  }, [getSettings]);

  // エラー時のフォールバック
  if (error) {
    return (
      <div
        className="fixed inset-0 -z-50"
        style={{
          background: `linear-gradient(180deg, #1a0a2e 0%, #16213e 50%, #0f0f23 100%)`,
        }}
      >
        <div className="stars-fallback" />
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 -z-50"
        style={{ pointerEvents: "none" }}
      />
      {isLoading && (
        <div
          className="fixed inset-0 -z-50"
          style={{
            background: `linear-gradient(180deg, #1a0a2e 0%, #16213e 50%, #0f0f23 100%)`,
          }}
        />
      )}
    </>
  );
}
