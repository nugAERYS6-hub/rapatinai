// ==========================================================================
// RAPATINAI - KOMPONEN PENA 3D INTERAKTIF (BERANDA NIPW)
// Visual: Pena Eksekutif Kedinasan (Obsidian Lacquer & 18K Gold Finish)
// Interaksi: Geser ke Kanan, Kiri, Atas, dan Bawah (Rotasi 3D + Momentum + Idle Floating)
// Implementasi: Native WebGL 3D dengan Shading Blinn-Phong & Multi-Light Studio
// ==========================================================================

// Variabel status modul
let animationFrameId = null;
let glContext = null;
let canvasElement = null;
let isModuleRunning = false;

// Status Transformasi & Fisika 3D
const penState = {
  // Sudut rotasi dasar (posisi awal diagonal mewah siap menulis)
  rotX: 0.28,
  rotY: -0.65,
  rotZ: -0.32,
  targetRotX: 0.28,
  targetRotY: -0.65,
  targetRotZ: -0.32,

  // Translasi halus mengikuti geseran
  panX: 0,
  panY: 0,
  targetPanX: 0,
  targetPanY: 0,

  // Kecepatan momentum setelah dilepas (inertia)
  velRotX: 0,
  velRotY: 0,
  velPanX: 0,
  velPanY: 0,

  // Status drag pointer
  isDragging: false,
  pointerStartX: 0,
  pointerStartY: 0,
  lastPointerX: 0,
  lastPointerY: 0,
  hasInteracted: false,

  // Waktu untuk idle animation
  time: 0,
};

// Nilai default untuk tombol reset
const DEFAULT_TRANSFORM = {
  rotX: 0.28,
  rotY: -0.65,
  rotZ: -0.32,
  panX: 0,
  panY: 0,
};

// ==========================================================================
// UTILITAS MATRIKS 4X4 (NATIVE WEBGL ZERO DEPENDENCY)
// ==========================================================================

function mat4Create() {
  const out = new Float32Array(16);
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}

function mat4Identity(out) {
  out.fill(0);
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}

function mat4Perspective(out, fovy, aspect, near, far) {
  const f = 1.0 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}

function mat4Multiply(out, a, b) {
  const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

  let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
}

function mat4Translate(out, a, x, y, z) {
  out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3];
  out[4] = a[4]; out[5] = a[5]; out[6] = a[6]; out[7] = a[7];
  out[8] = a[8]; out[9] = a[9]; out[10] = a[10]; out[11] = a[11];
  out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
  out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
  out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
  out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
  return out;
}

function mat4RotateX(out, a, rad) {
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];

  if (a !== out) {
    out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3];
    out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
  }

  out[4] = a10 * c + a20 * s;
  out[5] = a11 * c + a21 * s;
  out[6] = a12 * c + a22 * s;
  out[7] = a13 * c + a23 * s;
  out[8] = a20 * c - a10 * s;
  out[9] = a21 * c - a11 * s;
  out[10] = a22 * c - a12 * s;
  out[11] = a23 * c - a13 * s;
  return out;
}

function mat4RotateY(out, a, rad) {
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];

  if (a !== out) {
    out[4] = a[4]; out[5] = a[5]; out[6] = a[6]; out[7] = a[7];
    out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
  }

  out[0] = a00 * c - a20 * s;
  out[1] = a01 * c - a21 * s;
  out[2] = a02 * c - a22 * s;
  out[3] = a03 * c - a23 * s;
  out[8] = a00 * s + a20 * c;
  out[9] = a01 * s + a21 * c;
  out[10] = a02 * s + a22 * c;
  out[11] = a03 * s + a23 * c;
  return out;
}

function mat4RotateZ(out, a, rad) {
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];

  if (a !== out) {
    out[8] = a[8]; out[9] = a[9]; out[10] = a[10]; out[11] = a[11];
    out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
  }

  out[0] = a00 * c + a10 * s;
  out[1] = a01 * c + a11 * s;
  out[2] = a02 * c + a12 * s;
  out[3] = a03 * c + a13 * s;
  out[4] = a10 * c - a00 * s;
  out[5] = a11 * c - a01 * s;
  out[6] = a12 * c - a02 * s;
  out[7] = a13 * c - a03 * s;
  return out;
}

