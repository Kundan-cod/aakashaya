// Feature-detect WebGL and try to load Three.js
let three = null;
let moduleFailed = false;

async function loadThree() {
  if (three) return three;
  if (moduleFailed) return null;
  try {
    // Race the CDN import against a 5-second timeout so boot never hangs
    const result = await Promise.race([
      import(/* @vite-ignore */ 'https://esm.sh/three@0.160.0'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Three.js CDN timeout (5s)')), 5000)),
    ]);
    three = result;
    return three;
  } catch (err) {
    console.warn('[AAKASHAYA] Failed to load Three.js from CDN', err);
    moduleFailed = true;
    return null;
  }
}

export async function initThreeScene() {
  const T = await loadThree();
  const canvas = document.getElementById('earth-canvas');
  if (!canvas) return null;

  if (!T || !hasWebGL()) {
    // CSS fallback already in CSS (canvas-veil gradient)
    canvas.style.display = 'none';
    return null;
  }

  try {
    const { scene, camera, renderer, earth, satellites, stars, radar, beams } = createScene(T, canvas);
    startRenderLoop(T, { scene, camera, renderer, earth, satellites, stars, radar, beams, canvas });
    return { T, scene, camera, renderer, earth, satellites, stars, radar, beams };
  } catch (err) {
    console.warn('[AAKASHAYA] scene creation failed', err);
    canvas.style.display = 'none';
    return null;
  }
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

function createScene(T, canvas) {
  const scene = new T.Scene();

  const camera = new T.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 0, 9);

  const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);

  // Lighting
  const ambient = new T.AmbientLight(0x556688, 0.6);
  scene.add(ambient);
  const sun = new T.DirectionalLight(0xffffff, 1.4);
  sun.position.set(8, 4, 6);
  scene.add(sun);
  const cyan = new T.PointLight(0x00f0ff, 1.6, 50);
  cyan.position.set(-10, 3, 6);
  scene.add(cyan);
  const magenta = new T.PointLight(0xff00ea, 0.7, 50);
  magenta.position.set(8, -3, -6);
  scene.add(magenta);

  const earth = createEarth(T, scene);
  const satellites = createSatellites(T, scene);
  const stars = createStarfield(T, scene, 1800);
  const radar = createRadar(T, scene);
  const beams = createSignalBeams(T, scene, satellites, earth);

  return { scene, camera, renderer, earth, satellites, stars, radar, beams };
}

