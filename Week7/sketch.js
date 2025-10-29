import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls, clock, raycaster, mouse;
let container, levelText, speakText, startMicBtn;
let tankMesh, waterMesh, surfaceMesh;
const rippleEvents = []; // { pos: THREE.Vector2(x,z), t0: number }
const MAX_RIPPLES = 8;
let analyser, audioCtx, micStream;
let speaking = false; let speakingAccum = 0; let lastSecTs = 0;
let rmsAccum = 0; let rmsSamples = 0;

// Water model: start with 10 liters = 10000 ml
const TOTAL_ML_START = 1000;
let remainingMl = TOTAL_ML_START;
const tankSize = { w: 30, d: 30, h: 60 }; // cm approximation

window.addEventListener('DOMContentLoaded', () => {
  container = document.getElementById('three-container');
  levelText = document.getElementById('levelText');
  speakText = document.getElementById('speakText');
  startMicBtn = document.getElementById('startMic');
  startMicBtn.addEventListener('click', enableMic);
  updateLevelText();
  initThree();
  animate();
});

function initThree() {
  scene = new THREE.Scene();
  const w = container.clientWidth, h = container.clientHeight;
  camera = new THREE.PerspectiveCamera(60, w/h, 0.1, 1000);
  camera.position.set(70, 50, 90);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(1, 2, 1); scene.add(dir);

  // Tank: transparent square tube
  const tankGeo = new THREE.BoxGeometry(tankSize.w+2, tankSize.h+2, tankSize.d+2);
  const tankMat = new THREE.MeshPhysicalMaterial({
    color: 0xaaaaaa, metalness: 0.0, roughness: 0.15,
    transmission: 0.6, transparent: true, opacity: 0.15, clearcoat: 0.5, clearcoatRoughness: 0.2
  });
  tankMesh = new THREE.Mesh(tankGeo, tankMat);
  tankMesh.position.y = (tankSize.h/2);
  scene.add(tankMesh);
  // Hide outer tank frame
  tankMesh.visible = false;

  // Water volume (box) - will scale Y to level
  const waterGeo = new THREE.BoxGeometry(tankSize.w, 1, tankSize.d);
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x2b8cff, metalness: 0.03, roughness: 0.18, transmission: 0.85,
    thickness: 2.2, transparent: true, opacity: 0.88, clearcoat: 0.4
  });
  waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = 0.5;
  scene.add(waterMesh);

  // Surface plane with simple splash shader
  const surfGeo = new THREE.PlaneGeometry(tankSize.w, tankSize.d, 96, 96);
  const surfMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAmp: { value: 0 },
      uColor: { value: new THREE.Color(0x2b8cff) },
      uRippleCount: { value: 0 },
      uRipplePos: { value: Array.from({length: MAX_RIPPLES}, () => new THREE.Vector2(9999,9999)) },
      uRippleT0: { value: new Array(MAX_RIPPLES).fill(-9999.0) }
    },
    vertexShader: `
      uniform float uTime; uniform float uAmp; uniform int uRippleCount; uniform vec2 uRipplePos[8]; uniform float uRippleT0[8];
      varying vec2 vUv;
      void main(){
        vUv = uv;
        vec3 p = position;
        float w = 0.0; // remove base checker pattern
        // ripple sum
        for (int i=0;i<8;i++){
          if (i>=uRippleCount) break;
          vec2 rp = uRipplePos[i];
          float t = uTime - uRippleT0[i];
          if (t>0.0){
            float d = distance(vec2(p.x, p.y), rp);
            float wave = sin(6.0*d - 4.0*t) * exp(-d*0.25) * exp(-t*1.1);
            w += wave;
          }
        }
        p.z += w * (0.35 + uAmp*2.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv; uniform vec3 uColor; uniform float uAmp;
      void main(){
        float k = smoothstep(0.0,1.0, 1.0 - distance(vUv, vec2(0.5)) * 0.9);
        float alpha = 0.12 + 0.18 * clamp(uAmp, 0.0, 1.0);
        gl_FragColor = vec4(uColor * (0.85 + 0.15*k), alpha);
      }
    `,
    transparent: true
  });
  surfaceMesh = new THREE.Mesh(surfGeo, surfMat);
  surfaceMesh.rotation.x = -Math.PI/2;
  surfaceMesh.position.y = waterMesh.position.y + 0.01;
  surfaceMesh.visible = true;
  scene.add(surfaceMesh);
  // Subtle blending to tint water
  surfaceMesh.material.blending = THREE.NormalBlending;
  surfaceMesh.material.depthWrite = false;
  surfaceMesh.material.uniforms.uColor.value.copy(waterMesh.material.color);

  clock = new THREE.Clock();
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  // Voice-driven ripples will be generated in the animation loop
  window.addEventListener('resize', onResize);
}

