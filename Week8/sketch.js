import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { EXRLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/EXRLoader.js';

// Firebase v10 modular CDN imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getDatabase, ref as dbRef, push, set, onChildAdded, onChildChanged, onChildRemoved, serverTimestamp, update, remove, query, orderByChild, limitToLast } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

// ----- Firebase Setup -----
const firebaseConfig = {
  apiKey: "AIzaSyAMB7p3BgqWk8uFY90S415kWAk7KDK3sGk",
  authDomain: "audreysharedminds25.firebaseapp.com",
  projectId: "audreysharedminds25",
  storageBucket: "audreysharedminds25.firebasestorage.app",
  messagingSenderId: "747240210613",
  appId: "1:747240210613:web:7a7d0b22e30d65148dbefc",
  measurementId: "G-07HRBV3H36",
  databaseURL: "https://audreysharedminds25-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const rtdb = getDatabase(app);

// ----- Replicate Proxy Config (fill in via window.setReplicateToken / setReplicateVersion) -----
const REPLICATE_PROXY_URL = 'https://itp-ima-replicate-proxy.web.app/api/create_n_get';
let REPLICATE_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjdlYTA5ZDA1NzI2MmU2M2U2MmZmNzNmMDNlMDRhZDI5ZDg5Zjg5MmEiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiQXVkcmV5IE9oIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xvdEVlUWNJZWNfUndLQ3I4b2tiT0hoel9ERWMwcjZsVWZITHZJZlJKdGt6R3I9czk2LWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vaXRwLWltYS1yZXBsaWNhdGUtcHJveHkiLCJhdWQiOiJpdHAtaW1hLXJlcGxpY2F0ZS1wcm94eSIsImF1dGhfdGltZSI6MTc2MTcxODAzMiwidXNlcl9pZCI6Im1DRXhacVlYTFFZZHZianFwTWxCeUtYNmo5WjIiLCJzdWIiOiJtQ0V4WnFZWExRWWR2YmpxcE1sQnlLWDZqOVoyIiwiaWF0IjoxNzYxNzE4MDMyLCJleHAiOjE3NjE3MjE2MzIsImVtYWlsIjoiZG83NzJAbnl1LmVkdSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTExNzk1Njc2Njc5MDMxNTIyNTY3Il0sImVtYWlsIjpbImRvNzcyQG55dS5lZHUiXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.fNEsE29XkcKe1nw6wLMbaTI184IO9wXqhmfTCsDBwFBh-sTpAI9LLY0rY6Eo3gVfKZ86PJlrwcWCfGVyJhJD2UJFO4jkNxQfE7tgEalbyIzmksOtiu3vFHAOO_W4wxQ0E2W2O4_MstGKgZEfbtLymmeCdSw3-eBwe1tufAF-OIa419Fkwgvhr-2WYLpUYTicbeOA4DUhLVz56YJ1oGdkjtXhMA1aA_Z1lLdgwTi9zVEqEUftSqEkO7opUdOYJprN_aePcjbC-qiL4PAKC0LXhkkZZKSz6My5yDPHKFtSgbOZ0KepCgw2QYoGXhdASY_1Y_KZSxexlslT4qADGqlCDA';
let REPLICATE_VERSION = 'openai/gpt-5-nano';
// Allow setting credentials from console or external script like Week 4
window.setReplicateToken = (t) => { REPLICATE_TOKEN = t || 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjdlYTA5ZDA1NzI2MmU2M2U2MmZmNzNmMDNlMDRhZDI5ZDg5Zjg5MmEiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiQXVkcmV5IE9oIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xvdEVlUWNJZWNfUndLQ3I4b2tiT0hoel9ERWMwcjZsVWZITHZJZlJKdGt6R3I9czk2LWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vaXRwLWltYS1yZXBsaWNhdGUtcHJveHkiLCJhdWQiOiJpdHAtaW1hLXJlcGxpY2F0ZS1wcm94eSIsImF1dGhfdGltZSI6MTc2MTcxMTU4OCwidXNlcl9pZCI6Im1DRXhacVlYTFFZZHZianFwTWxCeUtYNmo5WjIiLCJzdWIiOiJtQ0V4WnFZWExRWWR2YmpxcE1sQnlLWDZqOVoyIiwiaWF0IjoxNzYxNzExNTg4LCJleHAiOjE3NjE3MTUxODgsImVtYWlsIjoiZG83NzJAbnl1LmVkdSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTExNzk1Njc2Njc5MDMxNTIyNTY3Il0sImVtYWlsIjpbImRvNzcyQG55dS5lZHUiXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.Qdid0hkrqijtWqFc6ElRYbtgSoJujLw5i-aCEDd2c31ZmIzyc6re75KSfTX4C5n4A2RPKD3kdjuqE71_UiNu6OcNC9ierPhUjvY9OfIgaMSVmDhdG0on0skmu23qzttoRKPFlq0wNmQE13m5c13VlmNC3CwQQm5HQI8JzKYLy-k9GE6jZSEWGcqfPfUS9iG3lNvpG8ngS3b3NMQgOVi-WaAa_Ap11BNaf4llWLb45JnXfxcT7k2ab0pH87wHK5BvzeDz5KHEv8H2rmRaMj33S3pSRANj3aa5xWWSuM_sN8gLx2eD7cP8psnhZhYpbhGWHo7Noxm8bfJYO_1NJXcH9w'; };
window.setReplicateVersion = (v) => { REPLICATE_VERSION = v || 'openai/gpt-5-nano'; };
let EMBED_VERSION = 'beautyyuyanli/multilingual-e5-large:a06276a89f1a902d5fc225a9ca32b6e8e6292b7f3b136518878da97c458e2bad';
window.setEmbedVersion = (v) => { EMBED_VERSION = v || EMBED_VERSION; };
let OFFLINE_MERGE = true; // default to offline to avoid quota issues; toggle via console
window.setOfflineMerge = (v) => { OFFLINE_MERGE = !!v; };

// Replicate call throttling (avoid 429s)
const REP_MAX_CONCURRENCY = 1;
let repInFlight = 0;
const repQueue = [];
function scheduleReplicateCall(body, token) {
  return new Promise((resolve, reject) => {
    repQueue.push({ body, token, resolve, reject });
    processRepQueue();
  });
}
function processRepQueue() {
  if (repInFlight >= REP_MAX_CONCURRENCY || repQueue.length === 0) return;
  const job = repQueue.shift();
  repInFlight++;
  doFetchWithRetry(job.body, job.token, 3).then((json) => {
    repInFlight--; processRepQueue(); job.resolve(json);
  }).catch((e) => { repInFlight--; processRepQueue(); job.reject(e); });
}
window.REPLICATE_DEBUG = true;
window.debugAverage = async (a, b) => {
  const out = await averageThoughtAsync(a, b);
  console.log('[debugAverage]', { a, b, out });
  return out;
};

// ----- DOM -----
const container = document.getElementById('three-container');
const thoughtInput = document.getElementById('thoughtInput');
const submitButton = document.getElementById('submitThought');
const signInBtn = document.getElementById('googleSignIn');
const signOutBtn = document.getElementById('signOut');
const userInfo = document.getElementById('userInfo');
let triedAnon = false;

signInBtn.addEventListener('click', async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error(e);
    alert('Sign-in failed. See console.');
  }
});

signOutBtn.addEventListener('click', async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    const name = user.isAnonymous ? 'Anonymous' : (user.displayName || user.email);
    userInfo.textContent = `Signed in as ${name}`;
    signInBtn.style.display = 'none';
    signOutBtn.style.display = 'inline-block';
    submitButton.disabled = false;
  } else {
    userInfo.textContent = '';
    signInBtn.style.display = 'inline-block';
    signOutBtn.style.display = 'none';
    submitButton.disabled = true;
    if (!triedAnon) {
      triedAnon = true;
      signInAnonymously(auth).catch((e) => {
        console.warn('Anonymous sign-in failed', e);
      });
    }
  }
});

