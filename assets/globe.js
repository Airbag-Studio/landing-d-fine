// D-Fine VitaminDGlobeScene — Three.js port
// Warm golden globe with noise displacement, swirl colors, and inward-falling particles

(function () {
  'use strict';

  if (typeof THREE === 'undefined') return;

  // ─── Config ───────────────────────────────────────
  const isMobile = window.innerWidth < 768;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PARTICLE_COUNT = isMobile ? 80 : 200;
  const SPHERE_SEGMENTS = isMobile ? 32 : 64;

  // ─── GLSL Simplex 3D Noise ────────────────────────
  const glslNoise = `
    vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod289(i);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
  `;

  // ─── Globe Shaders ────────────────────────────────
  const globeVertexShader = `
    ${glslNoise}
    uniform float uTime;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      // Displacement via noise
      float n = snoise(position * 1.2 + uTime * 0.4);
      n = n * 0.5 + 0.5; // remap to [0,1]
      n = n * n;          // squared for smoother bumps
      float displacement = n * 0.15;

      vec3 newPos = position + normal * displacement;

      // Recompute normal via neighbors (finite difference)
      float eps = 0.01;
      vec3 tangent1 = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
      if (length(cross(normal, vec3(0.0, 1.0, 0.0))) < 0.001) {
        tangent1 = normalize(cross(normal, vec3(1.0, 0.0, 0.0)));
      }
      vec3 tangent2 = normalize(cross(normal, tangent1));

      vec3 neighbor1 = position + tangent1 * eps;
      float n1 = snoise(neighbor1 * 1.2 + uTime * 0.4);
      n1 = n1 * 0.5 + 0.5; n1 = n1 * n1;
      vec3 displaced1 = neighbor1 + normal * n1 * 0.15;

      vec3 neighbor2 = position + tangent2 * eps;
      float n2 = snoise(neighbor2 * 1.2 + uTime * 0.4);
      n2 = n2 * 0.5 + 0.5; n2 = n2 * n2;
      vec3 displaced2 = neighbor2 + normal * n2 * 0.15;

      vNormal = normalize(cross(displaced1 - newPos, displaced2 - newPos));
      vWorldPos = newPos;

      vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
      vViewDir = normalize(-mvPosition.xyz);

      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const globeFragmentShader = `
    ${glslNoise}
    uniform float uTime;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      // Swirl: two octaves of noise, cubed, averaged
      float s1 = snoise(vWorldPos * 1.5 + uTime * 0.3);
      float s2 = snoise(vWorldPos * 3.0 + uTime * 0.2);
      float swirl = (s1 * s1 * s1 + s2 * s2 * s2) * 0.5;
      swirl = swirl * 0.5 + 0.5; // remap to [0,1]

      // Color tiers
      vec3 pale = vec3(1.0, 0.949, 0.6);       // #FFF299
      vec3 mid  = vec3(1.0, 0.922, 0.502);      // #FFEB80
      vec3 deep = vec3(0.949, 0.851, 0.349);    // #F2D959

      vec3 color = mix(pale, deep, swirl);

      // Vein highlights at swirl peaks
      float veinMask = smoothstep(0.6, 0.85, swirl);
      color += mid * 0.3 * veinMask;

      // Diffuse lighting
      vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
      float diffuse = max(dot(vNormal, lightDir), 0.65);

      // Rim / Fresnel glow
      float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.0) * 1.3;
      vec3 rimTint = vec3(1.0, 0.75, 0.25);

      vec3 finalColor = color * diffuse + rimTint * fresnel;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  // ─── Particle Shaders ────────────────────────────
  const particleVertexShader = `
    attribute float aOpacity;
    attribute float aSize;
    varying float vOpacity;

    void main() {
      vOpacity = aOpacity;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const particleFragmentShader = `
    varying float vOpacity;

    void main() {
      float dist = distance(gl_PointCoord, vec2(0.5));
      if (dist > 0.5) discard;
      float alpha = smoothstep(0.5, 0.1, dist) * vOpacity;
      vec3 color = vec3(1.0, 0.847, 0.298); // #FFD84C
      gl_FragColor = vec4(color, alpha);
    }
  `;

  // ─── Setup ────────────────────────────────────────
  const canvas = document.getElementById('globe-canvas');
  if (!canvas) return;

  const container = document.getElementById('globe-container');
  // Use the hero section as the sizing source — avoids circular dependency
  // where the container height is driven by the canvas inside it
  const heroSection = container.closest('section');
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 5.0;

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    premultipliedAlpha: false
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // ─── Globe Mesh ───────────────────────────────────
  const globeGeometry = new THREE.SphereGeometry(1.6, SPHERE_SEGMENTS, SPHERE_SEGMENTS);
  const globeUniforms = { uTime: { value: 0.0 } };
  const globeMaterial = new THREE.ShaderMaterial({
    vertexShader: globeVertexShader,
    fragmentShader: globeFragmentShader,
    uniforms: globeUniforms
  });
  const globe = new THREE.Mesh(globeGeometry, globeMaterial);

  // ─── Particle System ─────────────────────────────
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const opacities = new Float32Array(PARTICLE_COUNT);
  const sizes = new Float32Array(PARTICLE_COUNT);

  // Per-particle state (JS side)
  const particleState = [];
  const SHELL_RADIUS = 7.0;

  function randomOnSphere(radius) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    return {
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.sin(phi) * Math.sin(theta),
      z: radius * Math.cos(phi)
    };
  }

  function initParticle(i) {
    const pos = randomOnSphere(SHELL_RADIUS);
    const baseSize = 0.48;
    const sizeVariation = baseSize * (0.7 + Math.random() * 0.6); // ±30%
    if (i === 0) console.log('[globe] particle baseSize:', baseSize, 'sizeVariation sample:', sizeVariation.toFixed(3));

    positions[i * 3] = pos.x;
    positions[i * 3 + 1] = pos.y;
    positions[i * 3 + 2] = pos.z;
    opacities[i] = 0.0;
    sizes[i] = sizeVariation;

    const lifetime = 3.0 + Math.random() * 4.0; // 3-7 seconds
    particleState[i] = {
      vx: 0, vy: 0, vz: 0,
      age: Math.random() * lifetime, // stagger initial ages
      lifetime: lifetime,
      baseSize: sizeVariation
    };
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    initParticle(i);
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));
  particleGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  const particleMaterial = new THREE.ShaderMaterial({
    vertexShader: particleVertexShader,
    fragmentShader: particleFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);

  // ─── Globe Group (scale + position together) ──────
  // scale: 0.5 halves the globe and particle shell
  // position: shifts center toward iPhone mockup top-left corner
  //   x ≈ +2.0 → 73% from canvas left (right column, iPhone left edge)
  //   y ≈ +0.6 → 38% from canvas top (near iPhone top edge)
  const globeGroup = new THREE.Group();
  globeGroup.scale.set(0.4, 0.4, 0.4);
  globeGroup.position.set(0.7, 1.3, 0);
  globeGroup.add(globe);
  globeGroup.add(particles);
  scene.add(globeGroup);

  // ─── Sizing ───────────────────────────────────────
  function resize() {
    const rect = heroSection.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    renderer.setSize(w, h, false); // false = don't set inline CSS — let the section clip handle sizing
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
  });
  resize();

  // ─── Animation ────────────────────────────────────
  let isVisible = true;
  const visibilityObserver = new IntersectionObserver(function (entries) {
    isVisible = entries[0].isIntersecting;
  }, { threshold: 0.0 });
  visibilityObserver.observe(container);

  let lastTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);

    if (!isVisible || document.hidden) return;

    const delta = Math.min((now - lastTime) / 1000, 0.1); // cap at 100ms
    lastTime = now;

    // Update globe time (0.5× realtime)
    globeUniforms.uTime.value += delta * 0.5;

    // Auto-rotation
    if (!reducedMotion) {
      globe.rotation.y += 0.001;
    }

    // Update particles
    if (!reducedMotion) {
      const posAttr = particleGeometry.getAttribute('position');
      const opAttr = particleGeometry.getAttribute('aOpacity');

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const s = particleState[i];
        s.age += delta;

        if (s.age >= s.lifetime) {
          // Respawn
          const pos = randomOnSphere(SHELL_RADIUS);
          posAttr.array[i * 3] = pos.x;
          posAttr.array[i * 3 + 1] = pos.y;
          posAttr.array[i * 3 + 2] = pos.z;
          s.vx = 0; s.vy = 0; s.vz = 0;
          s.age = 0;
          s.lifetime = 3.0 + Math.random() * 4.0;
          opAttr.array[i] = 0.0;
          continue;
        }

        // Direction toward center
        const px = posAttr.array[i * 3];
        const py = posAttr.array[i * 3 + 1];
        const pz = posAttr.array[i * 3 + 2];
        const dist = Math.sqrt(px * px + py * py + pz * pz);

        if (dist > 0.01) {
          const dx = -px / dist;
          const dy = -py / dist;
          const dz = -pz / dist;

          // Gravity-accelerated
          const accel = 0.002;
          s.vx += dx * accel;
          s.vy += dy * accel;
          s.vz += dz * accel;
        }

        posAttr.array[i * 3] += s.vx;
        posAttr.array[i * 3 + 1] += s.vy;
        posAttr.array[i * 3 + 2] += s.vz;

        // Opacity keyframe: 0→0.3→0.6→0.9→0
        const t = s.age / s.lifetime;
        const BASE_OPACITY = 0.5;
        let opacity;
        if (t < 0.25) opacity = (t / 0.25) * 0.3;
        else if (t < 0.5) opacity = 0.3 + ((t - 0.25) / 0.25) * 0.3;
        else if (t < 0.75) opacity = 0.6 + ((t - 0.5) / 0.25) * 0.3;
        else opacity = 0.9 * (1.0 - (t - 0.75) / 0.25);
        opacity *= BASE_OPACITY;
        opAttr.array[i] = opacity;
      }

      posAttr.needsUpdate = true;
      opAttr.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  // If reduced motion, render one static frame
  if (reducedMotion) {
    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
})();
