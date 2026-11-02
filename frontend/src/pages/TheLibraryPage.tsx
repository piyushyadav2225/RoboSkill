import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Download, 
  FlaskConical, 
  Cpu, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Code2,
  Layers,
  Sparkles
} from 'lucide-react';

export const TheLibraryPage: React.FC = () => {
  const { setActiveTab, setSelectedSkillId, showToast, refreshKey } = useApp();
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [docTab, setDocTab] = useState<'micropython' | 'python' | 'arduino'>('python');

  useEffect(() => {
    fetchSkills();
  }, [refreshKey]);

  const fetchSkills = () => {
    setLoading(true);
    fetch('/api/skills')
      .then(res => res.json())
      .then(data => {
        setSkills(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleTestSkill = (skillId: string) => {
    setSelectedSkillId(skillId);
    setActiveTab('testing');
  };

  return (
    <div className="min-h-screen bg-[#14110E] text-[#E8DFC9] selection:bg-[#C19A55] selection:text-[#14110E]">
      
      {/* 1. HERO SECTION: THE LIBRARY (Inspired by User's Library Image) */}
      <section className="relative pt-16 pb-24 overflow-hidden border-b border-[#C19A55]/25">
        
        {/* Subtle Library Stacks Background Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#241A12]/80 via-[#17120E]/95 to-[#120E0B] pointer-events-none" />
        
        {/* Warm Candle & Lantern Ambient Pools */}
        <div className="absolute top-1/4 left-1/4 w-[450px] h-[300px] bg-[#F2994A]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-[#C19A55]/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Delicate Golden Celestial & Botanical Line-Art Overlays (from Image 2) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-6 opacity-30 select-none">
          <svg className="w-64 h-64 text-[#C19A55]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.75">
            <circle cx="100" cy="100" r="70" strokeDasharray="3 3" />
            <circle cx="100" cy="100" r="45" />
            <path d="M100 10 L100 190 M10 100 L190 100" />
            <path d="M35 35 L165 165 M35 165 L165 35" strokeDasharray="2 4" />
          </svg>
          <svg className="w-64 h-64 text-[#C19A55]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.75">
            <ellipse cx="100" cy="100" rx="80" ry="35" transform="rotate(-30 100 100)" />
            <ellipse cx="100" cy="100" rx="80" ry="35" transform="rotate(30 100 100)" />
            <circle cx="100" cy="100" r="16" />
          </svg>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          {/* Ancient Sub-Banner */}
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#1F1914] border border-[#C19A55]/40 text-xs font-mono text-[#E5BE72] tracking-[0.25em] uppercase shadow-lg">
            <span>✦</span>
            <span>CODEX ARCHIVE MDCCXXIV</span>
            <span>✦</span>
          </div>

          {/* Grand Header: THE LIBRARY */}
          <h1 className="font-ancient text-5xl sm:text-7xl font-extrabold tracking-tight text-[#FFF5DF] drop-shadow-md">
            THE LIBRARY
          </h1>

          <div className="text-sm font-mono tracking-[0.35em] text-[#C19A55] uppercase">
            THIS IS JUST THE BEGINNING
          </div>

          <p className="font-manuscript text-xl sm:text-2xl text-[#D8C7A0]/90 leading-relaxed max-w-2xl mx-auto pt-2">
            An ancient engineering marketplace for verified robot skills. Download structured package ZIPs, deploy them onto physical rovers, and evaluate kinematics in the virtual lab.
          </p>

          {/* Minimal Quick Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#marketplace-section"
              className="brass-btn text-xs px-8 py-3.5 shadow-xl"
            >
              <span>✦ EXPLORE SKILL ARCHIVE ✦</span>
              <ArrowRight size={14} />
            </a>

            <button
              onClick={() => setActiveTab('testing')}
              className="brass-btn-secondary text-xs px-7 py-3.5 flex items-center gap-2"
            >
              <FlaskConical size={14} className="text-[#E5BE72]" />
              <span>TEST IN VIRTUAL LAB</span>
            </button>
          </div>

        </div>
      </section>

      {/* 2. ROBOSKILL MARKETPLACE: ZIPPED PACKAGES */}
      <section id="marketplace-section" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#C19A55]/20 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#C19A55] uppercase tracking-wider mb-1">
              <Layers size={14} />
              <span>✦ MARKETPLACE CODEX &bull; ZIPPED ROBOT SKILL PACKAGES ✦</span>
            </div>
            <h2 className="font-ancient text-3xl font-bold text-[#FFF5DF]">
              Downloadable Robot Skills
            </h2>
            <p className="text-sm font-manuscript text-lg text-[#D8C7A0]/85 mt-1">
              Every package contains clean, verified Python logic, manifest metadata, and tests ready for implementation.
            </p>
          </div>

          <div className="text-xs font-mono text-[#9E917A] bg-[#1F1914] px-4 py-2 rounded-xl border border-[#80643C]/30">
            Total Packages: <strong className="text-[#E5BE72]">{skills.length}</strong>
          </div>
        </div>

        {/* Skill Cards Grid */}
        {loading ? (
          <div className="p-16 text-center parchment-panel rounded-3xl font-mono text-sm text-[#E5BE72]">
            Retrieving skill folios from vault archives...
          </div>
        ) : skills.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="parchment-panel rounded-3xl p-7 sm:p-9 border border-[#C19A55]/35 hover:border-[#E5BE72] transition-all duration-300 shadow-2xl flex flex-col justify-between celestial-frame space-y-6 group"
              >
                {/* Header Information */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <span className="px-3.5 py-1 rounded-full bg-[#80643C]/25 text-[#E5BE72] border border-[#80643C]/60 font-semibold uppercase">
                      {skill.category}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#14110E] border border-[#C19A55]/30 text-[#D8C7A0]">
                      v{skill.version}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#14110E] border border-[#C19A55]/30 text-[#D8C7A0]">
                      {skill.language} 3.11+
                    </span>
                  </div>

                  <div>
                    <h3 className="font-ancient text-2xl font-bold text-[#FFF5DF] group-hover:text-[#E5BE72] transition-colors">
                      {skill.name}
                    </h3>
                    <p className="text-xs font-mono text-[#80643C] mt-0.5">
                      Artisan: <span className="text-[#D8C7A0]">{skill.creator_name}</span> &bull; License: <span className="text-[#D8C7A0]">{skill.license}</span>
                    </p>
                    <p className="text-sm font-manuscript text-[#D8C7A0]/90 text-lg mt-3 leading-relaxed">
                      {skill.description}
                    </p>
                  </div>

                  {/* Hardware Specification Box (User requirement: tell which robot and microcontroller are best) */}
                  <div className="p-4 rounded-2xl bg-[#14110E] border border-[#C19A55]/25 space-y-2.5 font-mono text-xs shadow-inner">
                    <div className="text-[10px] text-[#C19A55] uppercase font-bold tracking-wider flex items-center gap-1.5 border-b border-[#80643C]/20 pb-1.5">
                      <Cpu size={13} />
                      <span>Recommended Hardware Architecture</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-[#80643C] block uppercase text-[9px] font-bold">Best Robot</span>
                        <span className="text-[#FFF5DF] font-semibold">{skill.best_robot || "Differential Drive Rover"}</span>
                      </div>
                      <div>
                        <span className="text-[#80643C] block uppercase text-[9px] font-bold">Best Microcontroller</span>
                        <span className="text-[#E5BE72] font-semibold">{skill.best_microcontroller || "ESP32 / Raspberry Pi Pico"}</span>
                      </div>
                    </div>

                    <div className="pt-1 text-[10px] text-[#9E917A] flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                      <span>Unit tested in software. Physical hardware certification: <strong className="text-amber-400">UNVERIFIED</strong></span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions: Zipped Download & Lab Test */}
                <div className="pt-4 border-t border-[#80643C]/20 flex flex-col sm:flex-row items-center gap-3">
                  <a
                    href={`/api/skills/${skill.id}/download`}
                    onClick={() => showToast(`Initiated download of ${skill.name} (.zip package).`)}
                    className="brass-btn w-full sm:flex-1 py-3 text-xs shadow-lg text-center"
                  >
                    <Download size={14} />
                    <span>✦ DOWNLOAD .ZIP ✦</span>
                  </a>

                  <button
                    onClick={() => handleTestSkill(skill.id)}
                    className="brass-btn-secondary w-full sm:flex-1 py-2.5 text-xs text-center flex items-center justify-center gap-2"
                  >
                    <FlaskConical size={14} />
                    <span>TEST IN LAB</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center parchment-panel rounded-3xl font-mono text-sm text-[#9E917A]">
            No skills discovered in archive.
          </div>
        )}

      </section>

      {/* 3. DOCUMENTATION: HOW ROBOSKILL WORKS (Below Marketplace as requested) */}
      <section className="py-20 border-t border-[#C19A55]/25 bg-[#17130F]/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#C19A55]">
              ✦ CODEX OF IMPLEMENTATION ✦
            </span>
            <h2 className="font-ancient text-3xl sm:text-4xl font-bold text-[#FFF5DF]">
              How RoboSkill Works
            </h2>
            <p className="text-sm font-manuscript text-lg text-[#D8C7A0]/90">
              RoboSkill delivers modular, pure decision-making algorithms packaged with structured metadata. Here is how you implement any downloaded skill onto your physical robot.
            </p>
          </div>

          {/* 4-Step Architecture Workflow */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-mono text-xs">
            
            <div className="p-6 rounded-2xl parchment-panel border border-[#C19A55]/30 space-y-3 shadow-xl">
              <div className="w-10 h-10 rounded-full bg-[#14110E] border border-[#C19A55] flex items-center justify-center font-ancient font-bold text-[#E5BE72] text-sm">
                01
              </div>
              <h4 className="font-ancient text-sm font-bold text-[#FFF5DF]">
                Download &amp; Unzip
              </h4>
              <p className="text-[11px] text-[#9E917A] font-sans leading-relaxed">
                Click "Download .ZIP" on any marketplace skill. Extract the archive into your robot controller's project directory.
              </p>
            </div>

            <div className="p-6 rounded-2xl parchment-panel border border-[#C19A55]/30 space-y-3 shadow-xl">
              <div className="w-10 h-10 rounded-full bg-[#14110E] border border-[#C19A55] flex items-center justify-center font-ancient font-bold text-[#E5BE72] text-sm">
                02
              </div>
              <h4 className="font-ancient text-sm font-bold text-[#FFF5DF]">
                Install or Import
              </h4>
              <p className="text-[11px] text-[#9E917A] font-sans leading-relaxed">
                Run <code className="text-[#E5BE72]">pip install -e .</code> or copy the standalone <code className="text-[#E5BE72]">src/roboskill</code> module onto your board.
              </p>
            </div>

            <div className="p-6 rounded-2xl parchment-panel border border-[#C19A55]/30 space-y-3 shadow-xl">
              <div className="w-10 h-10 rounded-full bg-[#14110E] border border-[#C19A55] flex items-center justify-center font-ancient font-bold text-[#E5BE72] text-sm">
                03
              </div>
              <h4 className="font-ancient text-sm font-bold text-[#FFF5DF]">
                Feed Sensor Stream
              </h4>
              <p className="text-[11px] text-[#9E917A] font-sans leading-relaxed">
                Read your distance sensor (HC-SR04, LiDAR, or ToF) and pass <code className="text-[#E5BE72]">distance_cm</code> to <code className="text-[#E5BE72]">skill.run()</code>.
              </p>
            </div>

            <div className="p-6 rounded-2xl parchment-panel border border-[#C19A55]/30 space-y-3 shadow-xl">
              <div className="w-10 h-10 rounded-full bg-[#14110E] border border-[#C19A55] flex items-center justify-center font-ancient font-bold text-[#E5BE72] text-sm">
                04
              </div>
              <h4 className="font-ancient text-sm font-bold text-[#FFF5DF]">
                Actuate Motors
              </h4>
              <p className="text-[11px] text-[#9E917A] font-sans leading-relaxed">
                Read the deterministic movement request (<code className="text-[#E5BE72]">forward</code>, <code className="text-[#E5BE72]">turn</code>, <code className="text-[#E5BE72]">stop</code>) and command your motor drivers.
              </p>
            </div>

          </div>

          {/* Interactive Code Implementation Guide */}
          <div className="parchment-panel rounded-3xl p-6 sm:p-8 border border-[#C19A55]/40 shadow-2xl space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#80643C]/25 pb-4">
              <div className="flex items-center gap-2 text-xs font-mono">
                <Code2 size={16} className="text-[#C19A55]" />
                <span className="text-[#FFF5DF] font-bold">Practical Implementation Examples</span>
              </div>

              {/* Code Language Tabs */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  onClick={() => setDocTab('python')}
                  className={`px-3 py-1.5 rounded-lg border transition-all ${
                    docTab === 'python'
                      ? 'bg-[#E5BE72] text-[#14110E] font-bold border-[#E5BE72]'
                      : 'bg-[#14110E] text-[#9E917A] border-[#80643C]/30'
                  }`}
                >
                  Raspberry Pi (Python 3)
                </button>
                <button
                  onClick={() => setDocTab('micropython')}
                  className={`px-3 py-1.5 rounded-lg border transition-all ${
                    docTab === 'micropython'
                      ? 'bg-[#E5BE72] text-[#14110E] font-bold border-[#E5BE72]'
                      : 'bg-[#14110E] text-[#9E917A] border-[#80643C]/30'
                  }`}
                >
                  ESP32 / Pico (MicroPython)
                </button>
                <button
                  onClick={() => setDocTab('arduino')}
                  className={`px-3 py-1.5 rounded-lg border transition-all ${
                    docTab === 'arduino'
                      ? 'bg-[#E5BE72] text-[#14110E] font-bold border-[#E5BE72]'
                      : 'bg-[#14110E] text-[#9E917A] border-[#80643C]/30'
                  }`}
                >
                  Arduino Bridge (C++)
                </button>
              </div>
            </div>

            {/* Code Block */}
            <div className="p-5 rounded-2xl bg-[#0F0C0A] border border-[#80643C]/40 font-mono text-xs overflow-x-auto text-[#E8DFC9] leading-relaxed shadow-inner">
              {docTab === 'python' && (
                <pre>
{`# Raspberry Pi / Linux Autonomous Rover Implementation
import time
from roboskill import ObstacleAvoidanceSkill

# 1. Instantiate skill with desired safety stop threshold (in cm)
skill = ObstacleAvoidanceSkill(stop_distance_cm=25.0)

def read_ultrasonic_distance() -> float:
    # Read from HC-SR04, VL53L0X, or LiDAR
    return 45.2  # returns measured distance in centimeters

while True:
    distance = read_ultrasonic_distance()
    
    # 2. Execute deterministic decision step (< 0.2ms computation)
    result = skill.run(distance)
    action = result["action"]  # 'forward', 'turn', or 'stop'
    
    if action == "forward":
        # Drive left & right motors forward
        print(">> Path clear: Moving forward at standard speed")
    elif action == "turn":
        # Pivot rover in-place away from obstacle
        print(">> Obstacle detected! Executing evasive yaw rotation")
    else:
        # Emergency stop on invalid/negative sensor reading
        print(">> Telemetry fault: Motors stopped")
        
    time.sleep(0.05)`}
                </pre>
              )}

              {docTab === 'micropython' && (
                <pre>
{`# ESP32 / Raspberry Pi Pico (MicroPython) Minimal Runner
import time
from machine import Pin, time_pulse_us
from roboskill.skill import ObstacleAvoidanceSkill

# Initialize Obstacle Avoidance Skill
skill = ObstacleAvoidanceSkill(stop_distance_cm=20.0)

# Connect HC-SR04 pins: Trig=GPIO 5, Echo=GPIO 18
trig = Pin(5, Pin.OUT)
echo = Pin(18, Pin.IN)

def get_distance_cm():
    trig.value(0)
    time.sleep_us(2)
    trig.value(1)
    time.sleep_us(10)
    trig.value(0)
    duration = time_pulse_us(echo, 1, 30000)
    return (duration * 0.0343) / 2 if duration > 0 else -1.0

while True:
    dist = get_distance_cm()
    decision = skill.run(dist)
    
    # Actuate motor driver H-bridge (DRV8833 or L298N)
    motor_command = decision["action"]
    print("Action:", motor_command, "| Distance:", dist, "cm")
    time.sleep_ms(50)`}
                </pre>
              )}

              {docTab === 'arduino' && (
                <pre>
{`// Arduino Uno / Mega / Nano C++ Serial Bridge
// Communicates with RoboSkill controller via UART Serial @ 115200 baud

void setup() {
  Serial.begin(115200);
  pinMode(9, OUTPUT);  // Left Motor PWM
  pinMode(10, OUTPUT); // Right Motor PWM
}

void loop() {
  // Read ultrasonic ping in cm
  float distance_cm = measure_sensor();
  
  // Transmit reading to RoboSkill runner
  Serial.print("DIST:");
  Serial.println(distance_cm);
  
  // Receive skill action command: "FORWARD", "TURN", "STOP"
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\\n');
    cmd.trim();
    if (cmd == "FORWARD") driveMotors(180, 180);
    else if (cmd == "TURN") driveMotors(-150, 150);
    else driveMotors(0, 0);
  }
  delay(40);
}`}
                </pre>
              )}
            </div>

          </div>

        </div>
      </section>

    </div>
  );
};

