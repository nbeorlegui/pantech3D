import "./style.css";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const canvas = document.querySelector("#webgl");

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050816, 0.045);

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(
  40,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 0.3, 10);
scene.add(camera);

/* =========================================================
   HELPERS
========================================================= */

const glassMaterial = (
  color = 0x101b3a,
  opacity = 0.48,
  transmission = 0.25
) =>
  new THREE.MeshPhysicalMaterial({
    color,
    transparent: true,
    opacity,
    roughness: 0.15,
    metalness: 0.3,
    transmission,
    clearcoat: 1,
    clearcoatRoughness: 0.15,
  });

const metalMaterial = (color = 0x0d1530) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: 0.24,
    metalness: 0.86,
  });

const glowMaterial = (color = 0x2b8cff, intensity = 1.5) =>
  new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    metalness: 0.4,
    roughness: 0.2,
  });

function makePanelTexture(type = "dashboard") {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 640;
  const ctx = c.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, 1024, 640);
  grad.addColorStop(0, "#081226");
  grad.addColorStop(1, "#0b1d44");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 640);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 80);
    ctx.lineTo(1024, i * 80);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "bold 36px Inter, sans-serif";

  if (type === "dashboard") {
    ctx.fillText("Resumen", 42, 56);

    const cards = [
      { x: 42, y: 90, w: 250, h: 120, title: "Ventas", value: "$248,450" },
      { x: 320, y: 90, w: 250, h: 120, title: "Pedidos", value: "2,560" },
      { x: 598, y: 90, w: 250, h: 120, title: "Leads", value: "1,246" },
    ];

    cards.forEach((card) => {
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      roundRect(ctx, card.x, card.y, card.w, card.h, 20, true, false);
      ctx.fillStyle = "rgba(255,255,255,0.66)";
      ctx.font = "26px Inter, sans-serif";
      ctx.fillText(card.title, card.x + 18, card.y + 34);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 40px Inter, sans-serif";
      ctx.fillText(card.value, card.x + 18, card.y + 82);
    });

    // barras
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    roundRect(ctx, 42, 260, 490, 300, 24, true, false);
    ctx.fillStyle = "#8cc9ff";
    ctx.font = "26px Inter, sans-serif";
    ctx.fillText("Performance", 64, 300);

    const barX = 84;
    const barBaseY = 520;
    const barHeights = [80, 140, 110, 190, 150, 230, 180];
    barHeights.forEach((h, i) => {
      const x = barX + i * 56;
      const barGrad = ctx.createLinearGradient(0, barBaseY - h, 0, barBaseY);
      barGrad.addColorStop(0, "#63e4ff");
      barGrad.addColorStop(1, "#376dff");
      ctx.fillStyle = barGrad;
      roundRect(ctx, x, barBaseY - h, 34, h, 10, true, false);
    });

    // línea
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    roundRect(ctx, 560, 260, 420, 300, 24, true, false);
    ctx.fillStyle = "#8cc9ff";
    ctx.font = "26px Inter, sans-serif";
    ctx.fillText("Tendencia", 584, 300);

    const points = [
      [590, 470],
      [640, 430],
      [690, 450],
      [740, 360],
      [790, 390],
      [840, 310],
      [900, 260],
      [950, 220],
    ];

    ctx.strokeStyle = "#6bd8ff";
    ctx.lineWidth = 5;
    ctx.beginPath();
    points.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    points.forEach(([x, y]) => {
      ctx.fillStyle = "#7f7cff";
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#b6eeff";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (type === "code") {
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = "bold 34px Inter, sans-serif";
    ctx.fillText("AI Response", 42, 56);

    const lines = [
      'status: "success"',
      'intent: "lead_qualification"',
      'score: 0.92',
      'channel: "whatsapp"',
      'action: "assign_operator"',
      'automation: true',
    ];

    ctx.font = "30px monospace";
    lines.forEach((line, i) => {
      ctx.fillStyle = i % 2 === 0 ? "#63e4ff" : "#8c5bff";
      ctx.fillText(line, 54, 132 + i * 66);
    });
  }

  if (type === "mini") {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px Inter, sans-serif";
    ctx.fillText("Crecimiento", 32, 52);

    ctx.strokeStyle = "#63e4ff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(30, 150);
    ctx.lineTo(80, 120);
    ctx.lineTo(140, 140);
    ctx.lineTo(210, 90);
    ctx.lineTo(280, 110);
    ctx.lineTo(360, 60);
    ctx.stroke();

    [30, 80, 140, 210, 280, 360].forEach((x, i) => {
      const y = [150, 120, 140, 90, 110, 60][i];
      ctx.fillStyle = "#8c5bff";
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "#7ee8ff";
    ctx.font = "bold 54px Inter, sans-serif";
    ctx.fillText("+24,8%", 32, 238);
  }

  const texture = new THREE.CanvasTexture(c);
  texture.needsUpdate = true;
  return texture;
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof radius === "number") {
    radius = {
      tl: radius,
      tr: radius,
      br: radius,
      bl: radius,
    };
  }

  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();

  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/* =========================================================
   LIGHTS
========================================================= */

const ambientLight = new THREE.AmbientLight(0xbfd8ff, 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xa7c7ff, 1.3);
dirLight.position.set(4, 6, 4);
scene.add(dirLight);

const blueLight = new THREE.PointLight(0x2b8cff, 18, 20, 2);
blueLight.position.set(2.5, 2, 2);
scene.add(blueLight);

const violetLight = new THREE.PointLight(0x8c5bff, 18, 24, 2);
violetLight.position.set(-2, 3, -10);
scene.add(violetLight);

const cyanLight = new THREE.PointLight(0x63e4ff, 12, 24, 2);
cyanLight.position.set(1.5, 2, -22);
scene.add(cyanLight);

/* =========================================================
   BACKGROUND PARTICLES
========================================================= */

function createParticles() {
  const count = 2200;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 24;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 2] = -Math.random() * 50 + 8;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x68c7ff,
    size: 0.03,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  return points;
}

const particles = createParticles();

/* =========================================================
   HERO GLOW / RINGS
========================================================= */

const world = new THREE.Group();
scene.add(world);

function createRing(radius = 1.4, tube = 0.04, color = 0x2b8cff) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 16, 120),
    glowMaterial(color, 2.1)
  );
  ring.rotation.x = Math.PI / 2;
  return ring;
}