submitButton.addEventListener('click', async () => {
  const text = (thoughtInput.value || '').trim();
  if (!text) return;
  const user = auth.currentUser;
  if (!user) { alert('Please sign in first.'); return; }
  try {
    const thoughtsRef = dbRef(rtdb, 'thoughts');
    const newRef = push(thoughtsRef);
    await set(newRef, {
      text,
      uid: user.uid,
      displayName: user.displayName || null,
      createdAt: serverTimestamp(),
      // initial position: random in expanded bounds (disk), mild random Z
      pos: randomSpawnPosObj()
    });
    thoughtInput.value = '';
  } catch (e) {
    console.error('Failed to add thought', e);
  }
});

// Enter key submits the thought (same as clicking the button)
thoughtInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    submitButton.click();
  }
});

// ----- Three.js Scene -----
let scene, camera, renderer, controls, raycaster, mouse, clock;
let metaballGroup;
let labelsLayer;
const blobs = new Map(); // id -> { mesh, material, velocity, text, labelEl }
// Cursor world position must be initialized before first animate() call
const cursorWorld = new THREE.Vector3();
const activeMerges = new Set(); // sticky merges in progress
let viewBounds = { halfW: 400, halfH: 250 }; // updated on init/resize
let cursorInside = false;
const recentMergePairs = new Map(); // pairKey -> timestamp to prevent rapid re-merging
let manualThoughtCount = 0;
let derivedThoughtCount = 0;
const existingDerivedPairs = new Set(); // normalized pair keys already materialized as derived thoughts
const MAX_THOUGHTS_RENDER = 60; // show only the most recent N
const BOUNDS_SCALE = 1.8; // expand world bounds beyond visible frame

initThree();
subscribeThoughts();
animate();

function initThree() {
  scene = new THREE.Scene();
  //scene.background = null;

  const w = container.clientWidth;
  const h = container.clientHeight;
  camera = new THREE.PerspectiveCamera(60, w/h, 0.1, 5000);
  camera.position.set(0, 0, 220);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  // enable physically-based tonemapping for HDRI
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const light = new THREE.AmbientLight(0xaab0ff, 0.6);
  scene.add(light);
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(1, 1, 1);
  scene.add(dir);

  // group for metaballs
  metaballGroup = new THREE.Group();
  scene.add(metaballGroup);

  // labels container
  labelsLayer = document.createElement('div');
  labelsLayer.style.position = 'absolute';
  labelsLayer.style.left = '0';
  labelsLayer.style.top = '0';
  labelsLayer.style.width = '100%';
  labelsLayer.style.height = '100%';
  labelsLayer.style.pointerEvents = 'none';
  container.appendChild(labelsLayer);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  clock = new THREE.Clock();

  // Load EXR environment for lighting/reflections (keeps background transparent)
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    new EXRLoader()
      .load('./sunset_fairway_4k (1).exr', (hdr) => {
        const env = pmrem.fromEquirectangular(hdr).texture;
        hdr.dispose();
        pmrem.dispose();
        scene.environment = env; // reflections/lighting only
        // scene.background = env; // uncomment to show EXR backdrop
      });
  } catch (e) { console.warn('EXR load failed', e); }

  // compute initial bounds in world units at z≈0 plane
  computeViewBounds();

  window.addEventListener('resize', onResize);
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('mouseenter', () => { cursorInside = true; });
  renderer.domElement.addEventListener('mouseleave', () => { cursorInside = false; });
  renderer.domElement.addEventListener('touchstart', () => { cursorInside = true; }, { passive: true });
  renderer.domElement.addEventListener('touchend', () => { cursorInside = false; }, { passive: true });
}

