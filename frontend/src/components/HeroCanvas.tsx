import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const HeroCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 5.6);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);

    // Materials - Antique Brass, Polished Bronze, Mahogany, and Amber Filament
    const brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xC19A55,
      metalness: 0.9,
      roughness: 0.25,
    });

    const polishedBronze = new THREE.MeshStandardMaterial({
      color: 0x96703E,
      metalness: 0.85,
      roughness: 0.3,
    });

    const copperMaterial = new THREE.MeshStandardMaterial({
      color: 0xB86D43,
      metalness: 0.85,
      roughness: 0.35,
    });

    const darkMahoganyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1E140D,
      metalness: 0.1,
      roughness: 0.75,
    });

    const ivoryRulerMaterial = new THREE.MeshStandardMaterial({
      color: 0xE8DFC9,
      metalness: 0.2,
      roughness: 0.5,
    });

    const glowingAmberMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF9F20,
    });

    const goldWireMaterial = new THREE.MeshBasicMaterial({
      color: 0xF5DEB3,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });

    // Master Group
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // 1. ANCIENT ANALOGUE COMPUTER / DIFFERENCE ENGINE BASE (Matching Image 5 & 4)
    const machineBase = new THREE.Group();
    masterGroup.add(machineBase);

    // Carved Mahogany Box Chassis
    const boxGeo = new THREE.BoxGeometry(2.4, 0.45, 1.6);
    const boxMesh = new THREE.Mesh(boxGeo, darkMahoganyMaterial);
    boxMesh.position.y = -1.35;
    machineBase.add(boxMesh);

    // Brass Rim Mounts on Box
    const rimFrontGeo = new THREE.BoxGeometry(2.44, 0.04, 0.04);
    const rimFront = new THREE.Mesh(rimFrontGeo, brassMaterial);
    rimFront.position.set(0, -1.13, 0.81);
    machineBase.add(rimFront);

    // Calibrated Linear Measurement Ruler on Front (from Image 5)
    const rulerGeo = new THREE.BoxGeometry(2.1, 0.12, 0.02);
    const rulerMesh = new THREE.Mesh(rulerGeo, ivoryRulerMaterial);
    rulerMesh.position.set(0, -1.22, 0.82);
    machineBase.add(rulerMesh);

    // Cylindrical Calculating Barrel Drums (The Antikythera Drums)
    const drumGroup = new THREE.Group();
    drumGroup.position.set(0, -1.0, 0.2);
    machineBase.add(drumGroup);

    const drumCount = 12;
    const drums: THREE.Mesh[] = [];
    const drumSpacing = 0.15;
    const startX = -((drumCount - 1) * drumSpacing) / 2;

    for (let i = 0; i < drumCount; i++) {
      const dGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.06, 24);
      const dMesh = new THREE.Mesh(dGeo, i % 2 === 0 ? brassMaterial : copperMaterial);
      dMesh.rotation.z = Math.PI / 2;
      dMesh.position.set(startX + i * drumSpacing, 0, 0);
      drumGroup.add(dMesh);
      drums.push(dMesh);
    }

    // Master Calculating Gear Wheel on Left Axis (from Image 5)
    const masterGearGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.08, 32);
    const masterGear = new THREE.Mesh(masterGearGeo, brassMaterial);
    masterGear.rotation.z = Math.PI / 2;
    masterGear.position.set(-1.15, -0.65, -0.1);
    machineBase.add(masterGear);

    // Calibrated Angular Arc Scale on Wheel
    const arcScaleGeo = new THREE.TorusGeometry(0.72, 0.03, 12, 48, Math.PI);
    const arcScale = new THREE.Mesh(arcScaleGeo, ivoryRulerMaterial);
    arcScale.position.set(-1.15, -0.65, -0.1);
    arcScale.rotation.y = Math.PI / 2;
    arcScale.rotation.z = Math.PI / 2;
    machineBase.add(arcScale);

    // 2. CONCENTRIC ASTROLABE / CELESTIAL RINGS
    const ringGroup = new THREE.Group();
    masterGroup.add(ringGroup);

    const ring1Geo = new THREE.TorusGeometry(2.4, 0.035, 16, 120);
    const ring1 = new THREE.Mesh(ring1Geo, brassMaterial);
    ringGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(2.0, 0.03, 16, 100);
    const ring2 = new THREE.Mesh(ring2Geo, copperMaterial);
    ring2.rotation.x = Math.PI / 4.2;
    ringGroup.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(1.55, 0.025, 16, 80);
    const ring3 = new THREE.Mesh(ring3Geo, polishedBronze);
    ring3.rotation.y = Math.PI / 3;
    ringGroup.add(ring3);

    // 3. ARTICULATED CLOCKWORK ROBOTIC ARM
    const armGroup = new THREE.Group();
    masterGroup.add(armGroup);

    // Turret Swivel Base
    const turretGeo = new THREE.CylinderGeometry(0.42, 0.52, 0.35, 24);
    const turret = new THREE.Mesh(turretGeo, brassMaterial);
    turret.position.set(0.2, -0.7, -0.2);
    armGroup.add(turret);

    // Shoulder Sphere
    const shoulderGeo = new THREE.SphereGeometry(0.32, 20, 20);
    const shoulder = new THREE.Mesh(shoulderGeo, copperMaterial);
    shoulder.position.set(0.2, -0.42, -0.2);
    armGroup.add(shoulder);

    // Lower Arm Link (Twin Struts with Copper Piston)
    const lowerArmGeo = new THREE.CylinderGeometry(0.09, 0.13, 1.35, 16);
    const lowerArm = new THREE.Mesh(lowerArmGeo, brassMaterial);
    lowerArm.position.set(0.45, 0.2, -0.2);
    lowerArm.rotation.z = -Math.PI / 5.5;
    armGroup.add(lowerArm);

    // Hydraulic Piston Cylinder
    const pistonGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.15, 12);
    const piston = new THREE.Mesh(pistonGeo, copperMaterial);
    piston.position.set(0.3, 0.2, -0.08);
    piston.rotation.z = -Math.PI / 5.5;
    armGroup.add(piston);

    // Elbow Gear Housing
    const elbowGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.16, 24);
    const elbow = new THREE.Mesh(elbowGeo, polishedBronze);
    elbow.position.set(0.78, 0.82, -0.2);
    elbow.rotation.x = Math.PI / 2;
    armGroup.add(elbow);

    // Upper Arm Link
    const upperArmGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.15, 16);
    const upperArm = new THREE.Mesh(upperArmGeo, copperMaterial);
    upperArm.position.set(0.45, 1.35, -0.2);
    upperArm.rotation.z = Math.PI / 4.5;
    armGroup.add(upperArm);

    // Wrist Caliper Mechanism
    const wristGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const wrist = new THREE.Mesh(wristGeo, brassMaterial);
    wrist.position.set(0.12, 1.82, -0.2);
    armGroup.add(wrist);

    // Precision Claws
    const clawLGeo = new THREE.BoxGeometry(0.04, 0.38, 0.06);
    const clawL = new THREE.Mesh(clawLGeo, brassMaterial);
    clawL.position.set(-0.02, 2.12, -0.2);
    clawL.rotation.z = -0.22;
    armGroup.add(clawL);

    const clawRGeo = new THREE.BoxGeometry(0.04, 0.38, 0.06);
    const clawR = new THREE.Mesh(clawRGeo, brassMaterial);
    clawR.position.set(0.26, 2.12, -0.2);
    clawR.rotation.z = 0.22;
    armGroup.add(clawR);

    // Glowing Optical Sensor Bulb (Inside Gripper)
    const bulbGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const bulbMesh = new THREE.Mesh(bulbGeo, glowingAmberMaterial);
    bulbMesh.position.set(0.12, 2.06, -0.2);
    armGroup.add(bulbMesh);

    const opticalCage = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), goldWireMaterial);
    opticalCage.position.set(0.12, 2.06, -0.2);
    armGroup.add(opticalCage);

    // 4. FLOATING GOLDEN EMBERS & WORKSHOP MOTES
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 8.5;
      particlePositions[i + 1] = (Math.random() - 0.5) * 6.5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 6.5;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xF2B562,
      size: 0.045,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMaterial);
    scene.add(particles);

    // 5. ATMOSPHERIC WARM LANTERN LIGHTING (From Images 1, 4 & 5)
    const ambientLight = new THREE.AmbientLight(0x402C1B, 1.7);
    scene.add(ambientLight);

    // Left Warm Workshop Lantern
    const lanternLeft = new THREE.PointLight(0xF2994A, 3.4, 9);
    lanternLeft.position.set(-2.6, 1.8, 1.0);
    scene.add(lanternLeft);

    // Right Amber Glow
    const lanternRight = new THREE.PointLight(0xC19A55, 3.2, 9);
    lanternRight.position.set(2.6, 1.5, 1.0);
    scene.add(lanternRight);

    // Gripper Sensor Bulb Glow
    const eyeLight = new THREE.PointLight(0xFF9F20, 2.4, 3.5);
    eyeLight.position.set(0.12, 2.06, 0.1);
    armGroup.add(eyeLight);

    // Cool Window Daylight Rim (From Image 4 & 5)
    const windowRimLight = new THREE.DirectionalLight(0x82C4E5, 1.15);
    windowRimLight.position.set(4, 5, -2);
    scene.add(windowRimLight);

    // Mouse Parallax Interaction
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / height) * 2 - 1);
      targetRotationY = x * 0.42;
      targetRotationX = -y * 0.24;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse follow
      masterGroup.rotation.y += (targetRotationY - masterGroup.rotation.y) * 0.05;
      masterGroup.rotation.x += (targetRotationX - masterGroup.rotation.x) * 0.05;

      // Rotate astrolabe rings
      ring1.rotation.z = elapsedTime * 0.11;
      ring2.rotation.x = elapsedTime * -0.15 + Math.PI / 4.2;
      ring3.rotation.y = elapsedTime * 0.2 + Math.PI / 3;

      // Rotate calculating drums (Antikythera barrels)
      drums.forEach((drum, idx) => {
        drum.rotation.x = elapsedTime * (0.8 + idx * 0.2);
      });

      // Master wheel turn
      masterGear.rotation.x = elapsedTime * 0.35;

      // Robotic arm subtle movement
      armGroup.position.y = Math.sin(elapsedTime * 1.3) * 0.04;
      lowerArm.rotation.z = -Math.PI / 5.5 + Math.sin(elapsedTime * 1.0) * 0.06;
      upperArm.rotation.z = Math.PI / 4.5 + Math.cos(elapsedTime * 1.0) * 0.06;
      opticalCage.rotation.y = elapsedTime * 1.6;

      // Lantern flicker
      const flicker = 1 + (Math.sin(elapsedTime * 14) + Math.sin(elapsedTime * 27)) * 0.05;
      lanternLeft.intensity = 3.4 * flicker;
      lanternRight.intensity = 3.2 * flicker;

      // Dust motes drift
      particles.rotation.y = elapsedTime * 0.02;
      particles.position.y = Math.sin(elapsedTime * 0.4) * 0.12;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[550px] md:h-[640px] flex items-center justify-center">
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing z-10" />

      {/* Decorative Celestial Astrolabe Background Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[460px] h-[460px] md:w-[580px] md:h-[580px] rounded-full border border-[#C19A55]/20 border-dashed animate-gear-slow" />
        <div className="absolute w-[360px] h-[360px] md:w-[460px] md:h-[460px] rounded-full border border-[#80643C]/25 animate-gear-reverse" />
        <div className="absolute w-[220px] h-[220px] rounded-full border border-[#C19A55]/15" />
      </div>

      {/* Workshop Calibration Legend */}
      <div className="absolute bottom-6 left-6 z-20 hidden sm:flex items-center gap-3 px-4 py-2 rounded-full bg-[#1A140F]/95 border border-[#C19A55]/40 text-xs font-mono text-[#D8C7A0] shadow-xl">
        <span className="w-2 h-2 rounded-full bg-[#FF9F20] animate-pulse" />
        <span>MECHANISM: ANTIKYTHERA CLOCKWORK DIFFERENCE ENGINE</span>
      </div>
    </div>
  );
};