/* =========================================================
   LAPTOP
========================================================= */

function createLaptop() {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(3.3, 0.18, 2.2),
    metalMaterial(0x0d1530)
  );
  base.position.y = -0.62;
  group.add(base);

  const keyboard = new THREE.Mesh(
    new THREE.BoxGeometry(2.45, 0.04, 1.35),
    glassMaterial(0x0d204d, 0.55, 0.1)
  );
  keyboard.position.set(0, -0.49, 0.12);
  group.add(keyboard);

  const trackpad = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.015, 0.42),
    glassMaterial(0x30446f, 0.65, 0.1)
  );
  trackpad.position.set(0, -0.46, 0.65);
  group.add(trackpad);

  const hingeGroup = new THREE.Group();
  hingeGroup.position.set(0, -0.54, -0.95);
  hingeGroup.rotation.x = -0.23;

  const screenShell = new THREE.Mesh(
    new THREE.BoxGeometry(2.95, 1.82, 0.08),
    metalMaterial(0x111b38)
  );
  screenShell.position.y = 1.0;
  hingeGroup.add(screenShell);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.72, 1.58),
    new THREE.MeshBasicMaterial({
      map: makePanelTexture("dashboard"),
      transparent: true,
    })
  );
  screen.position.set(0, 1.0, 0.05);
  hingeGroup.add(screen);

  group.add(hingeGroup);

  const ring = createRing(1.6, 0.035, 0x2b8cff);
  ring.position.y = -0.82;
  group.add(ring);

  const ring2 = createRing(1.9, 0.018, 0x8c5bff);
  ring2.position.y = -0.82;
  ring2.scale.set(1.15, 1.15, 1.15);
  group.add(ring2);

  const miniPanel1 = new THREE.Mesh(
    new THREE.PlaneGeometry(1.45, 0.9),
    new THREE.MeshBasicMaterial({
      map: makePanelTexture("mini"),
      transparent: true,
    })
  );
  miniPanel1.position.set(-2.0, 1.3, 0.3);
  miniPanel1.rotation.y = 0.25;
  group.add(miniPanel1);

  const miniPanel2 = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.0),
    new THREE.MeshBasicMaterial({
      map: makePanelTexture("code"),
      transparent: true,
    })
  );
  miniPanel2.position.set(2.15, 0.6, -0.1);
  miniPanel2.rotation.y = -0.34;
  group.add(miniPanel2);

  group.position.set(1.4, 0.1, -6.5);

  return {
    group,
    screen,
    ring,
    ring2,
    miniPanel1,
    miniPanel2,
  };
}