function onResize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  computeViewBounds();
}

function onMouseMove(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

// ----- Thoughts subscription -----
function subscribeThoughts() {
  const thoughtsRef = dbRef(rtdb, 'thoughts');
  const q = query(thoughtsRef, orderByChild('createdAt'), limitToLast(MAX_THOUGHTS_RENDER));
  onChildAdded(q, (snap) => {
    const data = snap.val() || {};
    // Skip rendering any previously saved derived thoughts; only show original inputs
    if (data.derivedFrom && (data.derivedFrom.a || data.derivedFrom.b)) {
      return;
    }
    addBlob(snap.key, data);
    manualThoughtCount++;
  });
  onChildChanged(q, (snap) => {
    updateBlob(snap.key, snap.val());
  });
  onChildRemoved(q, (snap) => {
    removeBlob(snap.key);
  });
}

// ----- Blob creation -----
function createGooMaterial(color = 0x88aaff) {
  const mat = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.15,
    metalness: 0.0,
    transmission: 0.72, // translucency
    thickness: 3.5,
    transparent: true,
    opacity: 0.95,
    clearcoat: 0.75,
    clearcoatRoughness: 0.18,
    reflectivity: 0.6,
    sheen: 0.2,
  });
  return mat;
}

function addBlob(id, data) {
  if (blobs.has(id)) return;
  const radius = (12 + Math.min(24, (data.text?.length || 0) * 0.35)) * 0.875; // size down by ~1/8
  const geo = new THREE.IcosahedronGeometry(radius, 3);
  const material = createGooMaterial(0xffea00);
  const mesh = new THREE.Mesh(geo, material);
  if (data.pos && (data.pos.x != null)) {
    mesh.position.set(data.pos.x, data.pos.y || 0, data.pos.z || 0);
  } else {
    // Spawn randomly in a disk (non-grid), with spacing from existing blobs
    const maxR = Math.min(viewBounds.halfW, viewBounds.halfH) * 0.95;
    const minSpacing = 90;
    let placed = false;
    for (let tries = 0; tries < 32 && !placed; tries++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * maxR; // uniform in disk
      const candidate = new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, (Math.random()-0.5) * 18);
      let ok = true;
      for (const b of blobs.values()) {
        if (candidate.distanceTo(b.mesh.position) < (minSpacing + b.radius + radius)) { ok = false; break; }
      }
      if (ok) { mesh.position.copy(candidate); placed = true; }
    }
    if (!placed) {
      const angle = Math.random() * Math.PI * 2; const r = maxR * 0.8;
      mesh.position.set(Math.cos(angle)*r, Math.sin(angle)*r, 0);
    }
  }
  metaballGroup.add(mesh);

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = data.text || '';
  labelsLayer.appendChild(label);

  blobs.set(id, {
    id,
    mesh,
    material,
    velocity: initialVelocity(),
    text: data.text || '',
    labelEl: label,
    radius,
    isDerived: !!(data.derivedFrom)
  });

  // Enforce local cap to keep at most the most recent MAX_THOUGHTS_RENDER
  enforceBubbleCap();
}

function updateBlob(id, data) {
  const b = blobs.get(id);
  if (!b) return;
  if (data.text && data.text !== b.text) {
    b.text = data.text;
    b.labelEl.textContent = b.text;
  }
}

function removeBlob(id) {
  const b = blobs.get(id);
  if (!b) return;
  metaballGroup.remove(b.mesh);
  b.mesh.geometry?.dispose();
  b.material?.dispose();
  b.labelEl?.remove();
  blobs.delete(id);
}

function enforceBubbleCap() {
  while (blobs.size > MAX_THOUGHTS_RENDER) {
    const oldestId = blobs.keys().next().value;
    removeBlob(oldestId);
  }
}

// ----- Physics: cursor magnetism and blob merging -----
function updateCursorWorld() {
  if (!cursorInside) return; // do not update when cursor is outside
  raycaster.setFromCamera(mouse, camera);
  const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  raycaster.ray.intersectPlane(planeZ, hit);
  cursorWorld.copy(hit);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  controls.update();
  updateCursorWorld();
  stepPhysics(dt);
  updateMerges(dt);
  updateLabels();
  renderer.render(scene, camera);
}