function mat3NormalFromMat4(out, a) {
  const a00 = a[0], a01 = a[1], a02 = a[2];
  const a10 = a[4], a11 = a[5], a12 = a[6];
  const a20 = a[8], a21 = a[9], a22 = a[10];

  const b01 = a22 * a11 - a12 * a21;
  const b11 = -a22 * a10 + a12 * a20;
  const b21 = a21 * a10 - a11 * a20;

  let d = a00 * b01 + a01 * b11 + a02 * b21;
  if (!d) return null;
  d = 1.0 / d;

  out[0] = b01 * d;
  out[1] = (-a22 * a01 + a02 * a21) * d;
  out[2] = (a12 * a01 - a02 * a11) * d;
  out[3] = b11 * d;
  out[4] = (a22 * a00 - a02 * a20) * d;
  out[5] = (-a12 * a00 + a02 * a10) * d;
  out[6] = b21 * d;
  out[7] = (-a21 * a00 + a01 * a20) * d;
  out[8] = (a11 * a00 - a01 * a10) * d;
  return out;
}

// ==========================================================================
// GENERATOR GEOMETRI 3D PENA EKSEKUTIF KEDINASAN
// ==========================================================================

function createPenMesh() {
  const positions = [];
  const normals = [];
  const colors = [];
  const materials = []; // 0 = Obsidian Lacquer, 1 = 18K Gold, 2 = Matte Ebonite Feed
  const indices = [];

  let indexOffset = 0;

  // Helper untuk menambahkan silinder / kerucut terpotong bertahap
  function addCylinder(rTop, rBottom, yTop, yBottom, segments, matId, rgb) {
    const ringStart = indexOffset;
    for (let i = 0; i <= segments; i++) {
      const u = (i / segments) * Math.PI * 2;
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);

      const nx = cosU;
      const nz = sinU;
      const slope = (rBottom - rTop) / (yTop - yBottom);
      const ny = slope;
      const nLen = Math.hypot(nx, ny, nz) || 1;

      // Vertex Top
      positions.push(cosU * rTop, yTop, sinU * rTop);
      normals.push(nx / nLen, ny / nLen, nz / nLen);
      colors.push(rgb[0], rgb[1], rgb[2]);
      materials.push(matId);

      // Vertex Bottom
      positions.push(cosU * rBottom, yBottom, sinU * rBottom);
      normals.push(nx / nLen, ny / nLen, nz / nLen);
      colors.push(rgb[0], rgb[1], rgb[2]);
      materials.push(matId);
    }

    for (let i = 0; i < segments; i++) {
      const v0 = ringStart + i * 2;
      const v1 = ringStart + i * 2 + 1;
      const v2 = ringStart + (i + 1) * 2;
      const v3 = ringStart + (i + 1) * 2 + 1;

      indices.push(v0, v1, v2);
      indices.push(v2, v1, v3);
    }
    indexOffset += (segments + 1) * 2;
  }

  // Helper untuk tutup kubah (Dome Finial)
  function addDome(radius, yBase, segments, rings, matId, rgb, isTop = true) {
    const startIdx = indexOffset;
    const sign = isTop ? 1 : -1;

    for (let r = 0; r <= rings; r++) {
      const phi = (r / rings) * (Math.PI / 2);
      const y = yBase + Math.sin(phi) * radius * sign;
      const radAtPhi = Math.cos(phi) * radius;

      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        const x = Math.cos(theta) * radAtPhi;
        const z = Math.sin(theta) * radAtPhi;

        const nx = x / (radius || 1);
        const ny = (Math.sin(phi) * sign);
        const nz = z / (radius || 1);
        const len = Math.hypot(nx, ny, nz) || 1;

        positions.push(x, y, z);
        normals.push(nx / len, ny / len, nz / len);
        colors.push(rgb[0], rgb[1], rgb[2]);
        materials.push(matId);
      }
    }

    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < segments; s++) {
        const curRow = startIdx + r * (segments + 1);
        const nextRow = startIdx + (r + 1) * (segments + 1);

        const v0 = curRow + s;
        const v1 = nextRow + s;
        const v2 = curRow + s + 1;
        const v3 = nextRow + s + 1;

        indices.push(v0, v1, v2);
        indices.push(v2, v1, v3);
      }
    }
    indexOffset += (rings + 1) * (segments + 1);
  }

  // Helper membuat Mata Pena Emas (18K Fountain Pen Nib)
  function addNib() {
    const yBase = 2.4;
    const yShoulder = 2.75;
    const yTip = 3.35;
    const goldRGB = [0.97, 0.81, 0.32];
    const feedRGB = [0.12, 0.13, 0.16];

    // Lapisan Atas Nib (Lengkung Kurva Emas)
    const stepsY = 8;
    const stepsX = 6;
    const startIdx = indexOffset;

    for (let iy = 0; iy <= stepsY; iy++) {
      const ty = iy / stepsY;
      let y, w, curveZ;

      if (ty < 0.35) {
        // Dari base ke shoulder
        const t1 = ty / 0.35;
        y = yBase + (yShoulder - yBase) * t1;
        w = 0.22 + (0.28 - 0.22) * Math.sin(t1 * Math.PI * 0.5);
      } else {
        // Dari shoulder meruncing ke ujung nib (tip)
        const t2 = Math.min(Math.max((ty - 0.35) / 0.65, 0), 1);
        y = yShoulder + (yTip - yShoulder) * t2;
        w = 0.28 * Math.pow(Math.max(0, 1 - t2), 0.85) + 0.02;
      }

      curveZ = 0.08 * (1 - ty * 0.6);

      for (let ix = 0; ix <= stepsX; ix++) {
        const tx = (ix / stepsX) * 2 - 1; // -1 to +1
        const x = tx * w;
        // Kurva cembung melengkung ke luar
        const z = Math.cos(tx * Math.PI * 0.45) * curveZ;

        // Normal aproksimasi
        const nx = tx * 0.5;
        const ny = -0.2;
        const nz = 0.9;
        const nlen = Math.hypot(nx, ny, nz) || 1;

        positions.push(x, y, z);
        normals.push(nx / nlen, ny / nlen, nz / nlen);
        colors.push(goldRGB[0], goldRGB[1], goldRGB[2]);
        materials.push(1); // Gold
      }
    }

    for (let iy = 0; iy < stepsY; iy++) {
      for (let ix = 0; ix < stepsX; ix++) {
        const row1 = startIdx + iy * (stepsX + 1);
        const row2 = startIdx + (iy + 1) * (stepsX + 1);

        const v0 = row1 + ix;
        const v1 = row2 + ix;
        const v2 = row1 + ix + 1;
        const v3 = row2 + ix + 1;

        indices.push(v0, v1, v2);
        indices.push(v2, v1, v3);
      }
    }
    indexOffset += (stepsY + 1) * (stepsX + 1);

    // Penyalur Tinta (Feed Ebonite di bawah nib)
    addCylinder(0.12, 0.16, 2.85, 2.4, 16, 2, feedRGB);
  }

  // Helper Klip Saku Emas Mewah (Executive Pocket Clip)
  function addClip() {
    const yTop = 0.95;
    const yBottom = -0.65;
    const clipGold = [0.98, 0.84, 0.35];
    const startIdx = indexOffset;

    // Profil klip memanjang dengan ketebalan dan bulatan di ujung
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = yTop + (yBottom - yTop) * t;
      const w = 0.045 * (1 - t * 0.25) + (t > 0.85 ? 0.025 : 0);
      const outZ = 0.36 + Math.sin(t * Math.PI) * 0.05 + (t > 0.9 ? 0.02 : 0);

      // Left point
      positions.push(-w, y, outZ);
      normals.push(-0.2, 0.1, 0.95);
      colors.push(clipGold[0], clipGold[1], clipGold[2]);
      materials.push(1);

      // Right point
      positions.push(w, y, outZ);
      normals.push(0.2, 0.1, 0.95);
      colors.push(clipGold[0], clipGold[1], clipGold[2]);
      materials.push(1);
    }

    for (let i = 0; i < steps; i++) {
      const v0 = startIdx + i * 2;
      const v1 = startIdx + i * 2 + 1;
      const v2 = startIdx + (i + 1) * 2;
      const v3 = startIdx + (i + 1) * 2 + 1;

      indices.push(v0, v1, v2);
      indices.push(v2, v1, v3);
    }
    indexOffset += (steps + 1) * 2;
  }

  // Warna Material
  const obsidianRGB = [0.06, 0.09, 0.16]; // Midnight obsidian lacquer
  const goldRGB = [0.96, 0.80, 0.30];     // 18K Polish Gold

  // 1. Mata Pena (Fountain Nib) & Feed
  addNib();

  // 2. Cincin Emas Grip Depan
  addCylinder(0.22, 0.23, 2.4, 2.32, 24, 1, goldRGB);

  // 3. Pegangan Ergonomis (Grip Section)
  addCylinder(0.23, 0.27, 2.32, 1.85, 24, 0, obsidianRGB);
  addCylinder(0.27, 0.29, 1.85, 1.38, 24, 0, obsidianRGB);

  // 4. Cincin Ulir Emas Seksi
  addCylinder(0.29, 0.31, 1.38, 1.32, 24, 1, goldRGB);

  // 5. Cincin Emas Tengah Kedinasan (Central Band)
  addCylinder(0.33, 0.33, 1.32, 1.15, 24, 1, [0.98, 0.84, 0.35]);
  addCylinder(0.33, 0.31, 1.15, 1.10, 24, 1, goldRGB);

  // 6. Badan Pena Utama (Main Barrel)
  addCylinder(0.31, 0.31, 1.10, 0.2, 24, 0, obsidianRGB);
  addCylinder(0.31, 0.29, 0.2, -0.8, 24, 0, obsidianRGB);
  addCylinder(0.29, 0.26, -0.8, -1.85, 24, 0, obsidianRGB);

  // 7. Cincin Emas Finial Bawah
  addCylinder(0.26, 0.26, -1.85, -1.98, 24, 1, goldRGB);

  // 8. Tutup Ujung Belakang (Finial Dome)
  addDome(0.25, -1.98, 24, 6, 0, obsidianRGB, false);

  // 9. Klip Saku Emas
  addClip();

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    materials: new Float32Array(materials),
    indices: new Uint16Array(indices),
  };
}