const laptop = createLaptop();
world.add(laptop.group);

/* =========================================================
   ROBOT IA
========================================================= */

function createRobot() {
  const group = new THREE.Group();

  const bodyMat = glassMaterial(0x121d45, 0.7, 0.22);
  const eyeMat = glowMaterial(0x63e4ff, 3);
  const accentMat = glowMaterial(0x8c5bff, 2.4);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 32), bodyMat);
  body.scale.set(1, 1.05, 0.9);
  body.position.y = 0.4;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(1.02, 32, 32), bodyMat);
  head.scale.y = 0.92;
  head.position.y = 2.0;
  group.add(head);

  const facePlate = new THREE.Mesh(
    new THREE.PlaneGeometry(1.25, 0.75),
    new THREE.MeshBasicMaterial({
      color: 0x081226,
      transparent: true,
      opacity: 0.82,
    })
  );
  facePlate.position.set(0, 1.98, 0.8);
  group.add(facePlate);

  const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 24), eyeMat);
  const eyeRight = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 24), eyeMat);
  eyeLeft.position.set(-0.28, 2.02, 0.9);
  eyeRight.position.set(0.28, 2.02, 0.9);
  group.add(eyeLeft, eyeRight);

  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.03, 12, 48, Math.PI),
    accentMat
  );
  mouth.position.set(0, 1.8, 0.88);
  mouth.rotation.z = Math.PI;
  group.add(mouth);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.25, 24),
    metalMaterial(0x24385f)
  );
  neck.position.y = 1.2;
  group.add(neck);

  const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.95, 24);
  const armLeft = new THREE.Mesh(armGeo, metalMaterial(0x24385f));
  const armRight = new THREE.Mesh(armGeo, metalMaterial(0x24385f));
  armLeft.position.set(-0.95, 0.7, 0);
  armRight.position.set(0.95, 0.7, 0);
  armLeft.rotation.z = -0.4;
  armRight.rotation.z = 0.4;
  group.add(armLeft, armRight);

  const handLeft = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), accentMat);
  const handRight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), accentMat);
  handLeft.position.set(-1.15, 0.28, 0);
  handRight.position.set(1.15, 0.28, 0);
  group.add(handLeft, handRight);

  const legGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.8, 24);
  const legLeft = new THREE.Mesh(legGeo, metalMaterial(0x24385f));
  const legRight = new THREE.Mesh(legGeo, metalMaterial(0x24385f));
  legLeft.position.set(-0.3, -0.48, 0);
  legRight.position.set(0.3, -0.48, 0);
  group.add(legLeft, legRight);

  const footLeft = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 20, 20),
    glowMaterial(0x2b8cff, 1.6)
  );
  const footRight = footLeft.clone();
  footLeft.position.set(-0.3, -0.98, 0.12);
  footRight.position.set(0.3, -0.98, 0.12);
  footLeft.scale.set(1.2, 0.6, 1.6);
  footRight.scale.set(1.2, 0.6, 1.6);
  group.add(footLeft, footRight);

  const halo = createRing(1.7, 0.03, 0x8c5bff);
  halo.position.y = 0.2;
  halo.rotation.x = Math.PI / 2.4;
  group.add(halo);

  const baseRing = createRing(1.55, 0.028, 0x2b8cff);
  baseRing.position.y = -1.05;
  group.add(baseRing);

  const infoPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(1.85, 1.05),
    new THREE.MeshBasicMaterial({
      map: makePanelTexture("code"),
      transparent: true,
    })
  );
  infoPanel.position.set(2.15, 1.25, 0.15);
  infoPanel.rotation.y = -0.42;
  group.add(infoPanel);

  group.position.set(-1.35, -0.1, -15.5);

  return {
    group,
    halo,
    baseRing,
    eyeLeft,
    eyeRight,
    infoPanel,
  };
}

const robot = createRobot();
world.add(robot.group);

/* =========================================================
   DATA VIZ
========================================================= */

