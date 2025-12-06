"use client";

import { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";

interface CosmicBackgroundProps {
  accentColor?: string;
  intensity?: number;
  lowPerformance?: boolean; // モバイル用軽量モード
}

export default function CosmicBackground({ 
  accentColor = "#9370db",
  intensity = 1,
  lowPerformance = false
}: CosmicBackgroundProps) {
  // モバイル検出
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationRef = useRef<number>(0);

  // HEXをRGBに変換
  const accentRGB = useMemo(() => {
    const hex = accentColor.replace("#", "");
    return {
      r: parseInt(hex.substring(0, 2), 16) / 255,
      g: parseInt(hex.substring(2, 4), 16) / 255,
      b: parseInt(hex.substring(4, 6), 16) / 255,
    };
  }, [accentColor]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0015, 0.0008);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 3000);
    camera.position.z = 1000;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // パフォーマンスモードに応じてパーティクル数を調整
    const performanceMode = lowPerformance || isMobile;
    
    // ===== 1. 星雲パーティクル（軽量化） =====
    const nebulaParticleCount = performanceMode ? 500 : 1500;
    const nebulaGeometry = new THREE.BufferGeometry();
    const nebulaPositions = new Float32Array(nebulaParticleCount * 3);
    const nebulaSizes = new Float32Array(nebulaParticleCount);
    const nebulaColors = new Float32Array(nebulaParticleCount * 3);

    for (let i = 0; i < nebulaParticleCount; i++) {
      const i3 = i * 3;
      // 球状に分布
      const radius = 400 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      nebulaPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      nebulaPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      nebulaPositions[i3 + 2] = radius * Math.cos(phi);

      nebulaSizes[i] = Math.random() * 3 + 1;

      // 紫〜ピンク〜青のグラデーション
      const colorChoice = Math.random();
      if (colorChoice < 0.3) {
        // 紫
        nebulaColors[i3] = 0.6;
        nebulaColors[i3 + 1] = 0.3;
        nebulaColors[i3 + 2] = 0.9;
      } else if (colorChoice < 0.6) {
        // ピンク
        nebulaColors[i3] = 1.0;
        nebulaColors[i3 + 1] = 0.4;
        nebulaColors[i3 + 2] = 0.6;
      } else if (colorChoice < 0.8) {
        // アクセントカラー
        nebulaColors[i3] = accentRGB.r;
        nebulaColors[i3 + 1] = accentRGB.g;
        nebulaColors[i3 + 2] = accentRGB.b;
      } else {
        // 金色
        nebulaColors[i3] = 1.0;
        nebulaColors[i3 + 1] = 0.85;
        nebulaColors[i3 + 2] = 0.3;
      }
    }

    nebulaGeometry.setAttribute("position", new THREE.BufferAttribute(nebulaPositions, 3));
    nebulaGeometry.setAttribute("size", new THREE.BufferAttribute(nebulaSizes, 1));
    nebulaGeometry.setAttribute("color", new THREE.BufferAttribute(nebulaColors, 3));

    const nebulaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: intensity },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        
        void main() {
          vColor = color;
          
          vec3 pos = position;
          pos.x += sin(uTime * 0.2 + position.y * 0.01) * 20.0;
          pos.y += cos(uTime * 0.15 + position.x * 0.01) * 20.0;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (400.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          
          vAlpha = 0.6 + 0.4 * sin(uTime + position.x * 0.01);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uIntensity;
        
        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = smoothstep(0.5, 0.0, dist) * vAlpha * uIntensity;
          vec3 glow = vColor * 1.5;
          gl_FragColor = vec4(glow, alpha * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
    scene.add(nebula);

    // ===== 2. 輝く星（軽量化） =====
    const starCount = performanceMode ? 300 : 800;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      starPositions[i3] = (Math.random() - 0.5) * 3000;
      starPositions[i3 + 1] = (Math.random() - 0.5) * 3000;
      starPositions[i3 + 2] = (Math.random() - 0.5) * 3000;
      starSizes[i] = Math.random() * 2 + 0.5;
    }

    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute("size", new THREE.BufferAttribute(starSizes, 1));

    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        varying float vTwinkle;
        uniform float uTime;
        
        void main() {
          vTwinkle = 0.5 + 0.5 * sin(uTime * 3.0 + position.x * 0.1 + position.y * 0.1);
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z) * vTwinkle;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vTwinkle;
        
        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = smoothstep(0.5, 0.0, dist);
          vec3 color = vec3(1.0, 1.0, 1.0) * vTwinkle;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // ===== 3. 神聖幾何学（フラワーオブライフ風） - 強化版 =====
    const sacredGeometryGroup = new THREE.Group();
    
    // メタトロンキューブ風の線（グロウ付き）
    const createSacredShape = (scale: number, color: THREE.Color, opacity: number, lineWidth: number = 1) => {
      const group = new THREE.Group();
      
      // 六角形の頂点
      const hexPoints: THREE.Vector3[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        hexPoints.push(new THREE.Vector3(
          Math.cos(angle) * scale,
          Math.sin(angle) * scale,
          0
        ));
      }
      
      // 発光するシェーダーマテリアル
      const glowLineMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: color },
          uOpacity: { value: opacity },
          uTime: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uOpacity;
          uniform float uTime;
          varying vec2 vUv;
          
          void main() {
            float pulse = 0.7 + 0.3 * sin(uTime * 2.0);
            vec3 glowColor = uColor * 1.5;
            gl_FragColor = vec4(glowColor, uOpacity * pulse);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      
      const lineMaterial = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: opacity,
        blending: THREE.AdditiveBlending,
        linewidth: lineWidth,
      });
      
      // 外周の六角形
      const hexGeometry = new THREE.BufferGeometry().setFromPoints([
        ...hexPoints,
        hexPoints[0],
      ]);
      const hexLine = new THREE.Line(hexGeometry, lineMaterial);
      group.add(hexLine);
      
      // 中心から各頂点
      hexPoints.forEach((point) => {
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          point,
        ]);
        const line = new THREE.Line(lineGeometry, lineMaterial);
        group.add(line);
      });
      
      // 内側の三角形
      const tri1 = [hexPoints[0], hexPoints[2], hexPoints[4], hexPoints[0]];
      const tri2 = [hexPoints[1], hexPoints[3], hexPoints[5], hexPoints[1]];
      
      const tri1Geometry = new THREE.BufferGeometry().setFromPoints(tri1);
      const tri2Geometry = new THREE.BufferGeometry().setFromPoints(tri2);
      
      group.add(new THREE.Line(tri1Geometry, lineMaterial));
      group.add(new THREE.Line(tri2Geometry, lineMaterial));
      
      // 円（複数）
      [0.5, 0.75, 1.0, 1.15].forEach((radiusMult) => {
        const circleGeometry = new THREE.BufferGeometry();
        const circlePoints: THREE.Vector3[] = [];
        for (let i = 0; i <= 64; i++) {
          const angle = (i / 64) * Math.PI * 2;
          circlePoints.push(new THREE.Vector3(
            Math.cos(angle) * scale * radiusMult,
            Math.sin(angle) * scale * radiusMult,
            0
          ));
        }
        circleGeometry.setFromPoints(circlePoints);
        group.add(new THREE.Line(circleGeometry, lineMaterial));
      });
      
      // フラワーオブライフの内側の円
      hexPoints.forEach((point) => {
        const innerCircle = new THREE.BufferGeometry();
        const innerPoints: THREE.Vector3[] = [];
        for (let i = 0; i <= 32; i++) {
          const angle = (i / 32) * Math.PI * 2;
          innerPoints.push(new THREE.Vector3(
            point.x + Math.cos(angle) * scale * 0.5,
            point.y + Math.sin(angle) * scale * 0.5,
            0
          ));
        }
        innerCircle.setFromPoints(innerPoints);
        const innerLine = new THREE.Line(innerCircle, lineMaterial.clone());
        (innerLine.material as THREE.LineBasicMaterial).opacity = opacity * 0.5;
        group.add(innerLine);
      });

      group.userData = { glowMaterial: glowLineMaterial };
      
      return group;
    };
    
    // 複数レイヤーの神聖幾何学（より鮮明に）
    const sacred1 = createSacredShape(180, new THREE.Color(0x9370db), 0.5, 2);
    const sacred2 = createSacredShape(250, new THREE.Color(0xff6b9d), 0.35, 2);
    const sacred3 = createSacredShape(320, new THREE.Color(0xffd700), 0.25, 2);
    const sacred4 = createSacredShape(400, new THREE.Color(0x00ffaa), 0.15, 1);
    
    sacredGeometryGroup.add(sacred1);
    sacredGeometryGroup.add(sacred2);
    sacredGeometryGroup.add(sacred3);
    sacredGeometryGroup.add(sacred4);
    sacredGeometryGroup.position.z = 100; // 前面に配置
    scene.add(sacredGeometryGroup);

    // ===== 4. オーロラ風エフェクト（軽量化） =====
    const auroraGeometry = new THREE.PlaneGeometry(2000, 800, 64, 16); // 128x32 -> 64x16に削減
    const auroraMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(0x9370db) },
        uColor2: { value: new THREE.Color(0x00ffaa) },
        uColor3: { value: new THREE.Color(0xff6b9d) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vElevation;
        uniform float uTime;
        
        void main() {
          vUv = uv;
          
          vec3 pos = position;
          float wave1 = sin(pos.x * 0.005 + uTime * 0.5) * 50.0;
          float wave2 = sin(pos.x * 0.01 + uTime * 0.3) * 30.0;
          float wave3 = cos(pos.x * 0.008 + uTime * 0.4) * 40.0;
          
          pos.z += wave1 + wave2 + wave3;
          pos.y += sin(pos.x * 0.003 + uTime * 0.2) * 20.0;
          
          vElevation = (wave1 + wave2 + wave3) / 120.0;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying float vElevation;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        uniform float uTime;
        
        void main() {
          float mixFactor = sin(vUv.x * 3.14159 + uTime * 0.2) * 0.5 + 0.5;
          vec3 color = mix(uColor1, uColor2, mixFactor);
          color = mix(color, uColor3, sin(vUv.y * 6.28 + uTime * 0.3) * 0.3 + 0.3);
          
          float alpha = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
          alpha *= 0.15 + 0.1 * vElevation;
          alpha *= smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
          
          gl_FragColor = vec4(color * 1.5, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const aurora = new THREE.Mesh(auroraGeometry, auroraMaterial);
    aurora.position.y = 400;
    aurora.position.z = -500;
    aurora.rotation.x = -0.3;
    scene.add(aurora);

    // ===== 5. 浮遊するオーブ（軽量化） =====
    const orbGroup = new THREE.Group();
    const orbCount = performanceMode ? 4 : 8;

    for (let i = 0; i < orbCount; i++) {
      const orbGeometry = new THREE.SphereGeometry(15 + Math.random() * 25, 32, 32);
      const orbMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(
            Math.random() < 0.5 ? 0x9370db : (Math.random() < 0.5 ? 0xff6b9d : 0xffd700)
          )},
          uIndex: { value: i },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          uniform vec3 uColor;
          uniform float uTime;
          uniform float uIndex;
          
          void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
            float pulse = 0.8 + 0.2 * sin(uTime * 2.0 + uIndex);
            
            vec3 color = uColor * (1.0 + fresnel * 0.5);
            float alpha = fresnel * 0.6 * pulse;
            
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const orb = new THREE.Mesh(orbGeometry, orbMaterial);
      orb.position.set(
        (Math.random() - 0.5) * 1200,
        (Math.random() - 0.5) * 800,
        (Math.random() - 0.5) * 600 - 300
      );
      orb.userData = {
        initialY: orb.position.y,
        speed: 0.5 + Math.random() * 1,
        amplitude: 30 + Math.random() * 50,
        phase: Math.random() * Math.PI * 2,
      };
      orbGroup.add(orb);
    }
    scene.add(orbGroup);

    // ===== 6. 光線エフェクト（軽量化） =====
    const rayCount = 6; // 12 -> 6に削減
    const rayGroup = new THREE.Group();

    for (let i = 0; i < rayCount; i++) {
      const rayGeometry = new THREE.PlaneGeometry(30, 1500);
      const rayMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uIndex: { value: i },
          uColor: { value: new THREE.Color(
            i % 3 === 0 ? 0xffd700 : (i % 3 === 1 ? 0xff6b9d : 0x9370db)
          )},
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float uTime;
          uniform float uIndex;
          uniform vec3 uColor;
          
          void main() {
            float alpha = smoothstep(0.0, 0.4, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
            float pulse = 0.2 + 0.8 * sin(uTime * 0.4 + uIndex * 0.8);
            alpha *= pulse * 0.25;
            
            float center = smoothstep(0.2, 0.5, vUv.x) * smoothstep(0.8, 0.5, vUv.x);
            alpha *= center;
            
            // グラデーションカラー
            vec3 color = mix(uColor, vec3(1.0, 1.0, 1.0), vUv.y * 0.5);
            gl_FragColor = vec4(color * 1.5, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const ray = new THREE.Mesh(rayGeometry, rayMaterial);
      const angle = (i / rayCount) * Math.PI * 2;
      ray.position.z = -400;
      ray.rotation.z = angle + Math.PI / 2;
      ray.rotation.x = -0.15;
      rayGroup.add(ray);
    }
    scene.add(rayGroup);

    // ===== 7. 流れる光の粒子（軽量化） =====
    const flowParticleCount = performanceMode ? 30 : 80;
    const flowGeometry = new THREE.BufferGeometry();
    const flowPositions = new Float32Array(flowParticleCount * 3);
    const flowVelocities = new Float32Array(flowParticleCount);
    const flowSizes = new Float32Array(flowParticleCount);

    for (let i = 0; i < flowParticleCount; i++) {
      const i3 = i * 3;
      flowPositions[i3] = (Math.random() - 0.5) * 2000;
      flowPositions[i3 + 1] = (Math.random() - 0.5) * 2000;
      flowPositions[i3 + 2] = (Math.random() - 0.5) * 1000;
      flowVelocities[i] = 1 + Math.random() * 3;
      flowSizes[i] = Math.random() * 4 + 2;
    }

    flowGeometry.setAttribute("position", new THREE.BufferAttribute(flowPositions, 3));
    flowGeometry.setAttribute("size", new THREE.BufferAttribute(flowSizes, 1));

    const flowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        varying float vAlpha;
        uniform float uTime;
        
        void main() {
          vec3 pos = position;
          pos.y = mod(pos.y + uTime * 50.0, 2000.0) - 1000.0;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          
          vAlpha = 0.3 + 0.3 * sin(uTime * 3.0 + position.x * 0.01);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        
        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
          vec3 color = vec3(1.0, 0.9, 0.6);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const flowParticles = new THREE.Points(flowGeometry, flowMaterial);
    scene.add(flowParticles);

    // Animation
    let time = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      time += delta;

      // Update uniforms
      nebulaMaterial.uniforms.uTime.value = time;
      starMaterial.uniforms.uTime.value = time;
      auroraMaterial.uniforms.uTime.value = time;

      // Rotate nebula slowly
      nebula.rotation.y = time * 0.02;
      nebula.rotation.x = Math.sin(time * 0.1) * 0.1;

      // Rotate stars
      stars.rotation.y = time * 0.01;

      // Rotate sacred geometry
      sacredGeometryGroup.rotation.z = time * 0.05;
      sacredGeometryGroup.children.forEach((child, index) => {
        child.rotation.z = time * 0.02 * (index % 2 === 0 ? 1 : -1);
      });

      // Animate orbs
      orbGroup.children.forEach((orb) => {
        const mesh = orb as THREE.Mesh;
        const userData = mesh.userData;
        mesh.position.y = userData.initialY + Math.sin(time * userData.speed + userData.phase) * userData.amplitude;
        mesh.rotation.y = time * 0.5;
        
        const material = mesh.material as THREE.ShaderMaterial;
        if (material.uniforms) {
          material.uniforms.uTime.value = time;
        }
      });

      // Animate rays
      rayGroup.rotation.z = time * 0.02;
      rayGroup.children.forEach((ray) => {
        const material = (ray as THREE.Mesh).material as THREE.ShaderMaterial;
        if (material.uniforms) {
          material.uniforms.uTime.value = time;
        }
      });

      // Animate flow particles
      flowMaterial.uniforms.uTime.value = time;

      // Camera subtle movement
      camera.position.x = Math.sin(time * 0.1) * 30;
      camera.position.y = Math.cos(time * 0.08) * 20;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationRef.current);
      
      if (rendererRef.current && container) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }

      // Dispose geometries and materials
      nebulaGeometry.dispose();
      nebulaMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      auroraGeometry.dispose();
      auroraMaterial.dispose();
    };
  }, [accentRGB, intensity]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10"
      style={{
        background: "linear-gradient(180deg, #0a0015 0%, #1a0a2e 50%, #0d0d1f 100%)",
      }}
    />
  );
}

