"use client";

import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

const Colors = {
  red: 0xf25346,
  yellow: 0xedeb27,
  white: 0xd8d0d1,
  brown: 0x59332e,
  pink: 0xf5986e,
  brownDark: 0x23190f,
  blue: 0x68c3c0,
  green: 0x458248,
  purple: 0x551a8b,
  lightgreen: 0x629265,
};

const petalColors = [Colors.red, Colors.yellow, Colors.blue];

// Land class
class Land {
  mesh: THREE.Mesh;
  constructor() {
    const geom = new THREE.CylinderGeometry(600, 600, 1700, 40, 10);
    geom.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshPhongMaterial({
      color: Colors.lightgreen,
      flatShading: true,
    });
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.receiveShadow = true;
  }
}

// Orbit class
class Orbit {
  mesh: THREE.Object3D;
  constructor() {
    this.mesh = new THREE.Object3D();
  }
}

// Sun class
class Sun {
  mesh: THREE.Object3D;
  constructor() {
    this.mesh = new THREE.Object3D();
    const sunGeom = new THREE.SphereGeometry(400, 20, 10);
    const sunMat = new THREE.MeshPhongMaterial({
      color: Colors.yellow,
      flatShading: true,
    });
    const sun = new THREE.Mesh(sunGeom, sunMat);
    sun.castShadow = false;
    sun.receiveShadow = false;
    this.mesh.add(sun);
  }
}

// Cloud class
class Cloud {
  mesh: THREE.Object3D;
  constructor() {
    this.mesh = new THREE.Object3D();
    const geom = new THREE.DodecahedronGeometry(20, 0);
    const mat = new THREE.MeshPhongMaterial({
      color: Colors.white,
    });

    const nBlocs = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < nBlocs; i++) {
      const m = new THREE.Mesh(geom, mat);
      m.position.x = i * 15;
      m.position.y = Math.random() * 10;
      m.position.z = Math.random() * 10;
      m.rotation.z = Math.random() * Math.PI * 2;
      m.rotation.y = Math.random() * Math.PI * 2;

      const s = 0.1 + Math.random() * 0.9;
      m.scale.set(s, s, s);
      this.mesh.add(m);
    }
  }
}

// Sky class
class Sky {
  mesh: THREE.Object3D;
  nClouds: number;
  constructor() {
    this.mesh = new THREE.Object3D();
    this.nClouds = 25;
    const stepAngle = (Math.PI * 2) / this.nClouds;

    for (let i = 0; i < this.nClouds; i++) {
      const c = new Cloud();
      const a = stepAngle * i;
      const h = 800 + Math.random() * 200;
      c.mesh.position.y = Math.sin(a) * h;
      c.mesh.position.x = Math.cos(a) * h;
      c.mesh.rotation.z = a + Math.PI / 2;
      c.mesh.position.z = -400 - Math.random() * 400;

      const s = 1 + Math.random() * 2;
      c.mesh.scale.set(s, s, s);
      this.mesh.add(c.mesh);
    }
  }
}

// Tree class
class Tree {
  mesh: THREE.Object3D;
  constructor() {
    this.mesh = new THREE.Object3D();

    const matTreeLeaves = new THREE.MeshPhongMaterial({
      color: Colors.green,
      flatShading: true,
    });

    const geonTreeBase = new THREE.BoxGeometry(10, 20, 10);
    const matTreeBase = new THREE.MeshBasicMaterial({ color: Colors.brown });
    const treeBase = new THREE.Mesh(geonTreeBase, matTreeBase);
    treeBase.castShadow = true;
    treeBase.receiveShadow = true;
    this.mesh.add(treeBase);

    const geomTreeLeaves1 = new THREE.ConeGeometry(12 * 3, 12 * 3, 4);
    const treeLeaves1 = new THREE.Mesh(geomTreeLeaves1, matTreeLeaves);
    treeLeaves1.castShadow = true;
    treeLeaves1.receiveShadow = true;
    treeLeaves1.position.y = 20;
    this.mesh.add(treeLeaves1);

    const geomTreeLeaves2 = new THREE.ConeGeometry(9 * 3, 9 * 3, 4);
    const treeLeaves2 = new THREE.Mesh(geomTreeLeaves2, matTreeLeaves);
    treeLeaves2.castShadow = true;
    treeLeaves2.position.y = 40;
    treeLeaves2.receiveShadow = true;
    this.mesh.add(treeLeaves2);

    const geomTreeLeaves3 = new THREE.ConeGeometry(6 * 3, 6 * 3, 4);
    const treeLeaves3 = new THREE.Mesh(geomTreeLeaves3, matTreeLeaves);
    treeLeaves3.castShadow = true;
    treeLeaves3.position.y = 55;
    treeLeaves3.receiveShadow = true;
    this.mesh.add(treeLeaves3);
  }
}