function createDataSection() {
  const group = new THREE.Group();
  const bars = [];
  const sparkDots = [];

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(5.8, 3.5, 0.12),
    glassMaterial(0x0c1836, 0.5, 0.18)
  );
  board.position.set(0, 1.15, 0);
  group.add(board);

  const innerPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(5.35, 3.05),
    new THREE.MeshBasicMaterial({
      map: makePanelTexture("dashboard"),
      transparent: true,
    })
  );
  innerPanel.position.set(0, 1.15, 0.08);
  group.add(innerPanel);

  const barGroup = new THREE.Group();
  barGroup.position.set(-1.75, -0.1, 0.2);
  group.add(barGroup);

  const barMaterial = glowMaterial(0x2b8cff, 2.2);

  for (let i = 0; i < 8; i++) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 1, 0.28),
      barMaterial.clone()
    );
    mesh.position.x = i * 0.42;
    mesh.position.y = 0.4;
    barGroup.add(mesh);

    const state = { value: 0.4 + Math.random() * 1.8 };
    bars.push({ mesh, state });

    gsap.to(state, {
      value: 0.4 + Math.random() * 2.4,
      duration: 1.2 + i * 0.12,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      repeatRefresh: true,
    });
  }

  // línea + puntos
  const linePoints = [
    new THREE.Vector3(0.9, 0.65, 0.15),
    new THREE.Vector3(1.35, 0.95, 0.15),
    new THREE.Vector3(1.78, 0.82, 0.15),
    new THREE.Vector3(2.18, 1.25, 0.15),
    new THREE.Vector3(2.58, 1.18, 0.15),
    new THREE.Vector3(2.98, 1.55, 0.15),
    new THREE.Vector3(3.38, 1.92, 0.15),
  ];

  const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
  const line = new THREE.Line(
    lineGeo,
    new THREE.LineBasicMaterial({
      color: 0x63e4ff,
      transparent: true,
      opacity: 0.95,
    })
  );
  group.add(line);

  linePoints.forEach((point, i) => {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 16, 16),
      glowMaterial(i % 2 === 0 ? 0x63e4ff : 0x8c5bff, 2.6)
    );
    dot.position.copy(point);
    group.add(dot);
    sparkDots.push(dot);

    gsap.to(dot.material, {
      emissiveIntensity: 4,
      duration: 0.45 + i * 0.08,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  });

  const sideScreen = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 3.0, 0.12),
    glassMaterial(0x0e1836, 0.48, 0.18)
  );
  sideScreen.position.set(3.8, 0.95, 0.3);
  sideScreen.rotation.y = -0.24;
  group.add(sideScreen);

  const sideContent = new THREE.Mesh(
    new THREE.PlaneGeometry(1.75, 2.72),
    new THREE.MeshBasicMaterial({
      map: makePanelTexture("mini"),
      transparent: true,
    })
  );
  sideContent.position.set(3.83, 0.95, 0.39);
  sideContent.rotation.y = -0.24;
  group.add(sideContent);

  const floorRing = createRing(2.9, 0.03, 0x2b8cff);
  floorRing.position.y = -0.78;
  group.add(floorRing);

  const floorRing2 = createRing(3.2, 0.018, 0x8c5bff);
  floorRing2.position.y = -0.78;
  group.add(floorRing2);

  group.position.set(1.25, -0.35, -25);

  return {
    group,
    innerPanel,
    bars,
    floorRing,
    floorRing2,
    sparkDots,
  };
}

const dataViz = createDataSection();
world.add(dataViz.group);

/* =========================================================
   FINAL SYMBOL
========================================================= */

function createFinalTotem() {
  const group = new THREE.Group();

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.2, 0),
    glassMaterial(0x14255a, 0.52, 0.25)
  );
  group.add(core);

  const ring = createRing(1.8, 0.03, 0x63e4ff);
  group.add(ring);

  const ring2 = createRing(2.2, 0.018, 0x8c5bff);
  ring2.rotation.x = Math.PI / 2.8;
  group.add(ring2);

  group.position.set(0, 0.4, -36);

  return { group, core, ring, ring2 };
}

const finalTotem = createFinalTotem();
world.add(finalTotem.group);

/* =========================================================
   CAMERA STORY / SCROLL
========================================================= */

const cameraState = {
  x: 0,
  y: 0.35,
  z: 10,
  tx: 0,
  ty: 0,
  tz: 0,
};

const masterTl = gsap.timeline({
  defaults: { ease: "power2.inOut" },
  scrollTrigger: {
    trigger: document.body,
    start: "top top",
    end: "bottom bottom",
    scrub: 1.2,
  },
});

// Hero
masterTl.to(
  cameraState,
  {
    x: 0.2,
    y: 0.25,
    z: 8,
    tx: 1.1,
    ty: 0.4,
    tz: -5.8,
    duration: 1,
  },
  0
);