// ==========================================================================
// SHADER GLSL & PIPELINE WEBGL
// ==========================================================================

const VERTEX_SHADER_SRC = `
  attribute vec3 a_position;
  attribute vec3 a_normal;
  attribute vec3 a_color;
  attribute float a_material;

  uniform mat4 u_mvp;
  uniform mat4 u_model;
  uniform mat3 u_normalMatrix;

  varying vec3 v_normal;
  varying vec3 v_position;
  varying vec3 v_color;
  varying float v_material;

  void main() {
    vec4 worldPos = u_model * vec4(a_position, 1.0);
    v_position = worldPos.xyz;
    v_normal = normalize(u_normalMatrix * a_normal);
    v_color = a_color;
    v_material = a_material;
    gl_Position = u_mvp * vec4(a_position, 1.0);
  }
`;

const FRAGMENT_SHADER_SRC = `
  precision mediump float;

  varying vec3 v_normal;
  varying vec3 v_position;
  varying vec3 v_color;
  varying float v_material;

  uniform vec3 u_lightDir1; // Lampu Utama Depan-Kanan
  uniform vec3 u_lightDir2; // Fill Light Lembut Kiri-Bawah
  uniform vec3 u_lightDir3; // Rim Light Belakang
  uniform vec3 u_cameraPos;

  void main() {
    vec3 N = normalize(v_normal);
    vec3 V = normalize(u_cameraPos - v_position);

    // Key Light
    vec3 L1 = normalize(u_lightDir1);
    float diff1 = max(dot(N, L1), 0.0);
    vec3 H1 = normalize(L1 + V);

    // Fill Light
    vec3 L2 = normalize(u_lightDir2);
    float diff2 = max(dot(N, L2), 0.0);

    // Rim Light (Pantulan Kontur Elegan)
    vec3 L3 = normalize(u_lightDir3);
    float rim = 1.0 - max(dot(N, V), 0.0);
    rim = pow(max(rim, 0.0), 3.0);

    vec3 baseColor = v_color;
    vec3 finalColor = vec3(0.0);

    if (v_material > 0.5 && v_material < 1.5) {
      // 18K METALLIC GOLD (Nib, Ring, Klip)
      float spec = pow(max(dot(N, H1), 0.0), 40.0);
      vec3 goldAmbient = baseColor * 0.40;
      vec3 goldDiffuse = baseColor * (diff1 * 0.65 + diff2 * 0.25);
      vec3 goldSpec = vec3(1.0, 0.95, 0.72) * spec * 1.5;
      vec3 goldRim = vec3(1.0, 0.85, 0.4) * rim * 0.6;
      finalColor = goldAmbient + goldDiffuse + goldSpec + goldRim;
    } else if (v_material > 1.5) {
      // MATTE EBONITE FEED
      finalColor = baseColor * (0.35 + diff1 * 0.65);
    } else {
      // POLISHED OBSIDIAN LACQUER (Badan & Pegangan)
      float spec = pow(max(dot(N, H1), 0.0), 68.0);
      vec3 amb = baseColor * 0.45;
      vec3 diff = baseColor * (diff1 * 0.45 + diff2 * 0.20);
      vec3 clearcoat = vec3(0.92, 0.96, 1.0) * spec * 1.25;
      vec3 cyanRim = vec3(0.18, 0.45, 0.85) * rim * 0.45; // Kilau biru khas NIPW
      finalColor = amb + diff + clearcoat + cyanRim;
    }

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    console.warn("Gagal kompilasi shader pena 3D:", info);
    return null;
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn("Gagal link shader program:", gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

// ==========================================================================
// KELAS RENDERER PENA 3D
// ==========================================================================

class Pen3DRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl", { antialias: true, alpha: true, depth: true }) ||
              canvas.getContext("experimental-webgl", { antialias: true, alpha: true, depth: true });
    
    if (!this.gl) {
      console.warn("WebGL tidak didukung untuk Pena 3D.");
      return;
    }

    this.initGL();
  }

  initGL() {
    const gl = this.gl;
    this.program = createProgram(gl, VERTEX_SHADER_SRC, FRAGMENT_SHADER_SRC);
    if (!this.program) return;

    // Lokasi Atribut
    this.attribs = {
      position: gl.getAttribLocation(this.program, "a_position"),
      normal: gl.getAttribLocation(this.program, "a_normal"),
      color: gl.getAttribLocation(this.program, "a_color"),
      material: gl.getAttribLocation(this.program, "a_material"),
    };

    // Lokasi Uniform
    this.uniforms = {
      mvp: gl.getUniformLocation(this.program, "u_mvp"),
      model: gl.getUniformLocation(this.program, "u_model"),
      normalMatrix: gl.getUniformLocation(this.program, "u_normalMatrix"),
      lightDir1: gl.getUniformLocation(this.program, "u_lightDir1"),
      lightDir2: gl.getUniformLocation(this.program, "u_lightDir2"),
      lightDir3: gl.getUniformLocation(this.program, "u_lightDir3"),
      cameraPos: gl.getUniformLocation(this.program, "u_cameraPos"),
    };

    // Bangun Geometri
    this.mesh = createPenMesh();

    // Buat VBO Buffers
    this.posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.mesh.positions, gl.STATIC_DRAW);

    this.normBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.mesh.normals, gl.STATIC_DRAW);

    this.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.mesh.colors, gl.STATIC_DRAW);

    this.matBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.matBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.mesh.materials, gl.STATIC_DRAW);

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indices, gl.STATIC_DRAW);

    // Matriks kerja
    this.projMatrix = mat4Create();
    this.viewMatrix = mat4Create();
    this.modelMatrix = mat4Create();
    this.mvpMatrix = mat4Create();
    this.tempMatrix = mat4Create();
    this.normalMatrix = new Float32Array(9);

    // Konfigurasi WebGL
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
  }

  resize() {
    if (!this.gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = Math.round(this.canvas.clientWidth * dpr);
    const displayHeight = Math.round(this.canvas.clientHeight * dpr);

    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
      this.gl.viewport(0, 0, displayWidth, displayHeight);
    }
  }

  render(rotX, rotY, rotZ, panX, panY, floatingY) {
    const gl = this.gl;
    if (!gl || !this.program) return;
    if (!this.canvas.clientWidth || !this.canvas.clientHeight) return;

    this.resize();
    if (this.canvas.width <= 0 || this.canvas.height <= 0) return;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = this.canvas.width / this.canvas.height;
    mat4Perspective(this.projMatrix, 42 * (Math.PI / 180), aspect, 0.1, 100.0);

    // Posisi Kamera Diam
    const cameraZ = 8.5;
    mat4Identity(this.viewMatrix);
    mat4Translate(this.viewMatrix, this.viewMatrix, 0, 0, -cameraZ);

    // Susun Model Matrix Pena (Rotasi & Translasi Interaktif)
    mat4Identity(this.modelMatrix);
    // Translasi pan hasil geser + ayunan idle floating
    mat4Translate(this.modelMatrix, this.modelMatrix, panX, panY + floatingY, 0);

    // Rotasi 3D (X = atas/bawah, Y = kanan/kiri, Z = sudut miring elegan)
    mat4RotateX(this.modelMatrix, this.modelMatrix, rotX);
    mat4RotateY(this.modelMatrix, this.modelMatrix, rotY);
    mat4RotateZ(this.modelMatrix, this.modelMatrix, rotZ);

    // Hitung MVP Matrix
    mat4Multiply(this.tempMatrix, this.viewMatrix, this.modelMatrix);
    mat4Multiply(this.mvpMatrix, this.projMatrix, this.tempMatrix);

    // Hitung Normal Matrix 3x3
    mat3NormalFromMat4(this.normalMatrix, this.modelMatrix);

    gl.useProgram(this.program);

    // Uniforms
    gl.uniformMatrix4fv(this.uniforms.mvp, false, this.mvpMatrix);
    gl.uniformMatrix4fv(this.uniforms.model, false, this.modelMatrix);
    gl.uniformMatrix3fv(this.uniforms.normalMatrix, false, this.normalMatrix);

    // Pencahayaan Studio Eksekutif
    gl.uniform3f(this.uniforms.lightDir1, 1.4, 2.2, 1.8);
    gl.uniform3f(this.uniforms.lightDir2, -1.8, -0.9, 1.2);
    gl.uniform3f(this.uniforms.lightDir3, -1.2, 1.6, -1.8);
    gl.uniform3f(this.uniforms.cameraPos, 0, 0, cameraZ);

    // Pasang Atribut Buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    gl.vertexAttribPointer(this.attribs.position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.attribs.position);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
    gl.vertexAttribPointer(this.attribs.normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.attribs.normal);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.vertexAttribPointer(this.attribs.color, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.attribs.color);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.matBuffer);
    gl.vertexAttribPointer(this.attribs.material, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.attribs.material);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.mesh.indices.length, gl.UNSIGNED_SHORT, 0);
  }

  destroy() {
    if (!this.gl) return;
    const gl = this.gl;
    if (this.posBuffer) gl.deleteBuffer(this.posBuffer);
    if (this.normBuffer) gl.deleteBuffer(this.normBuffer);
    if (this.colorBuffer) gl.deleteBuffer(this.colorBuffer);
    if (this.matBuffer) gl.deleteBuffer(this.matBuffer);
    if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);
    if (this.program) gl.deleteProgram(this.program);
    this.gl = null;
  }
}

// ==========================================================================
// LOOP UTAMA ANIMASI, FISIKA GESER, DAN KONTROL INTERAKSI
// ==========================================================================

let rendererInstance = null;

function animatePen() {
  if (!isModuleRunning) return;

  penState.time += 0.024;

  // 1. Hitung ayunan mengapung lembut (Idle Floating Oscillation)
  const idleBobY = Math.sin(penState.time * 1.5) * 0.08;
  const idleWobblePitch = Math.cos(penState.time * 1.2) * 0.025;
  const idleWobbleYaw = Math.sin(penState.time * 0.9) * 0.035;

  if (penState.isDragging) {
    // Sedang digeser pengguna: target mendekati kursor secara responsif
    penState.rotX += (penState.targetRotX - penState.rotX) * 0.35;
    penState.rotY += (penState.targetRotY - penState.rotY) * 0.35;
    penState.panX += (penState.targetPanX - penState.panX) * 0.30;
    penState.panY += (penState.targetPanY - penState.panY) * 0.30;
  } else {
    // Tidak sedang digeser: jalankan redaman momentum (inertia decay)
    penState.rotX += penState.velRotX;
    penState.rotY += penState.velRotY;
    penState.panX += penState.velPanX;
    penState.panY += penState.velPanY;

    penState.velRotX *= 0.93;
    penState.velRotY *= 0.93;
    penState.velPanX *= 0.88;
    penState.velPanY *= 0.88;

    // Geseran pan perlahan kembali ke tengah (re-center) saat diam
    penState.panX *= 0.95;
    penState.panY *= 0.95;

    // Batasi jika mendekati nol
    if (Math.abs(penState.velRotX) < 0.0001) penState.velRotX = 0;
    if (Math.abs(penState.velRotY) < 0.0001) penState.velRotY = 0;
  }

  // Sudut final dengan gabungan rotasi pengguna + ayunan mengapung
  const currentRotX = penState.rotX + (penState.isDragging ? 0 : idleWobblePitch);
  const currentRotY = penState.rotY + (penState.isDragging ? 0 : idleWobbleYaw);
  const currentRotZ = penState.rotZ;

  // Render frame
  if (rendererInstance) {
    rendererInstance.render(
      currentRotX,
      currentRotY,
      currentRotZ,
      penState.panX,
      penState.panY,
      idleBobY
    );
  }

  animationFrameId = requestAnimationFrame(animatePen);
}

// ==========================================================================
// EVENT LISTENER: GESTUR GESER KANAN, KIRI, ATAS, BAWAH (MOUSE & TOUCH)
// ==========================================================================

function setupInteractionEvents(canvas) {
  const container = canvas.parentElement;
  const hintEl = document.getElementById("pen-3d-hint");
  const resetBtn = document.getElementById("btn-reset-pena-3d");

  function hilangkanHint() {
    if (!penState.hasInteracted && hintEl) {
      penState.hasInteracted = true;
      hintEl.classList.add("fade-out");
      setTimeout(() => {
        if (hintEl) hintEl.style.display = "none";
      }, 400);
    }
  }

  // Pointer Down (Mouse Click atau Sentuhan Layar Sentuh)
  function onPointerDown(e) {
    // Hanya tangani tombol utama (klik kiri) atau touch
    if (e.pointerType === "mouse" && e.button !== 0) return;

    penState.isDragging = true;
    penState.pointerStartX = e.clientX;
    penState.pointerStartY = e.clientY;
    penState.lastPointerX = e.clientX;
    penState.lastPointerY = e.clientY;

    penState.targetRotX = penState.rotX;
    penState.targetRotY = penState.rotY;
    penState.targetPanX = penState.panX;
    penState.targetPanY = penState.panY;

    penState.velRotX = 0;
    penState.velRotY = 0;
    penState.velPanX = 0;
    penState.velPanY = 0;

    canvas.setPointerCapture?.(e.pointerId);
    canvas.style.cursor = "grabbing";
    hilangkanHint();
  }

  // Pointer Move (Geser ke Kanan, Kiri, Atas, Bawah)
  function onPointerMove(e) {
    if (!penState.isDragging) return;

    const deltaX = e.clientX - penState.lastPointerX;
    const deltaY = e.clientY - penState.lastPointerY;

    penState.lastPointerX = e.clientX;
    penState.lastPointerY = e.clientY;

    // Sensitivitas gerak geser
    const rotSpeed = 0.009;
    const panSpeed = 0.0035;

    // Geser Kanan (+deltaX) -> Rotasi ke Kanan (Yaw +)
    // Geser Kiri (-deltaX) -> Rotasi ke Kiri (Yaw -)
    // Geser Bawah (+deltaY) -> Rotasi Menunduk ke Bawah (Pitch +)
    // Geser Atas (-deltaY) -> Rotasi Mendongak ke Atas (Pitch -)
    penState.targetRotY += deltaX * rotSpeed;
    penState.targetRotX += deltaY * rotSpeed;

    // Pan pergeseran posisi 3D di layar
    penState.targetPanX += deltaX * panSpeed;
    penState.targetPanY -= deltaY * panSpeed;

    // Simpan kecepatan sesaat untuk momentum luncur (inertia)
    penState.velRotY = deltaX * rotSpeed * 0.85;
    penState.velRotX = deltaY * rotSpeed * 0.85;
    penState.velPanX = deltaX * panSpeed * 0.5;
    penState.velPanY = -deltaY * panSpeed * 0.5;
  }

  // Pointer Up / Cancel (Lepas geseran)
  function onPointerUp(e) {
    if (!penState.isDragging) return;
    penState.isDragging = false;
    canvas.style.cursor = "grab";
    try {
      canvas.releasePointerCapture?.(e.pointerId);
    } catch (_) {}
  }

  // Reset Posisi Pena ke Default Angle
  function resetPosisiPena() {
    penState.targetRotX = DEFAULT_TRANSFORM.rotX;
    penState.targetRotY = DEFAULT_TRANSFORM.rotY;
    penState.targetRotZ = DEFAULT_TRANSFORM.rotZ;
    penState.targetPanX = DEFAULT_TRANSFORM.panX;
    penState.targetPanY = DEFAULT_TRANSFORM.panY;

    // Animasikan kembali secara lembut
    const startX = penState.rotX;
    const startY = penState.rotY;
    const startPanX = penState.panX;
    const startPanY = penState.panY;
    const startTime = performance.now();
    const duration = 600; // ms

    function stepReset(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing cubic out
      const ease = 1 - Math.pow(1 - progress, 3);

      penState.rotX = startX + (DEFAULT_TRANSFORM.rotX - startX) * ease;
      penState.rotY = startY + (DEFAULT_TRANSFORM.rotY - startY) * ease;
      penState.panX = startPanX + (DEFAULT_TRANSFORM.panX - startPanX) * ease;
      penState.panY = startPanY + (DEFAULT_TRANSFORM.panY - startPanY) * ease;
      penState.velRotX = 0;
      penState.velRotY = 0;

      if (progress < 1 && !penState.isDragging) {
        requestAnimationFrame(stepReset);
      }
    }
    requestAnimationFrame(stepReset);
  }

  canvas.addEventListener("pointerdown", onPointerDown, { passive: true });
  canvas.addEventListener("pointermove", onPointerMove, { passive: true });
  canvas.addEventListener("pointerup", onPointerUp, { passive: true });
  canvas.addEventListener("pointercancel", onPointerUp, { passive: true });

  // Double click untuk reset instan
  canvas.addEventListener("dblclick", resetPosisiPena);

  // Tombol reset UI jika tersedia
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      resetPosisiPena();
    });
  }

  // Hilangkan hint otomatis saat hover container
  if (container) {
    container.addEventListener("mouseenter", () => {
      setTimeout(hilangkanHint, 3000);
    }, { once: true });
  }
}

// ==========================================================================
// INISIALISASI & CLEANUP PUBLIK
// ==========================================================================

export function initPen3D() {
  try {
    const canvas = document.getElementById("canvas-pena-3d");
    if (!canvas) return;

    // Jika sudah jalan di canvas yang sama, jangan buat ulang
    if (isModuleRunning && canvasElement === canvas && rendererInstance) {
      return;
    }

    cleanupPen3D();

    canvasElement = canvas;
    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";

    rendererInstance = new Pen3DRenderer(canvas);
    if (!rendererInstance || !rendererInstance.gl) {
      console.warn("WebGL context tidak tersedia untuk Pena 3D.");
      return;
    }

    setupInteractionEvents(canvas);

    isModuleRunning = true;
    animationFrameId = requestAnimationFrame(animatePen);

    // Tangani Resize
    window.addEventListener("resize", handleResize, { passive: true });
  } catch (err) {
    console.warn("Inisialisasi Pena 3D dilewati:", err);
  }
}

function handleResize() {
  if (rendererInstance) {
    rendererInstance.resize();
  }
}

export function cleanupPen3D() {
  isModuleRunning = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  window.removeEventListener("resize", handleResize);
  if (rendererInstance) {
    rendererInstance.destroy();
    rendererInstance = null;
  }
}

export function resetPen3D() {
  penState.rotX = DEFAULT_TRANSFORM.rotX;
  penState.rotY = DEFAULT_TRANSFORM.rotY;
  penState.rotZ = DEFAULT_TRANSFORM.rotZ;
  penState.panX = DEFAULT_TRANSFORM.panX;
  penState.panY = DEFAULT_TRANSFORM.panY;
  penState.velRotX = 0;
  penState.velRotY = 0;
}