// Flower class
class Flower {
  mesh: THREE.Object3D;
  constructor() {
    this.mesh = new THREE.Object3D();

    const geomStem = new THREE.BoxGeometry(5, 50, 5);
    const matStem = new THREE.MeshPhongMaterial({
      color: Colors.green,
      flatShading: true,
    });
    const stem = new THREE.Mesh(geomStem, matStem);
    stem.castShadow = false;
    stem.receiveShadow = true;
    this.mesh.add(stem);

    const geomPetalCore = new THREE.BoxGeometry(10, 10, 10);
    const matPetalCore = new THREE.MeshPhongMaterial({
      color: Colors.yellow,
      flatShading: true,
    });
    const petalCore = new THREE.Mesh(geomPetalCore, matPetalCore);
    petalCore.castShadow = false;
    petalCore.receiveShadow = true;

    const petalColor = petalColors[Math.floor(Math.random() * 3)];

    const geomPetal = new THREE.BoxGeometry(15, 20, 5);
    const matPetal = new THREE.MeshBasicMaterial({ color: petalColor });

    const petals = [];
    for (let i = 0; i < 4; i++) {
      const petal = new THREE.Mesh(geomPetal, matPetal);
      petal.position.x = 12.5;
      petal.rotation.z = (i * Math.PI) / 2;
      petal.castShadow = true;
      petal.receiveShadow = true;
      petals.push(petal);
    }

    petalCore.add(...petals);
    petalCore.position.y = 25;
    petalCore.position.z = 3;
    this.mesh.add(petalCore);
  }
}

// Forest class
class Forest {
  mesh: THREE.Object3D;
  nTrees: number;
  nFlowers: number;
  constructor() {
    this.mesh = new THREE.Object3D();
    this.nTrees = 300;
    this.nFlowers = 350;

    let stepAngle = (Math.PI * 2) / this.nTrees;

    for (let i = 0; i < this.nTrees; i++) {
      const t = new Tree();
      const a = stepAngle * i;
      const h = 605;
      t.mesh.position.y = Math.sin(a) * h;
      t.mesh.position.x = Math.cos(a) * h;
      t.mesh.rotation.z = a + (Math.PI / 2) * 3;
      t.mesh.position.z = 0 - Math.random() * 600;

      const s = 0.3 + Math.random() * 0.75;
      t.mesh.scale.set(s, s, s);
      this.mesh.add(t.mesh);
    }

    stepAngle = (Math.PI * 2) / this.nFlowers;

    for (let i = 0; i < this.nFlowers; i++) {
      const f = new Flower();
      const a = stepAngle * i;
      const h = 605;
      f.mesh.position.y = Math.sin(a) * h;
      f.mesh.position.x = Math.cos(a) * h;
      f.mesh.rotation.z = a + (Math.PI / 2) * 3;
      f.mesh.position.z = 0 - Math.random() * 600;

      const s = 0.1 + Math.random() * 0.3;
      f.mesh.scale.set(s, s, s);
      this.mesh.add(f.mesh);
    }
  }
}

// AirPlane class
class AirPlane {
  mesh: THREE.Object3D;
  propeller: THREE.Mesh;
  constructor() {
    this.mesh = new THREE.Object3D();

    // Create the cabin
    const geomCockpit = new THREE.BoxGeometry(80, 50, 50);
    const matCockpit = new THREE.MeshPhongMaterial({
      color: Colors.red,
      flatShading: true,
    });
    const cockpit = new THREE.Mesh(geomCockpit, matCockpit);
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    this.mesh.add(cockpit);

    // Create the engine
    const geomEngine = new THREE.BoxGeometry(20, 50, 50);
    const matEngine = new THREE.MeshPhongMaterial({
      color: Colors.white,
      flatShading: true,
    });
    const engine = new THREE.Mesh(geomEngine, matEngine);
    engine.position.x = 40;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);

    // Create the tail
    const geomTailPlane = new THREE.BoxGeometry(15, 20, 5);
    const matTailPlane = new THREE.MeshPhongMaterial({
      color: Colors.red,
      flatShading: true,
    });
    const tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
    tailPlane.position.set(-35, 25, 0);
    tailPlane.castShadow = true;
    tailPlane.receiveShadow = true;
    this.mesh.add(tailPlane);