// Acercamiento a la notebook
masterTl.to(
  cameraState,
  {
    x: 1.2,
    y: 0.15,
    z: 4.8,
    tx: 1.35,
    ty: 0.75,
    tz: -6.5,
    duration: 1,
  },
  1
);

// "Entrar" en la pantalla y salir hacia IA
masterTl.to(
  cameraState,
  {
    x: 1.25,
    y: 0.22,
    z: -7.4,
    tx: 1.2,
    ty: 1.0,
    tz: -9.8,
    duration: 1,
  },
  2
);

// Llegada al robot
masterTl.to(
  cameraState,
  {
    x: -1.25,
    y: 0.5,
    z: -12.4,
    tx: -1.3,
    ty: 1.2,
    tz: -15.4,
    duration: 1,
  },
  3
);

// Salida hacia data
masterTl.to(
  cameraState,
  {
    x: 0.5,
    y: 0.3,
    z: -19,
    tx: 0.8,
    ty: 0.7,
    tz: -22.5,
    duration: 1,
  },
  4
);

// Data viz
masterTl.to(
  cameraState,
  {
    x: 1.45,
    y: 0.35,
    z: -21.5,
    tx: 1.35,
    ty: 0.65,
    tz: -25,
    duration: 1,
  },
  5
);

// Cierre
masterTl.to(
  cameraState,
  {
    x: 0,
    y: 0.55,
    z: -31.5,
    tx: 0,
    ty: 0.4,
    tz: -36,
    duration: 1,
  },
  6
);

/* =========================================================
   HTML SECTION APPEAR
========================================================= */

document.querySelectorAll(".panel__content").forEach((el) => {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: el.parentElement,
      start: "top 68%",
      end: "top 35%",
      toggleActions: "play none none reverse",
    },
  });
});

/* =========================================================
   MICRO ANIMATIONS
========================================================= */

gsap.to(laptop.miniPanel1.rotation, {
  y: laptop.miniPanel1.rotation.y + 0.08,
  duration: 2.8,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut",
});

gsap.to(laptop.miniPanel2.rotation, {
  y: laptop.miniPanel2.rotation.y - 0.08,
  duration: 3.2,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut",
});

gsap.to(robot.infoPanel.rotation, {
  y: robot.infoPanel.rotation.y - 0.08,
  duration: 2.6,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut",
});

/* =========================================================
   RENDER LOOP
========================================================= */

const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();

  particles.rotation.y = elapsed * 0.012;

  // laptop
  laptop.group.position.y = 0.1 + Math.sin(elapsed * 1.2) * 0.08;
  laptop.group.rotation.y = Math.sin(elapsed * 0.6) * 0.08;
  laptop.ring.rotation.z = elapsed * 0.7;
  laptop.ring2.rotation.z = -elapsed * 0.5;

  // robot
  robot.group.position.y = -0.1 + Math.sin(elapsed * 1.35) * 0.11;
  robot.halo.rotation.z = elapsed * 0.8;
  robot.baseRing.rotation.z = -elapsed * 0.65;
  robot.eyeLeft.scale.setScalar(1 + Math.sin(elapsed * 3.6) * 0.08);
  robot.eyeRight.scale.setScalar(1 + Math.sin(elapsed * 3.6 + 0.4) * 0.08);

  // data
  dataViz.group.position.y = -0.35 + Math.sin(elapsed * 1.1) * 0.06;
  dataViz.floorRing.rotation.z = elapsed * 0.7;
  dataViz.floorRing2.rotation.z = -elapsed * 0.5;

  dataViz.bars.forEach(({ mesh, state }) => {
    mesh.scale.y = state.value;
    mesh.position.y = -0.15 + state.value / 2;
  });

  // final
  finalTotem.group.rotation.y = elapsed * 0.25;
  finalTotem.ring.rotation.z = elapsed * 0.5;
  finalTotem.ring2.rotation.z = -elapsed * 0.35;
  finalTotem.group.position.y = 0.4 + Math.sin(elapsed * 1.2) * 0.12;

  // lights
  blueLight.position.x = 2.5 + Math.sin(elapsed * 0.8) * 0.7;
  violetLight.position.z = -10 + Math.sin(elapsed * 0.6) * 1.2;
  cyanLight.position.x = 1.5 + Math.sin(elapsed * 1.1) * 0.5;

  // camera
  camera.position.set(cameraState.x, cameraState.y, cameraState.z);
  camera.lookAt(cameraState.tx, cameraState.ty, cameraState.tz);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

/* =========================================================
   RESIZE
========================================================= */

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  ScrollTrigger.refresh();
});