function stepPhysics(dt) {
  const kMagnet = 150; // strong magnet strength
  const magnetRadius = 110; // tighter influence
  const drag = 0.995; // light damping to keep motion continuous
  const mergeDistanceFactor = 1.05; // allow merge when blobs are very close (or slightly apart)
  const minSeparationPad = 12; // extra gap to avoid visual overlap

  const arr = Array.from(blobs.values());
  for (let i = 0; i < arr.length; i++) {
    const a = arr[i];
    // cursor attraction
    const toCursor = new THREE.Vector3().subVectors(cursorWorld, a.mesh.position);
    const d = toCursor.length();
    a.nearCursor = cursorInside && d < magnetRadius;
    if (a.nearCursor) {
      const dirToCursor = toCursor.normalize();
      const proximity = 1 - (d / magnetRadius); // 0 far, 1 very close
      const strength = proximity * kMagnet;
      // acceleration toward cursor
      a.velocity.addScaledVector(dirToCursor, strength * dt);
      // steering: stronger alignment as we get closer
      const desiredSpeed = 20 + 60 * proximity; // 20..80
      const desiredVel = dirToCursor.clone().multiplyScalar(desiredSpeed);
      a.velocity.add(desiredVel.sub(a.velocity).multiplyScalar((0.35 + 0.25*proximity) * dt));
    }

    // very slow radial drift away from center (keeps the field breathing outward)
    const pos = a.mesh.position;
    const rLen = pos.length();
    if (rLen > 0.001) {
      const outDir = pos.clone().multiplyScalar(1 / rLen);
      const baseDrift = 0.6; // very subtle
      a.velocity.addScaledVector(outDir, baseDrift * dt);
      // tiny wobble so paths aren't perfectly straight
      const tNow = performance.now() * 0.0002 + a.mesh.id * 0.013;
      a.velocity.x += Math.sin(tNow) * 0.02 * dt;
      a.velocity.y += Math.cos(tNow * 1.3) * 0.02 * dt;
    }
    // Pairwise interactions
    for (let j = i + 1; j < arr.length; j++) {
      const b = arr[j];
      const delta = new THREE.Vector3().subVectors(b.mesh.position, a.mesh.position);
      const dist = delta.length();
      if (dist < 1e-3) continue;
      // collision/merge only when influenced by cursor
      const mergeThreshold = (a.radius + b.radius) * mergeDistanceFactor;
      if (dist < mergeThreshold && (a.nearCursor || b.nearCursor)) {
        maybeStartMerge(a, b);
      }
      // Elastic collision bounce when NOT under cursor attraction and not merging
      if (!(a.nearCursor || b.nearCursor) && !(a.merging || b.merging)) {
        const targetDist = a.radius + b.radius + minSeparationPad;
        if (dist < targetDist) {
          resolveElasticCollision(a, b, targetDist, 0.9);
        }
      }
    }
    // viscous drag
    a.velocity.multiplyScalar(drag);
    // keep motion alive and bounded
    const speed = a.velocity.length();
    const minSpeed = 6;
    const maxSpeed = 80;
    if (speed < minSpeed) {
      const factor = (speed > 1e-5) ? (minSpeed / speed) : 1;
      a.velocity.multiplyScalar(factor);
      if (speed <= 1e-5) {
        // random nudge if nearly stopped
        const ang = Math.random() * Math.PI * 2;
        a.velocity.x += Math.cos(ang) * minSpeed * 0.5;
        a.velocity.y += Math.sin(ang) * minSpeed * 0.5;
      }
    } else if (speed > maxSpeed) {
      a.velocity.multiplyScalar(maxSpeed / speed);
    }
    a.mesh.position.addScaledVector(a.velocity, dt);
    applyBounds(a);
    // subtle wobble to feel gooey
    const s = 1 + Math.sin((performance.now()*0.001) + a.mesh.id) * 0.02;
    a.mesh.scale.set(s, s, s);
  }
}

// ----- Sticky merging with dynamic bridge -----
function maybeStartMerge(a, b) {
  if (a.merging || b.merging) return;
  const now = Date.now();
  if ((a.cooldownUntil && now < a.cooldownUntil) || (b.cooldownUntil && now < b.cooldownUntil)) return;
  const ida = a.id || a.mesh.id;
  const idb = b.id || b.mesh.id;
  const pairKey = ida < idb ? ida + '_' + idb : idb + '_' + ida;
  const last = recentMergePairs.get(pairKey);
  if (last && now - last < 2500) return; // skip if recently merged
  // Relaxed constraints: allow merges regardless of origin (manual/derived)
  // Keep dedupe per pair and cooldowns to prevent explosions
  // Allow multiple derived thoughts per pair (no dedupe here)
  const receiver = (a.radius >= b.radius) ? a : b;
  const donor = (receiver === a) ? b : a;
  const combinedVolume = Math.pow(receiver.radius,3) + Math.pow(donor.radius,3);
  const bridge = createBridgeGroup(receiver, donor);
  const merge = {
    receiver,
    donor,
    bridge,
    t: 0,
    phase: 'bridge',
    bridgeDuration: 1.0,
    fuseDuration: 1.8,
    combinedVolume,
    startReceiverRadius: receiver.radius,
    startDonorRadius: donor.radius,
    startReceiverPos: receiver.mesh.position.clone(),
    startDonorPos: donor.mesh.position.clone(),
    wobblePhase: Math.random() * Math.PI * 2
  };
  receiver.merging = true;
  donor.merging = true;
  activeMerges.add(merge);
}

function createBridgeGroup(a, b) {
  const group = new THREE.Group();
  const mat = a.material.clone();
  mat.opacity = Math.min(0.95, a.material.opacity * 0.9);
  mat.transparent = true;
  mat.side = THREE.DoubleSide;
  // Illustrator-like liquid bridge using capsules along the curve
  const segments = 18;
  const parts = [];
  for (let i = 0; i < segments; i++) {
    const geo = new THREE.CapsuleGeometry(1, 1, 10, 18);
    const m = mat.clone();
    const mesh = new THREE.Mesh(geo, m);
    group.add(mesh);
    parts.push(mesh);
  }
  scene.add(group);
  group.userData = { parts, segments };
  return group;
}

