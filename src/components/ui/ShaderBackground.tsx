"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  varying vec2 vUv;

  float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
  vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
  vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

  float noise(vec3 p){
      vec3 a = floor(p);
      vec3 d = p - a;
      d = d * d * (3.0 - 2.0 * d);
      vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
      vec4 k1 = perm(b.xyxy);
      vec4 k2 = perm(k1.xyxy + b.zzww);
      vec4 c = k2 + a.zzzz;
      vec4 k3 = perm(c);
      vec4 k4 = perm(c + 1.0);
      vec4 o1 = fract(k3 * (1.0 / 41.0));
      vec4 o2 = fract(k4 * (1.0 / 41.0));
      vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
      vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);
      return o4.y * d.y + o4.x * (1.0 - d.y);
  }

  void main() {
    vec2 uv = vUv;
    float n = noise(vec3(uv * 3.0, uTime * 0.1));
    float n2 = noise(vec3(uv * 2.0 + n, uTime * 0.15));
    float n3 = noise(vec3(uv * 4.0 - n2, uTime * 0.05));
    
    float f = (n + n2 + n3) / 3.0;
    
    // Dynamic blur: sharper at the bottom (vUv.y = 0.0), blurrier at the top (vUv.y = 1.0)
    float edge0 = mix(0.42, 0.15, vUv.y);
    float edge1 = mix(0.58, 0.85, vUv.y);
    f = smoothstep(edge0, edge1, f);

    // Dynamic brightness: brighter at the bottom, fades to dark at the top
    float brightness = mix(1.0, 0.0, vUv.y);
    f *= brightness;

    vec3 color = mix(uColor2, uColor1, f);
    gl_FragColor = vec4(color, 1.0);
  }
`;

function ShaderPlane({ position, color1, color2 }: { position: [number, number, number], color1: string, color2: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(color1) },
      uColor2: { value: new THREE.Color(color2) },
    }),
    [color1, color2]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[viewport.width * 1.5, viewport.height * 1.5, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export default function ShaderBackground() {
  return (
    <div className="absolute inset-0 w-full h-full opacity-100">
      <Canvas camera={{ position: [0, 0, 2] }} gl={{ antialias: false, alpha: true }}>
         <ShaderPlane position={[0, 0, 0]} color1="#ffffff" color2="#000000" />
      </Canvas>
    </div>
  );
}