function startRenderLoop(T, ctx) {
  const { scene, camera, renderer, earth, satellites, stars, radar, beams, canvas } = ctx;
  let last = performance.now();
  let running = true;

  function onResize() {
    const w = window.innerWidth; const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', onResize);

  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  function frame(now) {
    if (!running) { requestAnimationFrame(frame); return; }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;

    earth.update(dt, t);
    satellites.update(dt, t);
    stars.update(dt, t);
    radar.update(dt, t);
    beams.update(dt, t);

    // Mouse-driven subtle camera parallax
    const mx = (window.__aakMouseX || 0) * 0.3;
    const my = (window.__aakMouseY || 0) * 0.2;
    camera.position.x += (mx - camera.position.x) * 0.05;
    camera.position.y += (-my - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Track mouse for parallax
  window.addEventListener('mousemove', (e) => {
    window.__aakMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    window.__aakMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });
}

function createEarth(T, scene) {
  const group = new T.Group();
  const radius = 2.0;
  const geo = new T.SphereGeometry(radius, 64, 48);

  // Procedural Earth using shader with continent-like noise
  const earthMat = new T.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uLightDir: { value: new T.Vector3(0.7, 0.4, 0.6).normalize() },
      uOceanColor: { value: new T.Color('#062447') },
      uLandColor: { value: new T.Color('#0e6e7e') },
      uIceColor: { value: new T.Color('#bfdfff') },
      uAtmoColor: { value: new T.Color('#3ad6ff') },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPos;
      varying vec2 vUv;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPos = position;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uLightDir;
      uniform vec3 uOceanColor;
      uniform vec3 uLandColor;
      uniform vec3 uIceColor;
      uniform vec3 uAtmoColor;
      varying vec3 vNormal;
      varying vec3 vPos;
      varying vec2 vUv;

      // hash + noise + fbm
      float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float noise(vec3 p) {
        vec3 i = floor(p), f = fract(p);
        f = f*f*(3.0-2.0*f);
        float n = mix(mix(mix(hash(i+vec3(0,0,0)), hash(i+vec3(1,0,0)), f.x),
                         mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
                     mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
                         mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
        return n;
      }
      float fbm(vec3 p) {
        float v = 0.0; float a = 0.5;
        for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.05; a *= 0.5; }
        return v;
      }

      void main() {
        vec3 p = normalize(vPos) * 1.6;
        float n = fbm(p * 1.4);
        float continent = smoothstep(0.50, 0.62, n);
        float detail = fbm(p * 4.0);
        float lat = abs(vUv.y - 0.5) * 2.0;
        float ice = smoothstep(0.78, 0.92, lat);

        vec3 col = mix(uOceanColor, uLandColor, continent);
        col = mix(col, uLandColor * 1.2, detail * 0.15 * continent);
        col = mix(col, uIceColor, ice);

        // lambert lighting
        float diffuse = max(dot(vNormal, uLightDir), 0.0);
        float nightSide = 1.0 - smoothstep(-0.05, 0.4, dot(vNormal, uLightDir));
        // City lights at night: pulse on land
        float lights = continent * detail * nightSide * (0.7 + 0.3 * sin(uTime * 4.0 + n * 8.0));
        col += vec3(1.0, 0.85, 0.4) * lights * 0.45;

        col *= (0.25 + 0.85 * diffuse);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const earthMesh = new T.Mesh(geo, earthMat);
  group.add(earthMesh);

  // Atmosphere glow shell
  const atmoGeo = new T.SphereGeometry(radius * 1.06, 64, 48);
  const atmoMat = new T.ShaderMaterial({
    transparent: true,
    side: T.BackSide,
    blending: T.AdditiveBlending,
    uniforms: { uColor: { value: new T.Color('#3ad6ff') } },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.62 - dot(vNormal, vec3(0, 0, 1.0)), 2.6);
        gl_FragColor = vec4(uColor, 1.0) * intensity;
      }
    `,
  });
  const atmo = new T.Mesh(atmoGeo, atmoMat);
  group.add(atmo);

  // Cloud layer
  const cloudGeo = new T.SphereGeometry(radius * 1.02, 64, 48);
  const cloudMat = new T.ShaderMaterial({
    transparent: true,
    blending: T.NormalBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vPos;
      float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float noise(vec3 p) {
        vec3 i = floor(p), f = fract(p);
        f = f*f*(3.0-2.0*f);
        return mix(mix(mix(hash(i+vec3(0,0,0)), hash(i+vec3(1,0,0)), f.x),
                       mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
                       mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
      }
      float fbm(vec3 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { v += a*noise(p); p*=2.05; a*=0.5;} return v; }
      void main() {
        vec3 p = normalize(vPos + vec3(uTime*0.05, 0.0, 0.0));
        float c = fbm(p * 2.6);
        c = smoothstep(0.45, 0.75, c);
        gl_FragColor = vec4(vec3(0.85, 0.92, 1.0), c * 0.55);
      }
    `,
  });
  const clouds = new T.Mesh(cloudGeo, cloudMat);
  group.add(clouds);

  group.rotation.z = 0.27; // axial tilt
  scene.add(group);

  return {
    mesh: group,
    update(dt, t) {
      group.rotation.y += dt * 0.06;
      earthMat.uniforms.uTime.value = t;
      cloudMat.uniforms.uTime.value = t;
      clouds.rotation.y += dt * 0.012;
    },
  };
}

function createSatellites(T, scene) {
  const satellites = [];
  const colors = [0x00f0ff, 0xff00ea, 0xffb800, 0x00ff88];
  const cfgs = [
    { radius: 3.2, inclination: 0.4,  speed: 0.45, phase: 0.0,  color: colors[0] },
    { radius: 3.8, inclination: -0.3, speed: 0.32, phase: 1.5,  color: colors[1] },
    { radius: 4.5, inclination: 0.6,  speed: 0.22, phase: 3.0,  color: colors[2] },
    { radius: 5.2, inclination: -0.5, speed: 0.16, phase: 4.7,  color: colors[3] },
  ];

  cfgs.forEach((cfg, idx) => {
    const group = new T.Group();
    const body = new T.Mesh(
      new T.BoxGeometry(0.08, 0.08, 0.16),
      new T.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.7, roughness: 0.3, emissive: cfg.color, emissiveIntensity: 0.3 })
    );
    group.add(body);

    const panelMat = new T.MeshStandardMaterial({ color: 0x1a2a4a, metalness: 0.5, emissive: cfg.color, emissiveIntensity: 0.15 });
    const panelL = new T.Mesh(new T.BoxGeometry(0.16, 0.02, 0.06), panelMat);
    panelL.position.x = -0.14;
    const panelR = panelL.clone(); panelR.position.x = 0.14;
    group.add(panelL); group.add(panelR);

    // Antenna
    const ant = new T.Mesh(new T.CylinderGeometry(0.005, 0.005, 0.12), new T.MeshBasicMaterial({ color: cfg.color }));
    ant.position.y = 0.08;
    group.add(ant);

    // Glow halo
    const halo = new T.Mesh(
      new T.SphereGeometry(0.12, 16, 16),
      new T.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.25, blending: T.AdditiveBlending })
    );
    group.add(halo);

    // Orbit ring (subtle)
    const orbitRing = new T.Mesh(
      new T.RingGeometry(cfg.radius - 0.01, cfg.radius + 0.01, 128),
      new T.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.15, side: T.DoubleSide })
    );
    orbitRing.rotation.x = Math.PI / 2 + cfg.inclination;
    scene.add(orbitRing);

    scene.add(group);
    satellites.push({
      mesh: group, halo, cfg,
      // trail
      trailPositions: new Float32Array(60 * 3),
      trailGeometry: null,
      trailLine: null,
      idx,
    });
  });

  // Build trails after we know satellites
  satellites.forEach((s) => {
    s.trailGeometry = new T.BufferGeometry();
    s.trailGeometry.setAttribute('position', new T.BufferAttribute(s.trailPositions, 3));
    const trailMat = new T.LineBasicMaterial({ color: s.cfg.color, transparent: true, opacity: 0.4 });
    s.trailLine = new T.Line(s.trailGeometry, trailMat);
    scene.add(s.trailLine);
  });

  return {
    list: satellites,
    update(dt, t) {
      satellites.forEach((s) => {
        const angle = s.cfg.phase + t * s.cfg.speed;
        const r = s.cfg.radius;
        s.mesh.position.x = Math.cos(angle) * r;
        s.mesh.position.z = Math.sin(angle) * r;
        s.mesh.position.y = Math.sin(angle) * s.cfg.inclination * r;
        s.mesh.lookAt(0, 0, 0);
        s.halo.material.opacity = 0.18 + 0.12 * Math.sin(t * 2 + s.idx);

        // shift trail
        const arr = s.trailPositions;
        for (let i = arr.length - 3; i >= 3; i -= 3) {
          arr[i] = arr[i - 3]; arr[i + 1] = arr[i - 2]; arr[i + 2] = arr[i - 1];
        }
        arr[0] = s.mesh.position.x; arr[1] = s.mesh.position.y; arr[2] = s.mesh.position.z;
        s.trailGeometry.attributes.position.needsUpdate = true;
      });
    },
  };
}