function updateBridgeGroup(bridge, p1, p2, r1, r2, t, wobblePhase) {
  const { parts, segments } = bridge.userData;
  const mid = p1.clone().lerp(p2, 0.5);
  const ortho = new THREE.Vector3(0,0,1).cross(new THREE.Vector3().subVectors(p2,p1)).normalize();
  mid.addScaledVector(ortho, 8 * Math.sin((performance.now()*0.001) + wobblePhase));
  const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
  const du = 1 / segments;
  for (let i = 0; i < segments; i++) {
    const u1 = i * du;
    const u2 = Math.min(1, (i+1) * du);
    const pA = curve.getPoint(u1);
    const pB = curve.getPoint(u2);
    const center = pA.clone().add(pB).multiplyScalar(0.5);
    const dir = pB.clone().sub(pA);
    const len = Math.max(0.001, dir.length());
    const tangent = dir.clone().normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), tangent);
    const uMid = (u1 + u2) * 0.5;
    const endR = THREE.MathUtils.lerp(Math.min(r1, r2)*0.18, Math.min(r1, r2)*0.6, t);
    const centerR = THREE.MathUtils.lerp(Math.min(r1, r2)*0.12, Math.min(r1, r2)*0.3, t);
    const profile = Math.sin(Math.PI * uMid);
    const radius = THREE.MathUtils.lerp(endR, centerR, profile) * (0.9 + 0.1*Math.sin((performance.now()*0.002)+uMid*6+wobblePhase));
    const part = parts[i];
    part.position.copy(center);
    part.setRotationFromQuaternion(quat);
    part.scale.set(radius, len, radius);
    part.material.opacity = 0.9 * (0.7 + 0.3*(1 - Math.abs(0.5 - uMid)*2));
  }
}

function updateMerges(dt) {
  const done = [];
  activeMerges.forEach(merge => {
    merge.t += dt;
    const { receiver, donor, bridge } = merge;
    if (!receiver || !donor) { done.push(merge); return; }
    const p1 = receiver.mesh.position;
    const p2 = donor.mesh.position;
    const delta = new THREE.Vector3().subVectors(p2, p1);
    const dist = delta.length();
    const dir = delta.clone().normalize();

    if (merge.phase === 'bridge') {
      const t = THREE.MathUtils.clamp(merge.t / merge.bridgeDuration, 0, 1);
      // update dynamic bridge look
      updateBridgeGroup(bridge, p1, p2, receiver.radius, donor.radius, t, merge.wobblePhase);
      // gentle attraction
      const pull = 24.0 * (1.0 - Math.min(1, dist / (receiver.radius + donor.radius + 30)));
      receiver.velocity.addScaledVector(dir,  pull * dt);
      donor.  velocity.addScaledVector(dir, -pull * dt);
      if (t >= 1.0 || dist < (receiver.radius + donor.radius) * 0.55) {
        merge.phase = 'fuse';
        merge.t = 0;
      }
    } else if (merge.phase === 'fuse') {
      const t = THREE.MathUtils.clamp(merge.t / merge.fuseDuration, 0, 1);
      const ease = t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t;
      const targetReceiverVol = merge.combinedVolume;
      const receiverVol = THREE.MathUtils.lerp(Math.pow(merge.startReceiverRadius,3), targetReceiverVol, ease);
      const donorVol = Math.max(0, merge.combinedVolume - receiverVol);
      receiver.radius = Math.cbrt(receiverVol);
      donor.radius = Math.cbrt(donorVol);

      receiver.mesh.geometry.dispose();
      receiver.mesh.geometry = new THREE.IcosahedronGeometry(receiver.radius, 4);
      donor.mesh.geometry.dispose();
      donor.mesh.geometry = new THREE.IcosahedronGeometry(Math.max(0.0001, donor.radius), 3);

      // move toward midpoint and keep bridge updated while donor shrinks
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      receiver.mesh.position.lerp(mid, 0.22 * dt);
      donor.mesh.position.lerp(mid, 0.30 * dt);
      updateBridgeGroup(bridge, receiver.mesh.position, donor.mesh.position, receiver.radius, donor.radius, 1 - t*0.9, merge.wobblePhase);

      // fade bridge
      bridge.children.forEach(child => { if (child.material) child.material.opacity = 0.85 * (1 - t); });

      if (t >= 1.0 || donor.radius < 0.05) {
        // finalize merge: keep originals intact and create a new ephemeral derived thought (local only)
        scene.remove(bridge);
        bridge.children.forEach(child => { child.geometry?.dispose(); child.material?.dispose(); });
        // restore original sizes/positions
        receiver.radius = merge.startReceiverRadius;
        donor.radius = merge.startDonorRadius;
        receiver.mesh.geometry.dispose();
        receiver.mesh.geometry = new THREE.IcosahedronGeometry(receiver.radius, 4);
        donor.mesh.geometry.dispose();
        donor.mesh.geometry = new THREE.IcosahedronGeometry(donor.radius, 3);
        receiver.mesh.position.copy(merge.startReceiverPos);
        donor.mesh.position.copy(merge.startDonorPos);
        // midpoint with slight jitter to avoid stacking on originals
        const mid = p1.clone().add(p2).multiplyScalar(0.5);
        mid.x += (Math.random()-0.5) * 20;
        mid.y += (Math.random()-0.5) * 20;
        mid.z += (Math.random()-0.5) * 6;
        const priorText = receiver.text;
        const donorText = donor.text;
        averageThoughtAsync(priorText, donorText).then(avg => {
          const newText = avg || sanitizeMidpoint(`${priorText} ${donorText}`);
          addEphemeralBlob(newText, mid);
        }).catch(()=>{});
        // set cooldowns and remember the pair
        const ida = receiver.id || receiver.mesh.id;
        const idb = donor.id || donor.mesh.id;
        const pairKey = ida < idb ? ida + '_' + idb : idb + '_' + ida;
        recentMergePairs.set(pairKey, Date.now());
        setTimeout(() => { recentMergePairs.delete(pairKey); }, 4000);
        receiver.cooldownUntil = Date.now() + 2500;
        donor.cooldownUntil = Date.now() + 2500;
        receiver.merging = false;
        done.push(merge);
      }
    }
  });
  done.forEach(m => activeMerges.delete(m));
}

