import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Terminal,
  Zap,
  PlusCircle
} from 'lucide-react';

interface Obstacle {
  x: number;
  y: number;
  radius: number;
  label?: string;
}

export const TestingLabPage: React.FC = () => {
  const { selectedSkillId, setSelectedSkillId, showToast, refreshKey } = useApp();

  // Marketplace Skills List
  const [skills, setSkills] = useState<any[]>([]);
  const [currentSkill, setCurrentSkill] = useState<any>(null);

  // Simulation Controls & Telemetry
  const [stopDistanceCm, setStopDistanceCm] = useState<number>(20.0);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1.0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stepCount, setStepCount] = useState<number>(0);
  const [obstaclesAvoided, setObstaclesAvoided] = useState<number>(0);
  const [lastAction, setLastAction] = useState<string>('IDLE');
  const [lastReason, setLastReason] = useState<string>('Awaiting start');
  const [currentDistance, setCurrentDistance] = useState<number>(100.0);
  const [logs, setLogs] = useState<Array<{ time: string; text: string; type: 'info' | 'warn' | 'action' }>>([]);

  // Canvas Refs & Entities
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const robotPos = useRef<{ x: number; y: number; angle: number }>({ x: 120, y: 240, angle: 0 });
  const obstacles = useRef<Obstacle[]>([
    { x: 500, y: 240, radius: 36, label: 'Monolith Alpha' },
    { x: 360, y: 120, radius: 26, label: 'Pillar Beta' },
    { x: 360, y: 360, radius: 26, label: 'Pillar Gamma' },
  ]);
  const trail = useRef<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    fetch('/api/skills')
      .then(r => r.json())
      .then(data => {
        setSkills(data);
        if (data.length > 0) {
          const match = data.find((s: any) => s.id === selectedSkillId) || data[0];
          setCurrentSkill(match);
        }
      })
      .catch(console.error);
  }, [selectedSkillId, refreshKey]);

  const selectSkill = (skill: any) => {
    setSelectedSkillId(skill.id);
    setCurrentSkill(skill);
    handleReset();
    showToast(`Loaded ${skill.name} for simulation evaluation.`);
  };

  const addLog = (text: string, type: 'info' | 'warn' | 'action' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ time, text, type }, ...prev.slice(0, 30)]);
  };

  // Safe Simulation Decision via Python Skill
  const computeStep = async () => {
    const r = robotPos.current;

    // Raycast distance calculation
    let minDistance = 999.0;
    const robotRadius = 18;

    for (const obs of obstacles.current) {
      const dx = obs.x - r.x;
      const dy = obs.y - r.y;
      const centerDist = Math.sqrt(dx * dx + dy * dy);
      const edgeDist = Math.max(0, centerDist - obs.radius - robotRadius);

      const angleToObs = Math.atan2(dy, dx);
      let angleDiff = Math.abs(r.angle - angleToObs);
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      angleDiff = Math.abs(angleDiff);

      if (angleDiff < Math.PI / 3) {
        if (edgeDist < minDistance) {
          minDistance = edgeDist;
        }
      }
    }

    const distanceCm = Math.min(250, (minDistance / 2));
    setCurrentDistance(distanceCm);

    try {
      const res = await fetch('/api/simulation/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill_id: currentSkill?.id || 'roboskill.obstacle-avoidance',
          robot_id: 'archimedes-rover-mk1',
          distance_cm: distanceCm,
          stop_distance_cm: stopDistanceCm
        })
      });

      const decision = await res.json();
      const action = decision.action;
      setLastAction(action.toUpperCase());
      setLastReason(decision.reason);

      if (action === 'forward') {
        const speed = 3.6 * simulationSpeed;
        r.x += speed * Math.cos(r.angle);
        r.y += speed * Math.sin(r.angle);
      } else if (action === 'turn') {
        r.angle += (Math.PI / 2);
        const nudge = 16 * simulationSpeed;
        r.x += nudge * Math.cos(r.angle);
        r.y += nudge * Math.sin(r.angle);
        setObstaclesAvoided(prev => prev + 1);
        addLog(`OBSTACLE DETECTED (${distanceCm.toFixed(1)}cm <= ${stopDistanceCm}cm). Action: TURN (90°)`, 'warn');
      } else {
        addLog(`Robot STOPPED: ${decision.reason}`, 'warn');
      }

      // Perimeter bounce
      const width = canvasRef.current?.width || 700;
      const height = canvasRef.current?.height || 440;
      if (r.x < 30 || r.x > width - 30 || r.y < 30 || r.y > height - 30) {
        r.angle += Math.PI;
        r.x = Math.max(35, Math.min(width - 35, r.x));
        r.y = Math.max(35, Math.min(height - 35, r.y));
        addLog(`Blueprint perimeter reached; heading reversed.`, 'info');
      }

      trail.current.push({ x: r.x, y: r.y });
      if (trail.current.length > 200) trail.current.shift();

      setStepCount(prev => prev + 1);
    } catch (err) {
      console.error(err);
    }

    drawCanvas();
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Aged Parchment Background
    ctx.fillStyle = '#E8DEC5';
    ctx.fillRect(0, 0, width, height);

    // Draftsman's Sepia Grid
    ctx.strokeStyle = 'rgba(128, 100, 60, 0.16)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 35) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Double Ink Border
    ctx.strokeStyle = '#6E5230';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(10, 10, width - 20, height - 20);
    ctx.strokeStyle = 'rgba(110, 82, 48, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    // Brass Pins in 4 Corners
    for (const pin of [{ x: 16, y: 16 }, { x: width - 16, y: 16 }, { x: 16, y: height - 16 }, { x: width - 16, y: height - 16 }]) {
      ctx.beginPath();
      ctx.arc(pin.x, pin.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#C19A55';
      ctx.fill();
      ctx.strokeStyle = '#4A3820';
      ctx.stroke();
    }

    // Breadcrumb Trail
    if (trail.current.length > 1) {
      ctx.strokeStyle = 'rgba(110, 82, 48, 0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(trail.current[0].x, trail.current[0].y);
      for (let i = 1; i < trail.current.length; i++) {
        ctx.lineTo(trail.current[i].x, trail.current[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Obstacles
    for (const obs of obstacles.current) {
      ctx.save();
      ctx.translate(obs.x, obs.y);

      ctx.beginPath();
      ctx.arc(0, 0, obs.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#D4C09B';
      ctx.fill();
      ctx.strokeStyle = '#5E4325';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Cog teeth
      ctx.strokeStyle = 'rgba(94, 67, 37, 0.5)';
      ctx.lineWidth = 1.5;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (obs.radius * 0.5), Math.sin(a) * (obs.radius * 0.5));
        ctx.lineTo(Math.cos(a) * (obs.radius * 0.9), Math.sin(a) * (obs.radius * 0.9));
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(0, 0, obs.radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#80643C';
      ctx.fill();

      ctx.fillStyle = '#382613';
      ctx.font = 'bold 10px "Cinzel", serif';
      ctx.textAlign = 'center';
      ctx.fillText(obs.label || 'OBSTACLE', 0, -obs.radius - 6);

      ctx.restore();
    }

    // Draw Robot (Clockwork Automaton)
    const r = robotPos.current;
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.angle);

    // Sensor Cone Projection
    const coneDist = Math.max(10, currentDistance * 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, coneDist, -Math.PI / 8, Math.PI / 8);
    ctx.closePath();
    ctx.fillStyle = currentDistance <= stopDistanceCm ? 'rgba(217, 65, 34, 0.35)' : 'rgba(235, 175, 75, 0.35)';
    ctx.fill();
    ctx.strokeStyle = currentDistance <= stopDistanceCm ? '#C0392B' : '#C19A55';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Chassis
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.fillStyle = '#C19A55';
    ctx.fill();
    ctx.strokeStyle = '#4A3820';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#2A1E14';
    ctx.fill();

    // Caliper Pointer
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(26, 0);
    ctx.strokeStyle = '#FFF5DF';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Sensor Bulb
    ctx.beginPath();
    ctx.arc(26, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = currentDistance <= stopDistanceCm ? '#E74C3C' : '#F39C12';
    ctx.fill();

    ctx.restore();

    // Scale text
    ctx.fillStyle = 'rgba(110, 82, 48, 0.7)';
    ctx.font = 'bold 11px "Cinzel", serif';
    ctx.fillText('N ✦ ARCHIMEDES BENCH', 28, 30);
  };

  useEffect(() => {
    let intervalId: any;
    if (isRunning) {
      intervalId = setInterval(() => {
        computeStep();
      }, 100 / simulationSpeed);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, simulationSpeed, stopDistanceCm, currentSkill]);

  useEffect(() => {
    drawCanvas();
  }, [currentDistance]);

  const handleReset = () => {
    setIsRunning(false);
    robotPos.current = { x: 120, y: 240, angle: 0 };
    trail.current = [];
    setStepCount(0);
    setObstaclesAvoided(0);
    setLastAction('IDLE');
    setLastReason('Reset to origin coordinates');
    drawCanvas();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    obstacles.current.push({
      x,
      y,
      radius: 25,
      label: `Marker 0${obstacles.current.length + 1}`
    });
    addLog(`Spawned obstacle at (${Math.round(x)}, ${Math.round(y)})`, 'info');
    drawCanvas();
  };

  return (
    <div className="min-h-screen bg-[#14110E] text-[#E8DFC9] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-[#C19A55]/25 pb-6 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[#C19A55] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#E5BE72]" />
            <span>✦ CHAMBER III &bull; VIRTUAL TESTING BENCH ✦</span>
          </div>
          <h1 className="font-ancient text-3xl sm:text-5xl font-extrabold text-[#FFF5DF] tracking-tight">
            Testing Lab
          </h1>
          <p className="font-manuscript text-lg sm:text-xl text-[#D8C7A0]/90 max-w-3xl">
            Choose any robot skill from the marketplace, discover which robot and microcontroller are best suited for it, and run interactive simulation tests before uploading code to physical hardware.
          </p>
        </div>

        {/* 1. SKILL PICKER: CUSTOMER CHOOSES FROM MARKETPLACE (User Requirement) */}
        <div className="parchment-panel rounded-3xl p-6 border border-[#C19A55]/35 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-ancient text-xs font-bold text-[#FFF5DF] uppercase tracking-wider flex items-center gap-2">
              <Layers size={14} className="text-[#C19A55]" />
              <span>Select Skill to Test from Marketplace:</span>
            </span>
            <span className="text-[11px] font-mono text-[#80643C]">
              {skills.length} Available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {skills.map(skill => (
              <button
                key={skill.id}
                onClick={() => selectSkill(skill)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  currentSkill?.id === skill.id
                    ? 'bg-[#2A2016] border-[#E5BE72] text-[#FFF5DF] shadow-md ring-1 ring-[#E5BE72]/40'
                    : 'bg-[#14110E] border-[#80643C]/30 text-[#D8C7A0]/75 hover:border-[#80643C]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-[#E5BE72] uppercase font-bold">{skill.category}</span>
                  <span className="text-[#80643C]">v{skill.version}</span>
                </div>
                <div className="font-ancient text-sm font-bold text-[#FFF5DF] truncate">{skill.name}</div>
                <div className="text-[11px] text-[#9E917A] line-clamp-1 mt-0.5">{skill.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. RECOMMENDED HARDWARE & MICROCONTROLLER SPECIFICATION (User Requirement) */}
        {currentSkill && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#221B14] to-[#17130F] border border-[#C19A55]/40 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#80643C]/30 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[#E5BE72]">
                <Cpu size={15} />
                <span className="uppercase font-bold tracking-wider">Ideal Hardware Architecture for:</span>
                <strong className="text-[#FFF5DF] font-ancient text-sm">{currentSkill.name}</strong>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/30">
                Verified Decision Vector
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-[#14110E] border border-[#80643C]/30 space-y-1.5 shadow-inner">
                <span className="text-[#80643C] uppercase text-[10px] font-bold block">🤖 Recommended Robot</span>
                <span className="font-ancient text-base font-bold text-[#FFF5DF] block">
                  {currentSkill.best_robot || "Differential Drive 2WD / 4WD Rover"}
                </span>
                <span className="text-[11px] text-[#9E917A] block">
                  Differential steering, tracked treads, or holonomic chassis.
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#14110E] border border-[#80643C]/30 space-y-1.5 shadow-inner">
                <span className="text-[#80643C] uppercase text-[10px] font-bold block">⚡ Recommended Microcontroller</span>
                <span className="font-ancient text-base font-bold text-[#E5BE72] block">
                  {currentSkill.best_microcontroller || "ESP32 / Raspberry Pi Pico / Arduino Uno"}
                </span>
                <span className="text-[11px] text-[#9E917A] block">
                  Dual-core 32-bit (ESP32 / RP2040) or 8-bit AVR with UART bridge.
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#14110E] border border-[#80643C]/30 space-y-1.5 shadow-inner">
                <span className="text-[#80643C] uppercase text-[10px] font-bold block">📡 Sensors &amp; Wiring</span>
                <span className="font-semibold text-[#D8C7A0] block">
                  Ultrasonic (HC-SR04) or ToF (VL53L0X)
                </span>
                <span className="text-[10px] text-[#9E917A] block font-mono">
                  Trig: GPIO 5 &bull; Echo: GPIO 18 &bull; Motor PWM: L298N / DRV8833
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3. INTERACTIVE SIMULATION ARENA & CALIBRATED SLIDE RULER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Simulation Canvas */}
          <div className="lg:col-span-8 space-y-4">
            
            <div className="parchment-panel rounded-3xl overflow-hidden border border-[#C19A55]/40 shadow-2xl relative">
              
              {/* Canvas Header Bar */}
              <div className="p-3.5 bg-[#1F1914] border-b border-[#80643C]/30 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  <span className="text-[#FFF5DF] font-semibold">
                    {isRunning ? `RUNNING LOGIC: ${currentSkill?.name}` : 'SIMULATION BENCH IDLE'}
                  </span>
                </div>
                <div className="text-[11px] text-[#E5BE72] flex items-center gap-1 cursor-pointer" onClick={() => showToast('Click canvas to drop obstacles.')}>
                  <PlusCircle size={13} />
                  <span>Click canvas to place obstacle</span>
                </div>
              </div>

              {/* Blueprint Canvas */}
              <canvas
                ref={canvasRef}
                width={700}
                height={440}
                onClick={handleCanvasClick}
                className="w-full h-[440px] cursor-crosshair block"
              />

              {/* Vacuum Tube In-Canvas Telemetry HUD */}
              <div className="absolute top-16 left-5 pointer-events-none p-3.5 rounded-2xl bg-[#17130F]/90 border border-[#80643C]/50 font-mono text-xs space-y-1 shadow-xl">
                <div className="text-[#80643C] text-[10px] uppercase font-bold">Telemetry Vector</div>
                <div className="text-[#FFF5DF]">
                  Clearance: <strong className={currentDistance <= stopDistanceCm ? 'text-red-400' : 'text-emerald-400'}>{currentDistance.toFixed(1)} cm</strong>
                </div>
                <div className="text-[#D8C7A0]">
                  Threshold: <strong>{stopDistanceCm} cm</strong>
                </div>
                <div className="text-[#9E917A]">
                  Avoided: <strong className="text-[#E5BE72]">{obstaclesAvoided}</strong>
                </div>
              </div>
            </div>

            {/* Calibrated Antikythera Distance Slide Ruler (Image 10) */}
            <div className="parchment-panel p-4 rounded-2xl border border-[#C19A55]/35 space-y-3 font-mono text-xs shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[#80643C]">
                <div className="flex items-center gap-2">
                  <span className="text-[#E5BE72]">🪶</span>
                  <span className="uppercase font-bold tracking-wider text-[#E5BE72]">✦ Calibrated Distance Slide Ruler ✦</span>
                </div>
                
                {/* Stepped Drum Counters */}
                <div className="flex items-center gap-1.5 bg-[#14110E] px-3 py-1 rounded-lg border border-[#80643C]/40 text-xs shadow-inner">
                  <span className="text-[10px] text-[#80643C] uppercase font-bold">DRUM:</span>
                  <div className="flex gap-1 font-mono font-bold">
                    {Math.round(currentDistance).toString().padStart(4, '0').split('').map((digit, idx) => (
                      <span key={idx} className="w-4 h-5 rounded bg-[#2A1E14] border border-[#C19A55]/50 text-[#FFF5DF] flex items-center justify-center text-[11px]">
                        {digit}
                      </span>
                    ))}
                  </div>
                  <span className="text-[#E5BE72] font-bold text-[11px]">cm</span>
                </div>
              </div>

              {/* The Mechanical Ivory Ruler */}
              <div 
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  const newDist = Math.round(ratio * 200);
                  setCurrentDistance(newDist);
                  addLog(`Manual distance calibration set to ${newDist}cm.`, 'info');
                }}
                title="Click anywhere on ruler to test distance thresholds"
                className="relative h-12 bg-[#E8DEC5] rounded-xl border-2 border-[#80643C] overflow-hidden shadow-inner flex items-center cursor-pointer select-none"
              >
                <div className="absolute inset-0 flex justify-between px-3 items-end pb-1 pointer-events-none text-[#5E4325] text-[9px] font-bold">
                  {[0, 25, 50, 75, 100, 125, 150, 175, 200].map(val => (
                    <div key={val} className="flex flex-col items-center">
                      <div className="w-[1.5px] h-3.5 bg-[#6E5230] mb-0.5" />
                      <span>{val}</span>
                    </div>
                  ))}
                </div>

                {/* Stopping Threshold Marker */}
                <div 
                  className="absolute top-0 bottom-0 w-[2px] bg-red-600 z-10 pointer-events-none"
                  style={{ left: `${Math.min(98, Math.max(2, (stopDistanceCm / 200) * 100))}%` }}
                >
                  <div className="absolute -top-1 -left-1 text-[8px] font-bold text-red-600">▼</div>
                </div>

                {/* Live Distance Sliding Cursor Needle */}
                <div 
                  className="absolute top-0 bottom-0 flex flex-col items-center z-20 pointer-events-none transition-all duration-75"
                  style={{ left: `${Math.min(97, Math.max(2, (currentDistance / 200) * 100))}%` }}
                >
                  <div className="w-3 h-3 rotate-45 bg-[#C19A55] border border-[#14110E] shadow -mt-1.5" />
                  <div className="w-[2px] h-full bg-[#14110E]" />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#9E917A]">
                <span>◀ Click ruler to manually test distance triggers</span>
                <span>Threshold: <strong className="text-red-400">{stopDistanceCm} cm</strong></span>
              </div>
            </div>

            {/* Run Controls Panel */}
            <div className="parchment-panel p-4 rounded-2xl border border-[#C19A55]/30 flex flex-wrap items-center justify-between gap-4 font-mono text-xs shadow-xl">
              <div className="flex items-center gap-2.5">
                {isRunning ? (
                  <button
                    onClick={() => setIsRunning(false)}
                    className="brass-btn py-2 px-5 text-xs shadow"
                  >
                    <Pause size={14} />
                    <span>PAUSE</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsRunning(true)}
                    className="brass-btn py-2 px-5 text-xs shadow"
                  >
                    <Play size={14} className="fill-current" />
                    <span>START RUN</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsRunning(false);
                    computeStep();
                  }}
                  className="brass-btn-secondary py-2 px-3.5 text-xs"
                >
                  <span>STEP (1X)</span>
                </button>

                <button
                  onClick={handleReset}
                  className="p-2.5 rounded-full bg-[#14110E] border border-[#80643C]/40 text-[#D8C7A0] hover:text-[#FFF5DF]"
                  title="Reset positions"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              {/* Speed Multiplier */}
              <div className="flex items-center gap-2">
                <span className="text-[#80643C] text-[11px]">SPEED:</span>
                {[1.0, 2.0, 5.0].map(s => (
                  <button
                    key={s}
                    onClick={() => setSimulationSpeed(s)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                      simulationSpeed === s
                        ? 'bg-[#E5BE72] text-[#14110E]'
                        : 'bg-[#14110E] text-[#9E917A] hover:text-[#FFF5DF]'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Panel: Decision Output & Live Log */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Live Decision Display */}
            <div className="parchment-panel p-6 rounded-3xl border border-[#C19A55]/35 space-y-4 shadow-xl">
              <h3 className="font-ancient text-xs font-bold text-[#FFF5DF] uppercase tracking-wider">
                Skill Decision Output
              </h3>

              <div className={`p-5 rounded-2xl border text-center transition-all ${
                lastAction === 'FORWARD'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : (lastAction === 'TURN'
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 animate-pulse'
                    : 'bg-[#14110E] border-[#80643C]/40 text-[#9E917A]')
              }`}>
                <span className="block text-[10px] font-mono text-[#80643C] uppercase mb-1">
                  Active Algorithm Decision:
                </span>
                <span className="font-ancient text-3xl font-extrabold tracking-widest block">
                  {lastAction}
                </span>
                <span className="text-[11px] font-mono text-[#D8C7A0]/80 mt-1 block">
                  Reason: {lastReason}
                </span>
              </div>

              {/* Threshold Calibration Slider */}
              <div className="pt-2 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#80643C]">Stop Threshold:</span>
                  <span className="text-[#E5BE72] font-bold">{stopDistanceCm} cm</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={stopDistanceCm}
                  onChange={e => setStopDistanceCm(parseFloat(e.target.value))}
                  className="w-full accent-[#E5BE72] bg-[#14110E]"
                />
              </div>

              <div className="font-mono text-xs space-y-2 pt-2 border-t border-[#80643C]/20 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#80643C]">STEPS RUN:</span>
                  <span className="text-[#FFF5DF] font-bold">{stepCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#80643C]">AVOIDANCES:</span>
                  <span className="text-emerald-400 font-bold">{obstaclesAvoided}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#80643C]">ENGINE:</span>
                  <span className="text-[#E5BE72]">Native Python Loop</span>
                </div>
              </div>
            </div>

            {/* Execution Telemetry Terminal */}
            <div className="parchment-panel p-5 rounded-3xl border border-[#C19A55]/35 space-y-3 font-mono text-xs shadow-xl">
              <div className="flex items-center justify-between border-b border-[#80643C]/20 pb-2">
                <span className="text-[#FFF5DF] font-bold flex items-center gap-1.5">
                  <Terminal size={13} className="text-[#C19A55]" />
                  <span>Telemetry Log</span>
                </span>
                <button
                  onClick={() => setLogs([])}
                  className="text-[10px] text-[#80643C] hover:text-[#C19A55]"
                >
                  Clear
                </button>
              </div>

              <div className="h-48 overflow-y-auto space-y-1.5 text-[11px] pr-1">
                {logs.length > 0 ? (
                  logs.map((l, i) => (
                    <div
                      key={i}
                      className={l.type === 'warn' ? 'text-amber-300' : (l.type === 'action' ? 'text-emerald-300' : 'text-[#9E917A]')}
                    >
                      <span className="text-[#80643C]">[{l.time}]</span> {l.text}
                    </div>
                  ))
                ) : (
                  <div className="text-[#80643C] italic text-center py-6">
                    Start run to observe live telemetry decisions...
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