    // Create the wing
    const geomSideWing = new THREE.BoxGeometry(40, 4, 150);
    const matSideWing = new THREE.MeshPhongMaterial({
      color: Colors.red,
      flatShading: true,
    });

    const sideWingTop = new THREE.Mesh(geomSideWing, matSideWing);
    const sideWingBottom = new THREE.Mesh(geomSideWing, matSideWing);
    sideWingTop.castShadow = true;
    sideWingTop.receiveShadow = true;
    sideWingBottom.castShadow = true;
    sideWingBottom.receiveShadow = true;

    sideWingTop.position.set(20, 12, 0);
    sideWingBottom.position.set(20, -3, 0);
    this.mesh.add(sideWingTop);
    this.mesh.add(sideWingBottom);

    const geomWindshield = new THREE.BoxGeometry(3, 15, 20);
    const matWindshield = new THREE.MeshPhongMaterial({
      color: Colors.white,
      transparent: true,
      opacity: 0.3,
      flatShading: true,
    });
    const windshield = new THREE.Mesh(geomWindshield, matWindshield);
    windshield.position.set(5, 27, 0);
    windshield.castShadow = true;
    windshield.receiveShadow = true;
    this.mesh.add(windshield);

    const geomPropeller = new THREE.BoxGeometry(20, 10, 10);
    const matPropeller = new THREE.MeshPhongMaterial({
      color: Colors.brown,
      flatShading: true,
    });
    this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
    this.propeller.castShadow = true;
    this.propeller.receiveShadow = true;

    const geomBlade1 = new THREE.BoxGeometry(1, 100, 10);
    const geomBlade2 = new THREE.BoxGeometry(1, 10, 100);
    const matBlade = new THREE.MeshPhongMaterial({
      color: Colors.brownDark,
      flatShading: true,
    });

    const blade1 = new THREE.Mesh(geomBlade1, matBlade);
    blade1.position.set(8, 0, 0);
    blade1.castShadow = true;
    blade1.receiveShadow = true;

    const blade2 = new THREE.Mesh(geomBlade2, matBlade);
    blade2.position.set(8, 0, 0);
    blade2.castShadow = true;
    blade2.receiveShadow = true;
    this.propeller.add(blade1, blade2);
    this.propeller.position.set(50, 0, 0);
    this.mesh.add(this.propeller);

    const wheelProtecGeom = new THREE.BoxGeometry(30, 15, 10);
    const wheelProtecMat = new THREE.MeshPhongMaterial({
      color: Colors.white,
      flatShading: true,
    });
    const wheelProtecR = new THREE.Mesh(wheelProtecGeom, wheelProtecMat);
    wheelProtecR.position.set(25, -20, 25);
    this.mesh.add(wheelProtecR);

    const wheelTireGeom = new THREE.BoxGeometry(24, 24, 4);
    const wheelTireMat = new THREE.MeshPhongMaterial({
      color: Colors.brownDark,
      flatShading: true,
    });
    const wheelTireR = new THREE.Mesh(wheelTireGeom, wheelTireMat);
    wheelTireR.position.set(25, -28, 25);

    const wheelAxisGeom = new THREE.BoxGeometry(10, 10, 6);
    const wheelAxisMat = new THREE.MeshPhongMaterial({
      color: Colors.brown,
      flatShading: true,
    });
    const wheelAxis = new THREE.Mesh(wheelAxisGeom, wheelAxisMat);
    wheelTireR.add(wheelAxis);
    this.mesh.add(wheelTireR);

    const wheelProtecL = wheelProtecR.clone();
    wheelProtecL.position.z = -wheelProtecR.position.z;
    this.mesh.add(wheelProtecL);

    const wheelTireL = wheelTireR.clone();
    wheelTireL.position.z = -wheelTireR.position.z;
    this.mesh.add(wheelTireL);

    const wheelTireB = wheelTireR.clone();
    wheelTireB.scale.set(0.5, 0.5, 0.5);
    wheelTireB.position.set(-35, -5, 0);
    this.mesh.add(wheelTireB);

    const suspensionGeom = new THREE.BoxGeometry(4, 20, 4);
    const suspensionMat = new THREE.MeshPhongMaterial({
      color: Colors.red,
      flatShading: true,
    });
    const suspension = new THREE.Mesh(suspensionGeom, suspensionMat);
    suspension.position.set(-35, 5, 0);
    suspension.rotation.z = -0.3;
    this.mesh.add(suspension);
  }
}