// ----- Helpers -----
async function averageThoughtAsync(textA, textB) {
  try {
    const targetWords = clampInt(Math.round((countWords(textA) + countWords(textB)) / 2), 6, 22);
    if (OFFLINE_MERGE) {
      return sanitizeMidpoint(offlineMidpoint(textA, textB, targetWords));
    }
    if (!REPLICATE_TOKEN || !REPLICATE_VERSION) return sanitizeMidpoint(offlineMidpoint(textA, textB, targetWords));
    // 1) Embed A and B
    const aShort = String(textA || '').slice(0, 280);
    const bShort = String(textB || '').slice(0, 280);
    const embeds = await embedTexts([aShort, bShort]);
    if (!embeds || embeds.length < 2) return null;
    const va = embeds[0], vb = embeds[1];
    const vc = vectorAverage(va, vb);
    // 2) Propose candidates via LLM (short list), then pick by nearest to vc
    const candidates = await proposeCandidatesLLM(aShort, bShort, Math.max(4, Math.min(12, targetWords)));
    const safe = dedupeAndFilterCandidates(candidates, aShort, bShort);
    if (safe.length === 0) return null;
    const candEmbeds = await embedTexts(safe);
    if (!candEmbeds) return null;
    let bestIdx = 0; let bestScore = -Infinity;
    for (let i = 0; i < safe.length; i++) {
      const sim = cosine(candEmbeds[i], vc);
      if (sim > bestScore) { bestScore = sim; bestIdx = i; }
    }
    return sanitizeMidpoint(safe[bestIdx]);
  } catch (e) {
    console.warn('avgThought failed', e);
    return null;
  }
}

// Simple similarity by Jaccard on word sets
function similarity(a, b) {
  if (!a || !b) return 0;
  const sa = new Set(a.split(/\s+/).filter(Boolean));
  const sb = new Set(b.split(/\s+/).filter(Boolean));
  let inter = 0;
  for (const w of sa) if (sb.has(w)) inter++;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

function craftHybridFallback(a, b, targetWords = 10) {
  const pick = (t) => {
    const s = (t || '').trim();
    if (!s) return '';
    // If contains CJK/Hangul scripts, keep a short snippet (handles words like "안녕")
    const hasCJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(s);
    if (hasCJK) return s.slice(0, 6);
    // Latin-like: pick meaningful words (allow short words too except common stopwords)
    const stop = new Set(['the','a','an','and','or','but','to','of','in','on','at','for','with','by','is','are','am','be','as','it','this','that','these','those','i','you','we','they','he','she','them','us','me','my','your','our']);
    const tokens = s.split(/[^\p{L}\p{N}']+/u).filter(x => x && !stop.has(x.toLowerCase()));
    return tokens.slice(0, 3).join(' ');
  };
  const pa = pick(a) || (a || '').trim();
  const pb = pick(b) || (b || '').trim();
  const templates = [
    (x,y) => `${x} drifts toward ${y}`,
    (x,y) => `${x} echoes of ${y}`,
    (x,y) => `${x} and ${y} share a quiet room`,
    (x,y) => `${x} under ${y}'s weather`,
    (x,y) => `${x} meets ${y} in soft light`
  ];
  let base = (pa && pb) ? templates[Math.floor(Math.random()*templates.length)](pa, pb) : (pa || pb || '').trim();
  // pad with light imagery words to hit target length
  const fillers = ['breathing', 'softly', 'in', 'a', 'quiet', 'room', 'of', 'winter', 'light'];
  while (countWords(base) < targetWords && fillers.length) {
    base += ' ' + fillers.shift();
  }
  return base.slice(0, 180) || 'blended thought';
}

function countWords(s) {
  if (!s) return 0;
  const hasCJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(s);
  if (hasCJK) return Math.max(1, Math.round(s.trim().length / 2));
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function clampInt(v, min, max) { return Math.max(min, Math.min(max, v|0)); }

function sanitizeMidpoint(s) {
  let t = (s || '').trim().replace(/^"|"$/g, '');
  t = t.replace(/^C\s*:\s*/i, '').trim();
  // remove banned words/phrases
  const banned = [/\bit\s+reminds\s+me\s+of\b/gi, /\bbetween\b/gi, /\bblend(ed|ing)?\b/gi, /\bmix(ed|ing)?\b/gi, /\bmiddle\b/gi];
  banned.forEach(rx => { t = t.replace(rx, '').trim(); });
  // collapse whitespace and punctuation cleanup
  t = t.replace(/\s{2,}/g, ' ').replace(/\s+([,.;!?])/g, '$1');
  // start with capital letter
  if (t) t = t.charAt(0).toUpperCase() + t.slice(1);
  return t.slice(0, 180);
}

async function fetchReplicateWithRetry(body, token, attempts = 2) {
  // legacy direct path; keep for compatibility
  return scheduleReplicateCall(body, token);
}

async function doFetchWithRetry(body, token, attempts = 3) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(REPLICATE_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(t);
      const json = await res.json().catch(() => ({ error: 'invalid_json' }));
      if (res.status === 429) {
        lastErr = json || { error: 'rate_limited' };
        // exponential backoff with jitter
        const delay = 600 * Math.pow(2, i) + Math.random() * 300;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      if (res.status >= 500) {
        lastErr = json || { error: `status_${res.status}` };
        await new Promise(r => setTimeout(r, 400 * (i + 1)));
        continue;
      }
      return json;
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 400 * (i + 1)));
    }
  }
  if (window.REPLICATE_DEBUG) console.warn('[replicate] final error', lastErr);
  return { error: lastErr || 'unknown_error' };
}

function makePairKey(aId, bId) {
  if (!aId || !bId) return '';
  return (aId < bId) ? `${aId}_${bId}` : `${bId}_${aId}`;
}

// ----- Embedding-driven midpoint helpers -----
const embedCache = new Map();
async function embedTexts(texts) {
  try {
    const need = [];
    const mapIdx = [];
    for (let i = 0; i < texts.length; i++) {
      const key = texts[i];
      if (embedCache.has(key)) {
        mapIdx.push(-1);
      } else {
        mapIdx.push(need.length);
        need.push(key);
      }
    }
    if (need.length > 0) {
      const body = { version: EMBED_VERSION, input: { texts: JSON.stringify(need) } };
      const json = await fetchReplicateWithRetry(body, REPLICATE_TOKEN, 2);
      const out = json?.output;
      if (Array.isArray(out)) {
        for (let i = 0; i < out.length; i++) embedCache.set(need[i], out[i]);
      }
    }
    return texts.map(t => embedCache.get(t)).filter(Boolean);
  } catch (_) { return null; }
}

function vectorAverage(a, b) {
  const n = Math.min(a.length, b.length);
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = 0.5 * (a[i] + b[i]);
  return out;
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? dot / denom : 0;
}

async function proposeCandidatesLLM(a, b, targetWords) {
  const prompt = `Propose 8 short, evocative midpoint phrases (no quotes) that lie near the semantic centroid of A and B. Avoid copying substrings from A or B; avoid words like between/mix/blend/middle. Each item 1-${targetWords} words, one per line.\nA: "${a}"\nB: "${b}"\nCandidates:`;
  const data = { version: REPLICATE_VERSION, input: { prompt, max_tokens: 140, temperature: 0.8, top_p: 0.95 } };
  const json = await fetchReplicateWithRetry(data, REPLICATE_TOKEN, 2);
  let out = json?.output;
  if (!out) return [];
  if (Array.isArray(out)) out = out.find(x => typeof x === 'string') || out[0];
  if (typeof out === 'object') out = out.text || out.response || out.content || '';
  if (typeof out !== 'string') out = String(out || '');
  return out.split(/\r?\n/).map(s => s.trim()).filter(Boolean).slice(0, 12);
}

function dedupeAndFilterCandidates(list, a, b) {
  const seen = new Set();
  const bad = [/\bbetween\b/i, /\bblend(ed|ing)?\b/i, /\bmix(ed|ing)?\b/i, /\bmiddle\b/i, /\bit\s+reminds\s+me\s+of\b/i];
  const aLC = (a||'').toLowerCase();
  const bLC = (b||'').toLowerCase();
  const out = [];
  for (const s of list) {
    let t = s.replace(/^[-*\d.\)\s]+/, '').trim();
    if (!t || seen.has(t.toLowerCase())) continue;
    if (bad.some(rx => rx.test(t))) continue;
    const tLC = t.toLowerCase();
    if (tLC.includes(aLC) || tLC.includes(bLC)) continue;
    seen.add(t.toLowerCase());
    out.push(t);
  }
  return out.slice(0, 12);
}