function createStarfield(T, scene, count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [
    [0.7, 0.85, 1.0],
    [1.0, 0.95, 0.85],
    [0.8, 0.7, 1.0],
    [0.5, 0.85, 1.0],
  ];
  for (let i = 0; i < count; i++) {
    // distribute on sphere shell
    const u = Math.random(); const v = Math.random();
    const theta = 2 * Math.PI * u; const phi = Math.acos(2 * v - 1);
    const r = 50 + Math.random() * 60;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    const c = palette[i % palette.length];
    const intensity = 0.4 + Math.random() * 0.6;
    colors[i * 3] = c[0] * intensity; colors[i * 3 + 1] = c[1] * intensity; colors[i * 3 + 2] = c[2] * intensity;
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(positions, 3));
  geo.setAttribute('color', new T.BufferAttribute(colors, 3));
  const mat = new T.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.85, sizeAttenuation: true });
  const points = new T.Points(geo, mat);
  scene.add(points);
  return {
    points,
    update(dt) {
      points.rotation.y += dt * 0.003;
      points.rotation.x += dt * 0.001;
    },
  };
}

function createRadar(T, scene) {
  const group = new T.Group();
  const ringGeo = new T.RingGeometry(2.6, 2.62, 64);
  const ringMat = new T.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.3, side: T.DoubleSide });
  const ring = new T.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  // Sweep
  const sweepGeo = new T.CircleGeometry(2.7, 64, 0, Math.PI / 6);
  const sweepMat = new T.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4, side: T.DoubleSide, blending: T.AdditiveBlending });
  const sweep = new T.Mesh(sweepGeo, sweepMat);
  sweep.rotation.x = -Math.PI / 2;
  group.add(sweep);

  scene.add(group);
  return {
    group,
    update(dt) {
      sweep.rotation.z += dt * 1.4;
      ring.material.opacity = 0.25 + 0.1 * Math.sin(performance.now() / 600);
    },
  };
}

function createSignalBeams(T, scene, satellites, earth) {
  const beams = [];
  satellites.list.forEach((s, idx) => {
    const positions = new Float32Array(2 * 3);
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(positions, 3));
    const mat = new T.LineBasicMaterial({ color: s.cfg.color, transparent: true, opacity: 0.5, blending: T.AdditiveBlending });
    const line = new T.Line(geo, mat);
    scene.add(line);

    // Ground spot
    const spotGeo = new T.CircleGeometry(0.18, 24);
    const spotMat = new T.MeshBasicMaterial({ color: s.cfg.color, transparent: true, opacity: 0.6, blending: T.AdditiveBlending, side: T.DoubleSide });
    const spot = new T.Mesh(spotGeo, spotMat);
    scene.add(spot);

    beams.push({ line, spot, sat: s, idx });
  });

  return {
    list: beams,
    update(dt, t) {
      beams.forEach((b) => {
        const sat = b.sat.mesh;
        const arr = b.line.geometry.attributes.position.array;
        arr[0] = sat.position.x; arr[1] = sat.position.y; arr[2] = sat.position.z;
        // Compute beam target on Earth surface
        const dir = sat.position.clone().normalize();
        const target = dir.multiplyScalar(2.05);
        arr[3] = target.x; arr[4] = target.y; arr[5] = target.z;
        b.line.geometry.attributes.position.needsUpdate = true;

        b.spot.position.copy(target);
        b.spot.lookAt(0, 0, 0);
        const intensity = 0.4 + 0.4 * Math.sin(t * 2 + b.idx);
        b.spot.material.opacity = intensity * 0.6;
        b.line.material.opacity = intensity * 0.7;
      });
    },
  };
}