function normalize(
  v: number,
  vmin: number,
  vmax: number,
  tmin: number,
  tmax: number
): number {
  const nv = Math.max(Math.min(v, vmax), vmin);
  const dv = vmax - vmin;
  const pc = (nv - vmin) / dv;
  const dt = tmax - tmin;
  const tv = tmin + pc * dt;
  return tv;
}

export default function PolyWorldBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  // World objects
  const landRef = useRef<Land | null>(null);
  const skyRef = useRef<Sky | null>(null);
  const forestRef = useRef<Forest | null>(null);
  const orbitRef = useRef<Orbit | null>(null);
  const airplaneRef = useRef<AirPlane | null>(null);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!containerRef.current) return;
    const tx = -1 + (event.clientX / window.innerWidth) * 2;
    const ty = 1 - (event.clientY / window.innerHeight) * 2;
    mouseRef.current = { x: tx, y: ty };
  }, []);

  const handleResize = useCallback(() => {
    if (!cameraRef.current || !rendererRef.current) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    rendererRef.current.setSize(width, height);
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const WIDTH = window.innerWidth;
    const HEIGHT = window.innerHeight;
    const offSet = -600;

    // Create scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 1, 10000);
    camera.position.set(0, 150, 100);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create lights
    const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);
    scene.add(hemisphereLight);

    const shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);
    shadowLight.position.set(0, 350, 350);
    shadowLight.castShadow = true;
    shadowLight.shadow.camera.left = -650;
    shadowLight.shadow.camera.right = 650;
    shadowLight.shadow.camera.top = 650;
    shadowLight.shadow.camera.bottom = -650;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;
    scene.add(shadowLight);

    // Create sun
    const sun = new Sun();
    sun.mesh.scale.set(1, 1, 0.3);
    sun.mesh.position.set(0, -30, -850);
    scene.add(sun.mesh);

    // Create orbit
    const orbit = new Orbit();
    orbit.mesh.position.y = offSet;
    orbit.mesh.rotation.z = -Math.PI / 6;
    scene.add(orbit.mesh);
    orbitRef.current = orbit;

    // Create land
    const land = new Land();
    land.mesh.position.y = offSet;
    scene.add(land.mesh);
    landRef.current = land;

    // Create forest
    const forest = new Forest();
    forest.mesh.position.y = offSet;
    scene.add(forest.mesh);
    forestRef.current = forest;

    // Create sky
    const sky = new Sky();
    sky.mesh.position.y = offSet;
    scene.add(sky.mesh);
    skyRef.current = sky;

    // Create airplane
    const airplane = new AirPlane();
    airplane.mesh.scale.set(0.35, 0.35, 0.35);
    airplane.mesh.position.set(-40, 110, -250);
    scene.add(airplane.mesh);
    airplaneRef.current = airplane;

    // Animation loop
    const animate = () => {
      if (
        !landRef.current ||
        !orbitRef.current ||
        !skyRef.current ||
        !forestRef.current ||
        !airplaneRef.current
      )
        return;

      landRef.current.mesh.rotation.z += 0.005;
      orbitRef.current.mesh.rotation.z += 0.001;
      skyRef.current.mesh.rotation.z += 0.003;
      forestRef.current.mesh.rotation.z += 0.005;

      // Update airplane position based on mouse. Rest position sits up and to
      // the left so the plane is out in open sky by default rather than tucked
      // behind the sign-in panel.
      const targetY = normalize(mouseRef.current.y, -0.75, 0.75, 80, 220);
      const targetX = normalize(mouseRef.current.x, -0.75, 0.75, -140, -60);

      airplaneRef.current.mesh.position.y +=
        (targetY - airplaneRef.current.mesh.position.y) * 0.1;
      airplaneRef.current.mesh.position.x +=
        (targetX - airplaneRef.current.mesh.position.x) * 0.1;

      airplaneRef.current.mesh.rotation.z =
        (targetY - airplaneRef.current.mesh.position.y) * 0.0128;
      airplaneRef.current.mesh.rotation.x =
        (airplaneRef.current.mesh.position.y - targetY) * 0.0064;
      airplaneRef.current.mesh.rotation.y =
        (airplaneRef.current.mesh.position.x - targetX) * 0.0064;

      airplaneRef.current.propeller.rotation.x += 0.3;

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Event listeners
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        container.removeChild(rendererRef.current.domElement);
      }
    };
  }, [handleMouseMove, handleResize]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10"
      style={{
        background: "linear-gradient(#e4e0ba, #f7d9aa)",
      }}
    />
  );
}