// ----- Offline midpoint (no network) -----
function offlineMidpoint(a, b, targetWords = 10) {
  const kw = (t) => {
    const s = (t||'').trim();
    const hasCJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(s);
    if (hasCJK) return s.slice(0, 6);
    const stop = new Set(['the','a','an','and','or','but','to','of','in','on','at','for','with','by','is','are','am','be','as','it','this','that','these','those','i','you','we','they','he','she','them','us','me','my','your','our']);
    return s.split(/[^\p{L}\p{N}']+/u).filter(x => x && !stop.has(x.toLowerCase())).slice(0, 3).join(' ');
  };
  const ka = kw(a) || (a||'').trim();
  const kb = kw(b) || (b||'').trim();
  const textures = ['silk','salt','ash','mist','paper','honey','smoke','glass','wool'];
  const places = ['quiet room','winter street','harbor dawn','small kitchen','empty gallery'];
  const actions = ['breathing softly','drifts toward','settles into','echoes under'];
  const colors = ['pale yellow','amber','white','milk','lemon'];
  const t = Math.random();
  let phrase;
  if (t < 0.33) {
    phrase = `${ka} ${actions[Math.floor(Math.random()*actions.length)]} ${kb} in ${colors[Math.floor(Math.random()*colors.length)]}`;
  } else if (t < 0.66) {
    phrase = `${ka} and ${kb} in a ${places[Math.floor(Math.random()*places.length)]}`;
  } else {
    phrase = `${ka} under ${kb}'s weather, ${textures[Math.floor(Math.random()*textures.length)]}`;
  }
  // pad to target length with light words
  const fillers = ['softly','and','then','again','nearby','quietly'];
  while (countWords(phrase) < targetWords && fillers.length) phrase += ' ' + fillers.shift();
  return phrase;
}

// ----- Admin helpers -----
window.purgeThoughts = async function() {
  try {
    await remove(dbRef(rtdb, 'thoughts'));
  } catch (e) {
    console.warn('purge remove failed, trying set=null', e);
    try { await set(dbRef(rtdb, 'thoughts'), null); } catch (_) {}
  }
  // local cleanup
  for (const b of Array.from(blobs.values())) {
    metaballGroup.remove(b.mesh);
    b.mesh.geometry?.dispose();
    b.material?.dispose();
    b.labelEl?.remove();
  }
  blobs.clear();
  existingDerivedPairs.clear();
  recentMergePairs.clear();
  manualThoughtCount = 0;
  derivedThoughtCount = 0;
  console.log('All thoughts purged.');
};

function initialVelocity() {
  // random 2D direction, magnitude 1..4
  const angle = Math.random() * Math.PI * 2;
  const mag = 1 + Math.random() * 3;
  return new THREE.Vector3(Math.cos(angle)*mag, Math.sin(angle)*mag, (Math.random()-0.5)*0.3);
}

function computeViewBounds() {
  // visible rectangle at z=0 given perspective
  const dist = Math.abs(camera.position.z); // camera to origin
  const vFOV = THREE.MathUtils.degToRad(camera.fov);
  const halfH = Math.tan(vFOV/2) * dist;
  const halfW = halfH * camera.aspect;
  viewBounds = { halfW: halfW * BOUNDS_SCALE, halfH: halfH * BOUNDS_SCALE };
}

function applyBounds(blob) {
  const p = blob.mesh.position;
  const e = 0.88; // restitution
  if (p.x > viewBounds.halfW - blob.radius) { p.x = viewBounds.halfW - blob.radius; blob.velocity.x *= -e; }
  if (p.x < -viewBounds.halfW + blob.radius) { p.x = -viewBounds.halfW + blob.radius; blob.velocity.x *= -e; }
  if (p.y > viewBounds.halfH - blob.radius) { p.y = viewBounds.halfH - blob.radius; blob.velocity.y *= -e; }
  if (p.y < -viewBounds.halfH + blob.radius) { p.y = -viewBounds.halfH + blob.radius; blob.velocity.y *= -e; }
  // optional shallow z constraint
  if (p.z > 120) { p.z = 120; blob.velocity.z *= -e; }
  if (p.z < -120) { p.z = -120; blob.velocity.z *= -e; }
}

// Resolve an elastic collision between two blobs in the XY plane, with position correction
function resolveElasticCollision(a, b, targetDist, restitution = 0.9) {
  const posA = a.mesh.position;
  const posB = b.mesh.position;
  const delta = new THREE.Vector3().subVectors(posB, posA);
  const dist = Math.max(1e-6, Math.hypot(delta.x, delta.y));
  const nx = delta.x / dist;
  const ny = delta.y / dist;
  // Positional correction to remove overlap
  const overlap = targetDist - dist;
  if (overlap > 0) {
    const pushX = nx * (overlap * 0.5);
    const pushY = ny * (overlap * 0.5);
    posA.x -= pushX; posA.y -= pushY;
    posB.x += pushX; posB.y += pushY;
  }
  // Mass proportional to radius^2 (2D area surrogate)
  const mA = Math.max(1, a.radius * a.radius);
  const mB = Math.max(1, b.radius * b.radius);
  // Relative velocity along normal
  const rvx = a.velocity.x - b.velocity.x;
  const rvy = a.velocity.y - b.velocity.y;
  const velAlongNormal = rvx * nx + rvy * ny;
  if (velAlongNormal > 0) return; // already separating
  const j = -(1 + restitution) * velAlongNormal / (1/mA + 1/mB);
  const ix = j * nx;
  const iy = j * ny;
  a.velocity.x += ix / mA;
  a.velocity.y += iy / mA;
  b.velocity.x -= ix / mB;
  b.velocity.y -= iy / mB;
}

// Create a local-only, ephemeral derived bubble that will vanish on refresh
function addEphemeralBlob(text, positionVec3) {
  const id = `local_${Date.now()}_${Math.floor(Math.random()*1e6)}`;
  const data = { text, pos: { x: positionVec3.x, y: positionVec3.y, z: positionVec3.z } };
  if (blobs.has(id)) return;
  const radius = (12 + Math.min(24, (text?.length || 0) * 0.35)) * 0.875;
  const geo = new THREE.IcosahedronGeometry(radius, 3);
  const material = createGooMaterial(0xffea00);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.copy(positionVec3);
  metaballGroup.add(mesh);

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = text || '';
  labelsLayer.appendChild(label);

  blobs.set(id, {
    id,
    mesh,
    material,
    velocity: initialVelocity(),
    text: text || '',
    labelEl: label,
    radius,
    isDerived: true,
    ephemeral: true
  });
  enforceBubbleCap();
}

function randomSpawnPosObj() {
  // uniform in disk within expanded bounds, plus shallow Z range
  const maxR = Math.min(viewBounds.halfW, viewBounds.halfH) * 0.9;
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * maxR;
  const x = Math.cos(angle) * r;
  const y = Math.sin(angle) * r;
  const z = (Math.random() - 0.5) * 160;
  return { x, y, z };
}

function updateLabels() {
  const rect = renderer.domElement.getBoundingClientRect();
  for (const blob of blobs.values()) {
    const p = blob.mesh.position.clone();
    p.project(camera);
    const x = (p.x * 0.5 + 0.5) * rect.width;
    const y = (-p.y * 0.5 + 0.5) * rect.height;
    blob.labelEl.style.left = `${x}px`;
    blob.labelEl.style.top = `${y}px`;
    const dist = camera.position.distanceTo(blob.mesh.position);
    const alpha = THREE.MathUtils.clamp(1.6 - dist/220, 0.2, 1);
    blob.labelEl.style.opacity = `${alpha}`;
  }
}