function onResize(){
  const w = container.clientWidth, h = container.clientHeight;
  camera.aspect = w/h; camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

async function enableMic(){
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const src = audioCtx.createMediaStreamSource(micStream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    src.connect(analyser);
    startMicBtn.disabled = true; startMicBtn.textContent = 'Mic Enabled';
  } catch (e) {
    console.error('Mic error', e);
    alert('Microphone permission required.');
  }
}

function getRMS(){
  if (!analyser) return 0;
  const buf = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(buf);
  // RMS of centered waveform
  let sum = 0; for (let i=0;i<buf.length;i++){ const v = (buf[i]-128)/128; sum += v*v; }
  return Math.sqrt(sum / buf.length);
}

function updateWaterLevel(dt){
  // Height mapping: 10000 ml -> full tank height (tankSize.h)
  const frac = Math.max(0, remainingMl) / TOTAL_ML_START;
  const height = frac * tankSize.h;
  waterMesh.scale.y = Math.max(0.001, height);
  waterMesh.position.y = height * 0.5;
  // Keep ripple plane exactly aligned with water top and flat
  surfaceMesh.position.y = height + 0.01; // place ripples exactly at water top
  surfaceMesh.rotation.set(-Math.PI/2, 0, 0);
}

function updateLevelText(){
  levelText.textContent = `Water: ${(remainingMl/1000).toFixed(3)} L`;
}

function animate(){
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  controls.update();

  // voice detection per second
  const rms = getRMS();
  const speakingNow = rms > 0.04; // threshold
  const now = performance.now();
  if (speakingNow) speakingAccum += dt; // seconds of speaking in this window
  rmsAccum += rms; rmsSamples++;
  // Voice-driven positional ripples (throttled)
  if (rms > 0.03 && now - lastRippleMs > 120) {
    lastRippleMs = now;
    // radius proportional to loudness
    const radius = (tankSize.w * 0.15) + rms * (tankSize.w * 0.35);
    const angle = Math.random() * Math.PI * 2.0;
    const px = Math.cos(angle) * radius;
    const pz = Math.sin(angle) * radius;
    const halfW = tankSize.w * 0.5; const halfD = tankSize.d * 0.5;
    const clampedX = Math.max(-halfW, Math.min(halfW, px));
    const clampedZ = Math.max(-halfD, Math.min(halfD, pz));
    rippleEvents.unshift({ pos: new THREE.Vector2(clampedX, clampedZ), t0: performance.now() * 0.001 });
    if (rippleEvents.length > MAX_RIPPLES) rippleEvents.pop();
  }
  if (lastSecTs === 0) lastSecTs = now;
  if (now - lastSecTs >= 1000) {
    // Drain proportional to average RMS in last second
    const avgRms = rmsSamples > 0 ? (rmsAccum / rmsSamples) : 0;
    // Map RMS to ml: 0 ml at 0.02, ~1 ml at 0.04, capped 10 ml/sec
    let mlDrain = Math.max(0, (avgRms - 0.02)) * 50;
    mlDrain = Math.min(10, mlDrain);
    if (mlDrain > 0 && remainingMl > 0) {
      remainingMl = Math.max(0, remainingMl - mlDrain);
      updateLevelText();
    }
    speakingAccum = 0; lastSecTs = now; rmsAccum = 0; rmsSamples = 0;
  }
  speakText.style.opacity = speakingNow ? '1' : '0.5';

  // splash amplitude reacts to RMS
  if (surfaceMesh && surfaceMesh.material && surfaceMesh.material.uniforms) {
    const u = surfaceMesh.material.uniforms;
    u.uTime.value += dt;
    // decay + add on RMS
    u.uAmp.value = Math.max(0, u.uAmp.value * Math.pow(0.98, (dt*60)) + rms * 0.5);
    // update ripple uniforms
    const nowT = performance.now() * 0.001;
    // cull old ripples after 4s
    for (let i = rippleEvents.length - 1; i >= 0; i--) {
      if (nowT - rippleEvents[i].t0 > 4.0) rippleEvents.splice(i, 1);
    }
    // fill arrays
    for (let i = 0; i < MAX_RIPPLES; i++) {
      const ev = rippleEvents[i];
      if (ev) {
        u.uRipplePos.value[i].set(ev.pos.x, ev.pos.y);
        u.uRippleT0.value[i] = ev.t0;
      } else {
        u.uRipplePos.value[i].set(9999, 9999);
        u.uRippleT0.value[i] = -9999.0;
      }
    }
    u.uRippleCount.value = rippleEvents.length;
  }

  updateWaterLevel(dt);
  renderer.render(scene, camera);
}

function onClickSurface(e){
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const plane = new THREE.Plane(new THREE.Vector3(0,1,0), -surfaceMesh.position.y);
  const hit = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(plane, hit)) {
    const local = surfaceMesh.worldToLocal(hit.clone());
    const halfW = tankSize.w * 0.5; const halfD = tankSize.d * 0.5;
    const clampedX = Math.max(-halfW, Math.min(halfW, local.x));
    const clampedZ = Math.max(-halfD, Math.min(halfD, local.y)); // local.y because plane rotated x
    const pos2 = new THREE.Vector2(clampedX, clampedZ);
    rippleEvents.unshift({ pos: pos2, t0: performance.now() * 0.001 });
    if (rippleEvents.length > MAX_RIPPLES) rippleEvents.pop();
  }
}

let lastRippleMs = 0;
function onPointerRipple(e){
  const now = performance.now();
  if (now - lastRippleMs < 120) return; // throttle ~8 Hz
  lastRippleMs = now;
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const plane = new THREE.Plane(new THREE.Vector3(0,1,0), -surfaceMesh.position.y);
  const hit = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(plane, hit)) {
    const local = surfaceMesh.worldToLocal(hit.clone());
    const halfW = tankSize.w * 0.5; const halfD = tankSize.d * 0.5;
    const clampedX = Math.max(-halfW, Math.min(halfW, local.x));
    const clampedZ = Math.max(-halfD, Math.min(halfD, local.y));
    const pos2 = new THREE.Vector2(clampedX, clampedZ);
    rippleEvents.unshift({ pos: pos2, t0: performance.now() * 0.001 });
    if (rippleEvents.length > MAX_RIPPLES) rippleEvents.pop();
  }
}


