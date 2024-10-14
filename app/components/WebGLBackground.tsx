import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float time;
  uniform vec2 resolution;
  varying vec2 vUv;

  // Simplex 2D noise
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ) )
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float rand(vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;
    vec2 pos = gl_FragCoord.xy / resolution.xy;
    
    // Create multiple swirly shapes
    float noise1 = snoise(uv * 3.0 + time * 0.1 + vec2(sin(time * 0.2), cos(time * 0.3)));
    float noise2 = snoise(uv * 5.0 - time * 0.2 + vec2(cos(time * 0.3), sin(time * 0.4)));
    float noise3 = snoise(uv * 4.0 + time * 0.15 + vec2(sin(time * 0.1), cos(time * 0.2)));
    
    vec3 color1 = vec3(0.467, 0.745, 0.267); // Green
    vec3 color2 = vec3(0.937, 0.718, 0.106); // Orange
    vec3 color3 = vec3(0.2, 0.4, 0.8); // Blue
    
    // Combine swirly shapes
    vec3 swirl = mix(color1, color2, noise1 * 0.5 + 0.5);
    swirl = mix(swirl, color3, noise2 * 0.3 + 0.5);
    swirl = mix(swirl, vec3(1.0), noise3 * 0.2);
    
    // Add more grain
    float grain = rand(uv * time) * 0.15;
    swirl += vec3(grain);
    
    // Create circular mask for swirly shapes
    float radius = 0.3;
    vec2 center1 = vec2(0.3 + sin(time * 0.5) * 0.1, 0.7 + cos(time * 0.6) * 0.1);
    vec2 center2 = vec2(0.7 + cos(time * 0.4) * 0.1, 0.3 + sin(time * 0.7) * 0.1);
    float mask1 = smoothstep(radius, radius - 0.1, length(pos - center1));
    float mask2 = smoothstep(radius, radius - 0.1, length(pos - center2));
    float finalMask = max(mask1, mask2);
    
    // Combine black background with swirly shapes
    vec3 finalColor = mix(vec3(0.0), swirl, finalMask);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

interface WebGLBackgroundProps {
  isPaused: boolean;
}

const WebGLBackground: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const animate = (time: number) => {
      material.uniforms.time.value = time * 0.001;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate(0);

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <div ref={mountRef} className="webgl-background" />;
};

export default WebGLBackground;