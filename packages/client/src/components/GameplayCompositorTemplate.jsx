// packages/client/src/components/GameplayCompositorTemplate.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { SpatialGuidanceSystem } from '../../../shared/src/index';
import * as THREE from 'three';

// 3D coordinate converter translating hex codes to positions
const hexToPos = (hex) => {
    switch (hex) {
        case '0x4F': return [-1.2, -0.85, -1.2];
        case '0x5A': return [1.2, -0.85, -0.6];
        case '0x82': return [0, -0.85, 1.5];
        case '0x00':
        default: return [0, -0.85, 0];
    }
};

// Sub-component for managing the dynamic parallax lights, tracker light, and targeting lights
function ParallaxLightsAndNPCs({ playerHex, activeTargetHex, activeHero }) {
    const pointLightRef1 = React.useRef();
    const pointLightRef2 = React.useRef();
    const spotLightRef = React.useRef();
    const targetMeshRef = React.useRef();

    const playerPos = hexToPos(playerHex);
    const targetPos = hexToPos(activeTargetHex);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        const mx = state.mouse.x * 2.0;
        const my = state.mouse.y * 2.0;

        // Nagging Parallax movement on point lights based on mouse & time
        if (pointLightRef1.current) {
            pointLightRef1.current.position.x = -3 + Math.sin(t * 0.5) + mx * 0.5;
            pointLightRef1.current.position.z = -3 + Math.cos(t * 0.5) + my * 0.5;
        }
        if (pointLightRef2.current) {
            pointLightRef2.current.position.x = 3 + Math.cos(t * 0.7) - mx * 0.3;
            pointLightRef2.current.position.z = 3 + Math.sin(t * 0.7) - my * 0.3;
        }

        // Aim spotlight from player to current target containing boss NPC
        if (spotLightRef.current && targetMeshRef.current) {
            targetMeshRef.current.position.set(targetPos[0], targetPos[1], targetPos[2]);
            spotLightRef.current.target = targetMeshRef.current;
        }
    });

    return (
        <>
            {/* Nagging Parallax Lights */}
            <pointLight ref={pointLightRef1} position={[-3, 4, -3]} intensity={0.8} color="#00ffaa" castShadow />
            <pointLight ref={pointLightRef2} position={[3, 4, 3]} intensity={0.6} color="#bf00ff" castShadow />

            {/* Tracking Light: Always tracks the player position with one light step */}
            <pointLight 
                position={[playerPos[0], playerPos[1] + 1.2, playerPos[2]]} 
                intensity={1.2} 
                color="#00ffff" 
                distance={4}
                decay={2}
            />

            {/* Aiming Spotlight: Points from player to target (boss NPC) */}
            <spotLight
                ref={spotLightRef}
                position={[playerPos[0], playerPos[1] + 1.5, playerPos[2]]}
                intensity={2.5}
                angle={Math.PI / 8}
                penumbra={0.5}
                color="#ff0055"
                castShadow
            />
            <mesh ref={targetMeshRef} position={targetPos} visible={false}>
                <boxGeometry args={[0.1, 0.1, 0.1]} />
            </mesh>

            {/* Fractal available NPCs representing important path notes to heroes */}
            <mesh position={[-1.2, -0.2, -1.2]} rotation={[0.5, 0.5, 0]}>
                <icosahedronGeometry args={[0.15, 1]} />
                <meshStandardMaterial color="#00ffcc" wireframe emissive="#00ffcc" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[1.2, -0.2, -0.6]} rotation={[0, 0.5, 0.5]}>
                <icosahedronGeometry args={[0.18, 1]} />
                <meshStandardMaterial color="#ff00ff" wireframe emissive="#ff00ff" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0, -0.2, 1.5]} rotation={[0.5, 0, 0.5]}>
                <icosahedronGeometry args={[0.16, 1]} />
                <meshStandardMaterial color="#ffff00" wireframe emissive="#ffff00" emissiveIntensity={0.5} />
            </mesh>

            {/* Volumetric God Rays */}
            <VolumetricLightShaft />

            {/* Bokeh Particles */}
            <AtmosphericBokehParticles />
        </>
    );
}

function VolumetricLightShaft() {
    const shaftRef = React.useRef();
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (shaftRef.current) {
            shaftRef.current.material.opacity = 0.08 + Math.sin(t * 1.5) * 0.03;
            shaftRef.current.rotation.y = t * 0.05;
        }
    });
    return (
        <mesh ref={shaftRef} position={[0, 2.5, 0]} rotation={[0.2, 0, 0.1]}>
            <cylinderGeometry args={[0.2, 1.8, 5, 16, 1, true]} />
            <meshBasicMaterial 
                color="#00ffff" 
                transparent 
                opacity={0.08} 
                blending={THREE.AdditiveBlending} 
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </mesh>
    );
}

function AtmosphericBokehParticles() {
    const particlesRef = React.useRef();
    const count = 100;
    const [positions, speeds] = React.useMemo(() => {
        const pos = new Float32Array(count * 3);
        const sp = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 8;
            pos[i * 3 + 1] = Math.random() * 5 - 1;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
            sp[i] = 0.2 + Math.random() * 0.3;
        }
        return [pos, sp];
    }, []);

    useFrame((state, delta) => {
        if (particlesRef.current) {
            const arr = particlesRef.current.geometry.attributes.position.array;
            const t = state.clock.getElapsedTime();
            for (let i = 0; i < count; i++) {
                arr[i * 3 + 1] += speeds[i] * delta;
                arr[i * 3] += Math.sin(t + i) * 0.002;
                if (arr[i * 3 + 1] > 4) {
                    arr[i * 3 + 1] = -1;
                }
            }
            particlesRef.current.geometry.attributes.position.needsUpdate = true;
            particlesRef.current.rotation.y = t * 0.02;
        }
    });

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.15}
                color="#00ffcc"
                transparent
                opacity={0.3}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

function PathTrajectoryLine({ steps }) {
    const points = React.useMemo(() => {
        if (!steps || steps.length === 0) return [];
        return steps.map(step => {
            const base = hexToPos(step.targetHex);
            return new THREE.Vector3(base[0], base[1] + 0.15, base[2]);
        });
    }, [steps]);

    const lineGeometry = React.useMemo(() => {
        if (points.length === 0) return null;
        return new THREE.BufferGeometry().setFromPoints(points);
    }, [points]);

    if (points.length === 0 || !lineGeometry) return null;

    return (
        <line geometry={lineGeometry}>
            <lineBasicMaterial color="#00ffff" linewidth={2} />
        </line>
    );
}

export default function GameplayCompositorTemplate({ activeThreadId = 'thread_king_ai', realityPhase = 'STANDARD', setRealityPhase }) {
    const [heroDataset, setHeroDataset] = useState(null);
    const [marketData, setMarketData] = useState(null);
    const [selectedFaction, setSelectedFaction] = useState('crystal');
    const [roughnessOverride, setRoughnessOverride] = useState(0.9);
    const [bloomIntensity, setBloomIntensity] = useState(1.5);

    // Integration Diagnostics States
    const [activeTab, setActiveTab] = useState('compositor'); // 'compositor' | 'diagnostics' | 'cms_spawner' | 'database' | 'logic_console' | 'realities'
    const [goCoreStatus, setGoCoreStatus] = useState('CHECKING');
    const [expressStatus, setExpressStatus] = useState('CHECKING');
    const [telemetryLogs, setTelemetryLogs] = useState([]);
    const [tacticPrompt, setTacticPrompt] = useState('aggression');
    const [mlResult, setMlResult] = useState(null);
    const [mlLoading, setMlLoading] = useState(false);
    const [generatedInstances, setGeneratedInstances] = useState([]);

    // Sandbox Quest & Caching Engine simulation states
    const [selectedQuest, setSelectedQuest] = useState('q_01_resonate');
    const [travelDestination, setTravelDestination] = useState('0x4F');
    const [visibleDistance, setVisibleDistance] = useState(4);
    const [cacheAlerts, setCacheAlerts] = useState([
        'System loaded. Sandbox generated 64 blocks.',
        'Initial cache state: 256 props active. RAM: 18.4MB'
    ]);

    const [geomCount, setGeomCount] = useState(64);
    const [heapSize, setHeapSize] = useState(18.4);

    const runManualGC = () => {
        if (geomCount > 20) {
            setGeomCount(prev => prev - 24);
            setHeapSize(prev => Math.max(5.0, Number((prev - 3.8).toFixed(1))));
            setCacheAlerts(prev => [
                ...prev,
                `[GC] Manually evicted 24 geometries. Released 3.8MB of heap memory.`,
                `WebGL Context state: ACTIVE | Vertex count culled.`
            ]);
        } else {
            setCacheAlerts(prev => [
                ...prev,
                `[GC] Cache footprint is already optimal. No eviction needed.`
            ]);
        }
    };

    const handleAcquireItems = async () => {
        try {
            const res = await fetch('/api/admin/spawn-predicted-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: activeThreadId })
            });
            const data = await res.json();
            if (data.success) {
                setCacheAlerts(prev => [
                    ...prev,
                    `[ADMIN] Spawned all predicted items.`,
                    `Bonus damage and spellReach values updated in profile.`
                ]);
                alert(data.message);
            }
        } catch (e) {
            console.error('Failed to spawn predicted items', e);
        }
    };

    const [simMatch, setSimMatch] = useState({
        playerHP: 15,
        bossHP: 30,
        turn: 'PLAYER',
        logs: ['[Start] Battle initialized: Player vs Sentinel Boss.'],
        hand: []
    });

    const startSimMatch = async () => {
        try {
            const res = await fetch('/api/admin/ai-match/start', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setSimMatch(data.match);
            }
        } catch (e) {
            console.error('Failed to start AI match', e);
        }
    };

    const playSimCard = async (cardId) => {
        try {
            const res = await fetch('/api/admin/ai-match/play-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardId })
            });
            const data = await res.json();
            if (data.success) {
                setSimMatch(data.match);
            }
        } catch (e) {
            console.error('Failed to play card in AI match', e);
        }
    };

    const triggerPurge = () => {
        const culledProps = (9 - visibleDistance) * 32;
        const freedRAM = (9 - visibleDistance) * 2.8;
        setCacheAlerts(prev => [
            ...prev,
            `Purged ${culledProps} off-grid props. Evicted ${(9 - visibleDistance)} out-of-range chunks.`,
            `Garbage collector ran: Freed ${freedRAM.toFixed(1)}MB of cached geometries.`
        ]);
    };

    // Kubernetes game-adapted cluster monitor states
    const [k8sPods, setK8sPods] = useState([
        { id: 'pod-glacier-01', location: '0x1A', status: 'RUNNING', cpu: '12%', memory: '245MB' },
        { id: 'pod-swamp-02', location: '0x2C', status: 'RUNNING', cpu: '28%', memory: '512MB' },
        { id: 'pod-barrens-03', location: '0x3D', status: 'RUNNING', cpu: '15%', memory: '190MB' }
    ]);
    const [k8sLogs, setK8sLogs] = useState([
        'Initialized Kubernetes Game Operations Mesh.',
        'Node pod-glacier-01 listening on coordinate 0x1A.'
    ]);

    const [devopsStats, setDevopsStats] = useState({
        buildPassed: true,
        testCoverage: 94.5,
        linesOfCode: 18450,
        commitHash: 'd3a8b2f6',
        compileTimeMs: 1240,
        tdpRating: 0.65
    });

    // Quest Simulation and LLaMA metadata states
    const [simulatedQuest, setSimulatedQuest] = useState({
        questId: "q_void_journey_0x4f",
        title: "Cesta cez energetické anomálie",
        steps: [
            {
                stepIndex: 0,
                targetHex: "0x4F",
                action: "MOVE",
                dialogue: "Senzory detegujú nestabilné toky na pozícii 0x4F. Postupuj opatrne.",
                expectedHpImpact: 0
            },
            {
                stepIndex: 1,
                targetHex: "0x5A",
                action: "COMBAT",
                dialogue: "Pozor! Z energetického portálu sa vynára Void Walker. Priprav sa na boj.",
                expectedHpImpact: -15
            },
            {
                stepIndex: 2,
                targetHex: "0x82",
                action: "INTERACT",
                dialogue: "Anomália bola stabilizovaná. Získavaš prístup k systémovým registrom.",
                expectedHpImpact: 5
            }
        ],
        renderLayerModifications: {
            intensity: 0.85,
            deformScaleZ: 0.35
        }
    });

    const [currentStepIdx, setCurrentStepIdx] = useState(0);
    const [playerHP, setPlayerHP] = useState(80);
    const [playerHex, setPlayerHex] = useState("0x00");
    const [activeTargetHex, setActiveTargetHex] = useState("0x4F");
    const [llamaLatency, setLlamaLatency] = useState(125);
    const [questFloatingVisible, setQuestFloatingVisible] = useState(true);
    const [questLogs, setQuestLogs] = useState([
        "Quest Evolution initialized: Population size 30, Generations 50.",
        "Optimal path found via calculateFitness: 0x4F -> 0x5A -> 0x82 (Fitness: 145)",
        "Prompt compiled for LLaMA .cpp edge router."
    ]);

    const getShortNPCDialogue = (dialogue) => {
        if (!dialogue) return "Súvislosti na mape";
        const words = dialogue.trim().split(/\s+/).slice(0, 3);
        return words.join(" ");
    };

    const triggerQuestReplan = () => {
        const nextId = Math.floor(Math.random() * 1000);
        setSimulatedQuest({
            questId: `q_evolved_${nextId}`,
            title: `Quest anomália verzia #${nextId}`,
            steps: [
                {
                    stepIndex: 0,
                    targetHex: "0x4F",
                    action: "MOVE",
                    dialogue: "Zameraj zmeny magnetických polí na 0x4F.",
                    expectedHpImpact: 0
                },
                {
                    stepIndex: 1,
                    targetHex: "0x5A",
                    action: "COMBAT",
                    dialogue: "Nepriateľská jednotka blokuje cestu na 0x5A.",
                    expectedHpImpact: -20
                },
                {
                    stepIndex: 2,
                    targetHex: "0x82",
                    action: "INTERACT",
                    dialogue: "Hľadaj void anomáliu na 0x82.",
                    expectedHpImpact: 10
                }
            ],
            renderLayerModifications: {
                intensity: 0.9,
                deformScaleZ: 0.4
            }
        });
        setCurrentStepIdx(0);
        setPlayerHP(80);
        setPlayerHex("0x00");
        setActiveTargetHex("0x4F");
        setLlamaLatency(Math.floor(Math.random() * 50) + 100);
        setQuestLogs(prev => [
            ...prev,
            `[GEN] Evolutionary Quest Planner: re-ran mutation rate 0.15. Path: 0x4F -> 0x5A -> 0x82.`,
            `[LLAMA] Compiled prompt sent to Llama.cpp edge. Status: OK.`
        ]);
    };

    const executeQuestStep = () => {
        const stepsCount = simulatedQuest.steps.length;
        if (currentStepIdx >= stepsCount) return;
        
        const activeStep = simulatedQuest.steps[currentStepIdx];
        const nextIdx = currentStepIdx + 1;
        
        setPlayerHex(activeStep.targetHex);
        setPlayerHP(prev => Math.max(0, Math.min(100, prev + activeStep.expectedHpImpact)));
        
        setQuestLogs(prev => [
            ...prev,
            `[ENGINE_ACTION] Executed ${activeStep.action} at ${activeStep.targetHex}. HP: ${playerHP + activeStep.expectedHpImpact}`
        ]);

        if (nextIdx < stepsCount) {
            setCurrentStepIdx(nextIdx);
            setActiveTargetHex(simulatedQuest.steps[nextIdx].targetHex);
        } else {
            setCurrentStepIdx(stepsCount);
            setQuestLogs(prev => [
                ...prev,
                `[QUEST] Evolved Scenario fully completed successfully!`
            ]);
        }
    };

    useEffect(() => {
        fetch('/api/devops/statistics')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) setDevopsStats(data);
            })
            .catch(() => {});
    }, []);

    const triggerK8sHop = () => {
        const hexCoords = ['0x1F', '0x2B', '0x3C', '0x4E', '0x5D', '0x6A'];
        const randomHex = hexCoords[Math.floor(Math.random() * hexCoords.length)];
        const randomPodIdx = Math.floor(Math.random() * k8sPods.length);
        
        setK8sPods(prev => {
            const copy = [...prev];
            copy[randomPodIdx] = {
                ...copy[randomPodIdx],
                location: randomHex,
                cpu: `${Math.floor(Math.random() * 40) + 10}%`
            };
            return copy;
        });

        setK8sLogs(prev => [
            ...prev,
            `Routed coordinates to ${k8sPods[randomPodIdx].id} -> Position: ${randomHex}`
        ]);
    };

    const scaleK8s = (action) => {
        if (action === 'up') {
            const nextIdx = k8sPods.length + 1;
            setK8sPods(prev => [
                ...prev,
                { id: `pod-procedural-0${nextIdx}`, location: '0x00', status: 'RUNNING', cpu: '5%', memory: '128MB' }
            ]);
            setK8sLogs(prev => [...prev, `Spawning pod-procedural-0${nextIdx} into cluster.`]);
        } else if (k8sPods.length > 1) {
            setK8sPods(prev => prev.slice(0, prev.length - 1));
            setK8sLogs(prev => [...prev, `Evicted last active pod from operations cluster.`]);
        }
    };

    // Realities and Priority Templates States
    const [realities, setRealities] = useState([]);
    const [newRealityName, setNewRealityName] = useState('New Alternate Reality');
    const [newRealityPriority, setNewRealityPriority] = useState(1);
    const [newRealityMultiplier, setNewRealityMultiplier] = useState(1.0);
    const [newRealitySpecies, setNewRealitySpecies] = useState('["crystal", "toxic"]');

    // Spatial Guidance Cartesian HUD States
    const [spatialData, setSpatialData] = useState(null);
    const [selectedSourceId, setSelectedSourceId] = useState('');
    const [selectedTargetId, setSelectedTargetId] = useState('');
    const [selectedTargetType, setSelectedTargetType] = useState('threads'); // 'threads' | 'objects' | 'custom'
    const [customTargetCoords, setCustomTargetCoords] = useState({ meta: 0, hex: 0 });
    const [trajectoryLog, setTrajectoryLog] = useState([]);
    const [selected8DDir, setSelected8DDir] = useState('N');
    const [selected8DDist, setSelected8DDist] = useState(1);

    // Admin Logic Console States
    const [accessPoints, setAccessPoints] = useState([]);
    const [formula, setFormula] = useState('isRooted ^ lowHealth => dangerZone');
    const [propState, setPropState] = useState({
        isRooted: true,
        lowHealth: true,
        highEntropy: false,
        activeTurn: true,
        dangerZone: true,
        isStealthActive: true,
        hasSensorTrap: true,
        triggerTrap: false,
        hasActiveShield: true,
        damageIncoming: true,
        damageAbsorbed: true
    });
    const [logicEvaluationResult, setLogicEvaluationResult] = useState(null);
    const [adminDocs, setAdminDocs] = useState('');
    const [showDocs, setShowDocs] = useState(false);

    // Live API Inspector States
    const [fetchedApiEndpoint, setFetchedApiEndpoint] = useState('/api/scenarios/semantic-sector/thread_king_ai');
    const [fetchedApiData, setFetchedApiData] = useState(null);
    const [fetchedApiLatency, setFetchedApiLatency] = useState(null);
    const [fetchingApi, setFetchingApi] = useState(false);

    const triggerApiFetch = async (endpoint = fetchedApiEndpoint) => {
        setFetchingApi(true);
        const start = performance.now();
        try {
            const res = await fetch(`${endpoint}`);
            const data = await res.json();
            setFetchedApiData(data);
            setFetchedApiLatency(performance.now() - start);
        } catch (e) {
            setFetchedApiData({ error: e.message, success: false });
            setFetchedApiLatency(null);
        } finally {
            setFetchingApi(false);
        }
    };

    const fetchRealities = () => {
        fetch('/api/scenarios/realities')
            .then(res => res.json())
            .then(data => setRealities(data))
            .catch(() => {});
    };

    const handleCreateReality = async () => {
        try {
            await fetch('/api/scenarios/realities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newRealityName,
                    priority: newRealityPriority,
                    speciesAllowed: newRealitySpecies,
                    proceduralRules: JSON.stringify({ bloomMultiplier: 1.5, heightPerturb: true }),
                    combinatoricsMultiplier: newRealityMultiplier
                })
            });
            fetchRealities();
        } catch (e) {
            console.error('Failed to create reality template', e);
        }
    };

    const handleDeleteReality = async (id) => {
        try {
            await fetch(`/api/scenarios/realities/${id}`, {
                method: 'DELETE'
            });
            fetchRealities();
        } catch (e) {
            console.error('Failed to delete reality', e);
        }
    };

    const handleSwitchRealityPhase = async (phase) => {
        try {
            const res = await fetch('/api/scenarios/realities/active', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phase })
            });
            const data = await res.json();
            if (data.success && setRealityPhase) {
                setRealityPhase(data.activeRealityPhase);
            }
        } catch (e) {
            console.error('Failed to switch reality phase', e);
        }
    };

    const fetchSpatialData = () => {
        fetch('/api/scenarios/spatial-guidance/calculations')
            .then(res => res.json())
            .then(data => {
                setSpatialData(data);
                if (data.threads && data.threads.length > 0 && !selectedSourceId) {
                    setSelectedSourceId(data.threads[0].id);
                }
                if (data.threads && data.threads.length > 1 && !selectedTargetId) {
                    setSelectedTargetId(data.threads[1].id);
                } else if (data.objects && data.objects.length > 0 && !selectedTargetId) {
                    setSelectedTargetId(data.objects[0].meta + '_' + data.objects[0].hex);
                }
            })
            .catch(() => {});
    };

    const handleInjectTrajectoryScript = async (script, meta, hex) => {
        try {
            const res = await fetch('/api/scenarios/spatial-guidance/inject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    script,
                    meta,
                    hex,
                    description: `Cartesian Guidance inject [Source -> Target]`
                })
            });
            const data = await res.json();
            if (data.success) {
                setTrajectoryLog(prev => [...prev, {
                    timestamp: Date.now(),
                    script,
                    message: data.message
                }]);
            }
        } catch (e) {
            console.error('Failed to inject trajectory script', e);
        }
    };

    const fetchCompositions = () => {
        fetch('/api/admin/compositions')
            .then(res => res.json())
            .then(data => setGeneratedInstances(data))
            .catch(() => {});
    };

    const deleteComposition = async (id) => {
        try {
            await fetch(`/api/admin/compositions/${id}`, {
                method: 'DELETE'
            });
            fetchCompositions();
        } catch (e) {
            console.error('Failed to delete composition', e);
        }
    };

    const refreshDiagnostics = () => {
        setExpressStatus('CHECKING');
        setGoCoreStatus('CHECKING');
        
        fetch('/health')
            .then(() => setExpressStatus('ONLINE'))
            .catch(() => setExpressStatus('OFFLINE'));

        fetch('http://localhost:8081/')
            .then(() => setGoCoreStatus('ONLINE'))
            .catch(() => setGoCoreStatus('OFFLINE'));

        fetch('/api/telemetry')
            .then(res => res.json())
            .then(data => setTelemetryLogs(data.slice(0, 5)))
            .catch(() => {});
    };

    const fetchAccessPoints = () => {
        fetch(`/api/admin/access-points/${activeThreadId}`)
            .then(res => res.json())
            .then(data => setAccessPoints(data))
            .catch(() => {});
    };

    const handleOverrideSubmit = async (pointId, val) => {
        try {
            await fetch('/api/admin/access-points/override', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threadId: activeThreadId, pointId, value: val })
            });
            fetchAccessPoints();
        } catch (e) {
            console.error('Failed override', e);
        }
    };

    const handleLogicEvaluate = async () => {
        try {
            const res = await fetch('/api/admin/logic/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formula, state: propState })
            });
            const data = await res.json();
            setLogicEvaluationResult(data);
        } catch (e) {
            console.error('Failed evaluate logic', e);
        }
    };

    const fetchAdminDocs = () => {
        fetch('/api/admin/documentation')
            .then(res => res.text())
            .then(data => setAdminDocs(data))
            .catch(() => {});
    };

    useEffect(() => {
        fetch('/api/scenarios/hero-graphics')
            .then(res => res.json())
            .then(data => setHeroDataset(data))
            .catch(err => console.warn('[COMPOSITOR] Failed to fetch hero dataset'));

        fetch(`/api/scenarios/market-prices/${activeThreadId}`)
            .then(res => res.json())
            .then(data => setMarketData(data))
            .catch(err => console.warn('[COMPOSITOR] Failed to fetch market data'));

        refreshDiagnostics();
        fetchAccessPoints();
        fetchAdminDocs();
        fetchCompositions();
        fetchRealities();
        fetchSpatialData();
    }, [activeThreadId]);

    useEffect(() => {
        const config = {
            sourceId: selectedSourceId,
            targetId: selectedTargetId,
            targetType: selectedTargetType,
            customMeta: customTargetCoords.meta,
            customHex: customTargetCoords.hex,
            eightDDir: selected8DDir,
            eightDDist: selected8DDist
        };
        window.dispatchEvent(new CustomEvent('spatial_guidance_update', { detail: config }));
    }, [selectedSourceId, selectedTargetId, selectedTargetType, customTargetCoords, selected8DDir, selected8DDist]);

    const activeHero = useMemo(() => {
        if (!heroDataset) return null;
        return heroDataset.heroes.find(h => h.faction === selectedFaction) || null;
    }, [heroDataset, selectedFaction]);

    const triggerMlSpawn = async () => {
        setMlLoading(true);
        setMlResult(null);
        try {
            const res = await fetch('/api/scenarios/generate-tactical-instance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threadId: activeThreadId, tacticPrompt })
            });
            const data = await res.json();
            setMlResult(data);
            if (data && data.success) {
                fetchCompositions();
            }
            
            // Refresh telemetry
            const telRes = await fetch('/api/telemetry');
            const telData = await telRes.json();
            setTelemetryLogs(telData.slice(0, 5));
        } catch (e) {
            setMlResult({ error: e.message, success: false });
        } finally {
            setMlLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row w-full h-[520px] dota-hud-glass rounded-xl overflow-hidden font-mono text-xs text-slate-300">
            {/* Left Control Panel: Multi-tab Diagnostic & Customization view */}
            <div className="w-full md:w-1/3 p-4 flex flex-col gap-3 bg-slate-900/60 border-r border-purple-500/20 overflow-y-auto">
                
                {/* Tab selector */}
                <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-2">
                    {['compositor', 'diagnostics', 'quest_control', 'ai_simulator', 'cms_spawner', 'database', 'logic_console', 'realities', 'guidance', 'integration', 'kubernetes'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-1.5 py-1 rounded text-[9px] uppercase font-bold border transition-all ${
                                activeTab === tab 
                                    ? 'bg-purple-600 border-purple-400 text-white' 
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {tab === 'cms_spawner' ? 'CMS Spawner' : tab === 'realities' ? 'Realities' : tab === 'guidance' ? 'Guidance HUD' : tab === 'integration' ? 'API Inspector' : tab === 'kubernetes' ? 'K8s Nodes' : tab === 'quest_control' ? 'Quest Control' : tab === 'ai_simulator' ? 'AI Simulator' : tab.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {activeTab === 'compositor' && (
                    <>
                        <div>
                            <h3 className="text-purple-400 font-bold uppercase tracking-wider text-[10px] mb-1">🎭 Species & Faction</h3>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {['crystal', 'toxic', 'void', 'dru'].map((fac) => {
                                    const actualFac = fac === 'dru' ? 'druid' : fac;
                                    return (
                                        <button
                                            key={fac}
                                            onClick={() => setSelectedFaction(actualFac)}
                                            className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border transition-all ${
                                                selectedFaction === actualFac 
                                                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg' 
                                                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-400'
                                            }`}
                                        >
                                            {fac}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {activeHero && (
                            <div className="bg-slate-950/40 p-2.5 border border-slate-800 rounded flex flex-col gap-1 text-[10px]">
                                <span className="text-cyan-400 font-bold uppercase tracking-wider">🔬 Surface Aesthetics</span>
                                <div className="flex justify-between">
                                    <span>Mesh Scale:</span>
                                    <span className="text-slate-200">{activeHero.meshScale}x</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Default Roughness:</span>
                                    <span className="text-slate-200">{activeHero.surfaceProps.roughness}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Base Emissive:</span>
                                    <span className="text-slate-200">{activeHero.surfaceProps.emissiveIntensity}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Animation:</span>
                                    <span className="text-purple-300 font-bold">{activeHero.animations.walk}</span>
                                </div>
                            </div>
                        )}

                        {/* Aesthetic Market Prices */}
                        <div>
                            <h3 className="text-[#00ffff] font-bold uppercase tracking-wider text-[10px] mb-1">🛒 Biome Trading Rates</h3>
                            {marketData ? (
                                <div className="flex flex-col gap-1 mt-1">
                                    <div className="text-[9px] text-slate-400 italic">
                                        Sector: Chunk {marketData.chunkId} ({marketData.biome})
                                    </div>
                                    {marketData.items.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center p-1 bg-slate-950/40 border border-slate-800 rounded">
                                            <span className="text-[9px] font-semibold text-slate-300">{item.name}</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[8px] px-1 rounded bg-slate-800 text-slate-400 font-bold">{item.priceModifier}x</span>
                                                <span className="text-yellow-400 font-bold">{item.currentPrice}g</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-[9px] text-slate-500 italic mt-1">Connecting to market pricing...</div>
                            )}
                        </div>

                        {/* Custom Shader Sliders */}
                        <div className="flex flex-col gap-2 mt-1 pt-2 border-t border-slate-800">
                            <span className="text-pink-400 font-bold uppercase tracking-wider text-[9px]">🎛️ Shader Overrides</span>
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[9px] text-slate-400">
                                    <span>Matte Roughness:</span>
                                    <span>{roughnessOverride}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="1.0"
                                    step="0.05"
                                    value={roughnessOverride}
                                    onChange={(e) => setRoughnessOverride(parseFloat(e.target.value))}
                                    className="w-full h-1 bg-slate-800 rounded outline-none accent-purple-500"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[9px] text-slate-400">
                                    <span>Bloom Intensity:</span>
                                    <span>{bloomIntensity}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="3.0"
                                    step="0.1"
                                    value={bloomIntensity}
                                    onChange={(e) => setBloomIntensity(parseFloat(e.target.value))}
                                    className="w-full h-1 bg-slate-800 rounded outline-none accent-purple-500"
                                />
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'diagnostics' && (
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <h3 className="text-purple-400 font-bold uppercase tracking-wider text-[10px]">🩺 Port Diagnostics</h3>
                            <button onClick={refreshDiagnostics} className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[9px] font-bold">🔄 Refresh</button>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <div className="p-2 bg-slate-950/60 border border-slate-850 rounded flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-[10px]">Express REST Server</div>
                                    <div className="text-[9px] text-slate-500">Port 3001 (Node.js API)</div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    expressStatus === 'ONLINE' ? 'bg-green-950 text-green-400 border border-green-500/30' : 
                                    expressStatus === 'OFFLINE' ? 'bg-red-950 text-red-400 border border-red-500/30' : 'bg-yellow-950 text-yellow-400 border border-yellow-500/30'
                                }`}>
                                    {expressStatus}
                                </span>
                            </div>

                            <div className="p-2 bg-slate-950/60 border border-slate-850 rounded flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-[10px]">Go Core Engine</div>
                                    <div className="text-[9px] text-slate-500">Port 8081 (Batch Loader)</div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    goCoreStatus === 'ONLINE' ? 'bg-green-950 text-green-400 border border-green-500/30' : 
                                    goCoreStatus === 'OFFLINE' ? 'bg-red-950 text-red-400 border border-red-500/30' : 'bg-yellow-950 text-yellow-400 border border-yellow-500/30'
                                }`}>
                                    {goCoreStatus}
                                </span>
                            </div>

                            <div className="p-2 bg-slate-950/60 border border-slate-850 rounded flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-[10px]">SQLite Database</div>
                                    <div className="text-[9px] text-slate-500">File: database.db</div>
                                </div>
                                <span className="px-2 py-0.5 bg-green-950 text-green-400 border border-green-500/30 rounded text-[9px] font-bold">
                                    ACTIVE
                                </span>
                            </div>
                        </div>

                        <div className="bg-slate-950/30 p-2.5 rounded border border-slate-800 text-[9px] text-slate-400 flex flex-col gap-1">
                            <span className="text-[#00ffff] font-bold uppercase tracking-wider text-[9px] mb-1">🔗 Integration Topology</span>
                            <span>Client (5173) ── WebSocket ── Server (3001)</span>
                            <span>Server (3001) ── HTTP Call ── Go Core (8081)</span>
                            <span>Server (3001) ── execSync ── python3 (ML Script)</span>
                            <span>Server (3001) ── node:sqlite ── database.db</span>
                        </div>

                        <div className="bg-slate-950/30 p-2.5 rounded border border-slate-800 text-[9px] text-slate-400 flex flex-col gap-1.5 mt-2">
                            <span className="text-[#bf00ff] font-bold uppercase tracking-wider text-[9px] mb-1">🎮 Three.js Geometry Cache & Memory</span>
                            <div className="flex justify-between">
                                <span>Active Geometries:</span>
                                <span className="text-white font-bold">{geomCount} / 256 meshes</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Allocated Heap Memory:</span>
                                <span className="text-white font-bold">{heapSize} MB</span>
                            </div>
                            <div className="flex justify-between">
                                <span>WebGL Context Status:</span>
                                <span className="text-green-400 font-bold">HEALTHY (WebGL2)</span>
                            </div>
                            <button
                                onClick={runManualGC}
                                className="mt-1.5 w-full py-1 bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-300 rounded font-bold uppercase text-[8px] tracking-wider transition-all"
                            >
                                🗑️ Trigger Manual Garbage Collection
                            </button>
                            <button
                                onClick={handleAcquireItems}
                                className="mt-1.5 w-full py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded font-bold uppercase text-[8px] tracking-wider transition-all"
                            >
                                🎁 Acquire All Predicted Items
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'quest_control' && (
                    <div className="flex flex-col gap-2.5 animate-fadeIn overflow-y-auto max-h-[580px] pr-1">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                            <h3 className="text-purple-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                                🧬 Evolutionary Quest Control
                            </h3>
                            <span className="text-[7px] text-[#00ffff] font-mono border border-[#00ffff]/20 px-1 py-0.5 rounded bg-slate-900/60">
                                LLaMA DIRECTED
                            </span>
                        </div>

                        {/* Admin Meta Information */}
                        <div className="flex flex-col gap-2 border border-slate-850 p-2 rounded bg-slate-950/40">
                            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[8px]">Quest Meta Info</span>
                            <div className="grid grid-cols-2 gap-1.5 text-[8px] text-slate-400">
                                <div className="flex justify-between">
                                    <span>Population Size:</span>
                                    <span className="text-white font-bold">30</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Generations:</span>
                                    <span className="text-white font-bold">50</span>
                                </div>
                                <div className="flex justify-between col-span-2 border-t border-slate-900 pt-1">
                                    <span>Active Quest ID:</span>
                                    <span className="text-purple-400 font-bold text-center w-full">{simulatedQuest.questId}</span>
                                </div>
                                <div className="flex justify-between col-span-2">
                                    <span>Render Intensity:</span>
                                    <span className="text-yellow-400 font-bold">{simulatedQuest.renderLayerModifications.intensity}</span>
                                </div>
                                <div className="flex justify-between col-span-2">
                                    <span>DeformScaleZ:</span>
                                    <span className="text-pink-400 font-bold">{simulatedQuest.renderLayerModifications.deformScaleZ}</span>
                                </div>
                                <div className="flex justify-between col-span-2 border-t border-slate-900 pt-1">
                                    <span>Llama.cpp Latency:</span>
                                    <span className="text-emerald-400 font-bold">{llamaLatency} ms</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive simulation actions */}
                        <div className="flex flex-col gap-1.5 border border-slate-850 p-2 rounded bg-slate-950/40">
                            <span className="text-pink-400 font-bold uppercase tracking-wider text-[8px]">Simulation Actions</span>
                            
                            <button
                                onClick={triggerQuestReplan}
                                className="w-full py-1.5 bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-300 rounded font-bold uppercase text-[8px] tracking-wider transition-all"
                            >
                                🧬 Plan Evolved Path (LLaMA Run)
                            </button>

                            <button
                                onClick={executeQuestStep}
                                disabled={currentStepIdx >= simulatedQuest.steps.length}
                                className={`w-full py-1.5 border rounded font-bold uppercase text-[8px] tracking-wider transition-all ${
                                    currentStepIdx >= simulatedQuest.steps.length 
                                        ? 'bg-slate-950/20 border-slate-900 text-slate-600 cursor-not-allowed'
                                        : 'bg-cyan-950 hover:bg-cyan-900 border-cyan-500/40 text-cyan-300'
                                }`}
                            >
                                ⚡ Execute Next Step (Action Map)
                            </button>
                        </div>

                        {/* Interactive UI Toggle */}
                        <div className="flex flex-col gap-1 border border-slate-850 p-2 rounded bg-slate-950/40">
                            <div className="flex justify-between items-center text-[8px]">
                                <span className="text-slate-400 font-bold uppercase">Quest Objectives Overlay</span>
                                <button 
                                    onClick={() => setQuestFloatingVisible(prev => !prev)}
                                    className={`px-2 py-0.5 rounded border text-[8px] font-bold transition-all ${
                                        questFloatingVisible 
                                            ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' 
                                            : 'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}
                                >
                                    {questFloatingVisible ? 'VISIBLE (PINNED)' : 'HIDDEN'}
                                </button>
                            </div>
                        </div>

                        {/* System action and pipeline logs */}
                        <div className="flex flex-col gap-1 border border-slate-850 p-2 rounded bg-slate-950/40 flex-1 min-h-[120px] overflow-hidden">
                            <span className="text-yellow-400 font-bold uppercase tracking-wider text-[8px]">Quest Logs & Telemetry</span>
                            <div className="bg-slate-950 p-1.5 border border-slate-900 text-[7.5px] h-[100px] overflow-y-auto font-mono text-slate-300 leading-tight">
                                {questLogs.map((log, idx) => (
                                    <div key={idx} className={log.includes('ENGINE_ACTION') ? 'text-cyan-400' : log.includes('GEN') ? 'text-purple-400' : 'text-slate-400'}>
                                        {`> [SYSTEM] ${log}`}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'ai_simulator' && (
                    <div className="flex flex-col gap-2.5 animate-fadeIn">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                            <h3 className="text-[#39ff14] font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                                🤖 AI Match Simulator
                            </h3>
                            <button
                                onClick={startSimMatch}
                                className="px-2 py-0.5 bg-[#10b981] hover:bg-[#059669] rounded text-[9px] font-bold text-white transition-all"
                            >
                                🔄 Start Match
                            </button>
                        </div>

                        {/* HP status bars */}
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <div className="bg-slate-950/60 p-2 border border-slate-850 rounded">
                                <div className="text-[7.5px] text-slate-500 uppercase font-bold">Player (Crystal)</div>
                                <div className="text-sm font-bold text-cyan-400 mt-1">{simMatch.playerHP} / 25 HP</div>
                                <div className="w-full bg-slate-800 h-1 mt-1 rounded-full overflow-hidden">
                                    <div className="bg-cyan-500 h-full" style={{ width: `${(simMatch.playerHP / 25) * 100}%` }}></div>
                                </div>
                            </div>
                            <div className="bg-slate-950/60 p-2 border border-slate-850 rounded">
                                <div className="text-[7.5px] text-slate-500 uppercase font-bold">Sentinel Boss (NPC)</div>
                                <div className="text-sm font-bold text-rose-400 mt-1">{simMatch.bossHP} / 30 HP</div>
                                <div className="w-full bg-slate-800 h-1 mt-1 rounded-full overflow-hidden">
                                    <div className="bg-rose-500 h-full" style={{ width: `${(simMatch.bossHP / 30) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Hand Cards */}
                        <div className="flex flex-col gap-1.5 mt-1.5">
                            <span className="text-[8px] text-slate-500 uppercase font-bold">Available Hand Cards</span>
                            {simMatch.hand.length === 0 ? (
                                <span className="text-[9px] text-slate-500 italic">No cards. Start a match to draw cards.</span>
                            ) : (
                                <div className="grid grid-cols-3 gap-1.5">
                                    {simMatch.hand.map((card) => (
                                        <button
                                            key={card.id}
                                            onClick={() => playSimCard(card.id)}
                                            className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:border-cyan-500 text-left transition-all hover:bg-slate-850 flex flex-col justify-between h-[54px]"
                                        >
                                            <div className="font-bold text-[8px] text-white line-clamp-1">{card.name}</div>
                                            <div className="text-[6.5px] text-slate-500 line-clamp-2">{card.description}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Combat log feed */}
                        <div className="flex flex-col gap-1.5 mt-2">
                            <span className="text-[8px] text-slate-500 uppercase font-bold">Combat Log Feed</span>
                            <div className="bg-slate-950/80 border border-slate-850 rounded p-2 h-[120px] overflow-y-auto font-mono text-[7px] text-slate-400 flex flex-col gap-1">
                                {simMatch.logs.map((log, idx) => (
                                    <span key={idx} className={
                                        log.includes('Player') ? 'text-cyan-400' :
                                        log.includes('NPC') ? 'text-rose-400' :
                                        log.includes('Victory') ? 'text-yellow-400 font-bold' : 'text-slate-500'
                                    }>
                                        {log}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'cms_spawner' && (
                    <div className="flex flex-col gap-2.5">
                        <h3 className="text-purple-400 font-bold uppercase tracking-wider text-[10px]">🎚️ CMS & Semantic Coordinator</h3>
                        <p className="text-[10px] text-slate-400">Renders arrays, loops, and logic checks for procedural composition nodes:</p>
                        
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-400">Semantic Coordinator Prompt:</label>
                            <input 
                                type="text"
                                value={tacticPrompt} 
                                onChange={(e) => setTacticPrompt(e.target.value)}
                                placeholder="Type context (aggression, stealth, defense)..."
                                className="bg-slate-950 border border-slate-800 p-1.5 rounded text-[10px] text-white focus:outline-none focus:border-purple-500 w-full"
                            />
                        </div>

                        <button
                            onClick={triggerMlSpawn}
                            disabled={mlLoading}
                            className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:bg-slate-800 text-white rounded font-bold uppercase text-[10px] tracking-wider transition-all"
                        >
                            {mlLoading ? '🤖 Synthesizing CMS...' : '🚀 Coordinate & Display'}
                        </button>

                        {/* Loops & Arrays of Compositions */}
                        <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-900 pt-2">
                            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[8px]">📋 Generated Compositions Array</span>
                            
                            {generatedInstances.length > 0 ? (
                                <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
                                    {generatedInstances.map((inst, index) => {
                                        // Condition checks representing semantic structures
                                        const isHazard = inst.actionType.includes('trap') || inst.actionType.includes('mine');
                                        const isBarrier = inst.actionType.includes('barrier') || inst.actionType.includes('shield');
                                        const isStealth = inst.actionType.includes('invisibility') || inst.actionType.includes('smoke');
                                        const isHighPower = inst.powerRating > 2.0;

                                        return (
                                            <div key={inst.id || index} className="p-2 bg-slate-950/60 border border-slate-850 rounded text-[9px] flex flex-col gap-1">
                                                <div className="flex justify-between font-bold">
                                                    <span className="text-cyan-300 truncate">{inst.actionType}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-slate-500">{new Date(inst.timestamp).toLocaleTimeString()}</span>
                                                        <button 
                                                            onClick={() => deleteComposition(inst.id)} 
                                                            className="text-red-500 hover:text-red-400 font-bold cursor-pointer"
                                                            title="Delete composition"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="text-slate-400 leading-tight">"{inst.description}"</div>
                                                <div className="flex flex-wrap gap-1 mt-1 font-mono text-[8px]">
                                                    <span className="px-1 rounded bg-slate-800 text-slate-300">Chunk {inst.coordinates.meta}:{inst.coordinates.hex}</span>
                                                    <span className={`px-1 rounded font-bold ${isHighPower ? 'bg-amber-950 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>Rating: {inst.powerRating.toFixed(1)}</span>
                                                    {isHazard && <span className="px-1 rounded bg-red-950 text-red-400 font-bold">HAZARD_MINE</span>}
                                                    {isBarrier && <span className="px-1 rounded bg-blue-950 text-blue-400 font-bold">BARRIER_SHIELD</span>}
                                                    {isStealth && <span className="px-1 rounded bg-teal-950 text-teal-400 font-bold">STEALTH_SHROUD</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <span className="text-[9px] text-slate-600 italic">No generated nodes to loop through. Trigger spawner above.</span>
                            )}
                        </div>

                        {/* DevOps Pipeline Modulations */}
                        <div className="mt-2 p-2 bg-slate-950/40 border border-slate-900 rounded text-[8px] text-slate-500 flex flex-col gap-1 leading-normal">
                            <span className="text-pink-400 font-bold uppercase tracking-wider text-[8px]">⚙️ DevOps Pipeline Modulations</span>
                            <div>• <span className="text-slate-400">Dev:</span> Synchronous execution of local Python script in virtual environment.</div>
                            <div>• <span className="text-slate-400">Staging:</span> 150ms request timeout simulation; fails back to static template array.</div>
                            <div>• <span className="text-slate-400">Prod:</span> Asynchronous microservice orchestration; bypasses Python CLI bottleneck if latency exceeds 250ms.</div>
                        </div>
                    </div>
                )}

                {activeTab === 'database' && (
                    <div className="flex flex-col gap-2.5">
                        <div className="flex justify-between items-center">
                            <h3 className="text-purple-400 font-bold uppercase tracking-wider text-[10px]">📦 SQLite Telemetry Logs</h3>
                            <button onClick={refreshDiagnostics} className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[9px]">🔄 Sync</button>
                        </div>
                        <p className="text-[9px] text-slate-400">Stored active events inside database.db telemetry table:</p>
                        
                        <div className="flex flex-col gap-1.5">
                            {telemetryLogs.length > 0 ? (
                                telemetryLogs.map((log, index) => (
                                    <div key={index} className="p-1.5 bg-slate-950/60 border border-slate-850/60 rounded text-[9px] flex flex-col gap-0.5">
                                        <div className="flex justify-between text-slate-400 font-semibold text-[8px]">
                                            <span className="text-purple-400 uppercase">{log.eventType || 'Event'}</span>
                                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="text-slate-200 break-words">{log.details || log.message}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-[10px] text-slate-500 italic text-center py-4">No active telemetry logs in SQLite database.</div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'logic_console' && (
                    <div className="flex flex-col gap-2.5">
                        <div className="flex justify-between items-center">
                            <h3 className="text-purple-400 font-bold uppercase tracking-wider text-[10px]">⚙️ Deterministic Logic Console</h3>
                            <button onClick={fetchAccessPoints} className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[9px]">🔄 Sync</button>
                        </div>
                        
                        {/* Access Points List */}
                        <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto border border-slate-800 p-1.5 rounded bg-slate-950/40">
                            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">🔑 Administrator Access Points</span>
                            {accessPoints.map((pt) => (
                                <div key={pt.id} className="flex flex-col gap-1 bg-slate-950/60 p-1.5 border border-slate-900 rounded">
                                    <div className="flex justify-between text-[9px] font-bold">
                                        <span className="text-slate-200">{pt.name}</span>
                                        <span className="text-yellow-400">{String(pt.value)}</span>
                                    </div>
                                    <div className="text-[8px] text-slate-500">{pt.description}</div>
                                    
                                    {pt.canOverride && (
                                        <div className="flex gap-1.5 mt-1 items-center justify-between">
                                            <input 
                                                type="text" 
                                                placeholder="Override val..." 
                                                defaultValue={pt.value}
                                                onBlur={(e) => handleOverrideSubmit(pt.id, e.target.value)}
                                                className="bg-slate-900 border border-slate-750 px-1 py-0.5 rounded text-[8px] text-white w-2/3 focus:outline-none"
                                            />
                                            <span className="text-[7px] text-purple-400 uppercase select-none font-bold">Auto-Sync</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Propositional Logic Evaluator */}
                        <div className="flex flex-col gap-1.5 border border-slate-800 p-1.5 rounded bg-slate-950/40">
                            <span className="text-pink-400 font-bold uppercase tracking-wider text-[8px]">🧠 Propositional Logic Evaluator</span>
                            
                            <div className="flex flex-col gap-1">
                                <label className="text-[8px] text-slate-500">Logic Formula:</label>
                                <input 
                                    type="text" 
                                    value={formula}
                                    onChange={(e) => setFormula(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 px-1 py-0.5 rounded text-[9px] text-white focus:outline-none"
                                />
                                <div className="flex gap-2 text-[7px] text-slate-400 mt-0.5">
                                    <span className="cursor-pointer hover:text-white underline" onClick={() => setFormula('isStealthActive ^ hasSensorTrap => !triggerTrap')}>Preset 1 (Stealth Trap)</span>
                                    <span className="cursor-pointer hover:text-white underline" onClick={() => setFormula('hasActiveShield ^ damageIncoming => damageAbsorbed')}>Preset 2 (Active Shield)</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {Object.keys(propState).map((key) => (
                                    <label key={key} className="flex items-center gap-1 text-[8px] select-none text-slate-400">
                                        <input 
                                            type="checkbox"
                                            checked={propState[key]}
                                            onChange={(e) => setPropState({ ...propState, [key]: e.target.checked })}
                                            className="accent-pink-500"
                                        />
                                        {key}
                                    </label>
                                ))}
                            </div>

                            <button
                                onClick={handleLogicEvaluate}
                                className="w-full py-1 bg-pink-900 hover:bg-pink-850 text-white rounded font-bold uppercase text-[9px] tracking-wider transition-all mt-1"
                            >
                                Deterministic Evaluation
                            </button>

                            {logicEvaluationResult && (
                                <div className="p-1.5 bg-slate-950 rounded border border-slate-850 text-[8px] font-mono mt-1">
                                    <div className="flex justify-between">
                                        <span>Result:</span>
                                        <span className={logicEvaluationResult.result ? 'text-green-400' : 'text-red-400'}>{String(logicEvaluationResult.result).toUpperCase()}</span>
                                    </div>
                                    <div className="text-slate-500 mt-0.5 break-words">{logicEvaluationResult.evaluatedSteps}</div>
                                </div>
                            )}
                        </div>

                        {/* System Documentation and Brainstorming */}
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => { setShowDocs(!showDocs); if (!adminDocs) fetchAdminDocs(); }}
                                className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-[9px] uppercase tracking-wider transition-all"
                            >
                                {showDocs ? '📖 Hide System Specs' : '📖 View Brainstorming & Architecture Specs'}
                            </button>

                            {showDocs && adminDocs && (
                                <pre className="bg-slate-950 p-2 border border-slate-850 text-[7px] max-h-[100px] overflow-y-auto font-mono text-slate-400 leading-tight select-all">
                                    {adminDocs}
                                </pre>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'realities' && (
                    <div className="flex flex-col gap-2.5 animate-fadeIn">
                        <div className="flex justify-between items-center">
                            <h3 className="text-purple-400 font-bold uppercase tracking-wider text-[10px]">🌀 Procedural Realities</h3>
                            <button onClick={fetchRealities} className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[9px] font-bold">🔄 Reload</button>
                        </div>

                        {/* Active Reality Phase Switcher */}
                        <div className="flex flex-col gap-1.5 border border-slate-850 p-2 rounded bg-slate-950/40">
                            <span className="text-cyan-450 font-bold uppercase tracking-wider text-[8px]">Active Reality View: <span className="text-yellow-400 font-bold">{realityPhase}</span></span>
                            <div className="grid grid-cols-3 gap-1 mt-1">
                                {['STANDARD', 'SURGE', 'VOID', 'GLITCH', 'GRAVITY_WELL'].map(phase => (
                                    <button
                                        key={phase}
                                        onClick={() => handleSwitchRealityPhase(phase)}
                                        className={`px-1 py-1 rounded text-[8px] font-bold border transition-all truncate ${
                                            realityPhase === phase
                                                ? 'bg-cyan-600 border-cyan-400 text-white'
                                                : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-400'
                                        }`}
                                        title={phase}
                                    >
                                        {phase}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* DB Reality Priority Templates */}
                        <div className="flex flex-col gap-1.5 border border-slate-850 p-2 rounded bg-slate-950/40 max-h-[160px] overflow-y-auto">
                            <span className="text-pink-400 font-bold uppercase tracking-wider text-[8px]">Saved Priority Templates (DB)</span>
                            {realities.length > 0 ? (
                                realities.map((real) => (
                                    <div key={real.id} className="flex justify-between items-center bg-slate-950/60 p-1.5 border border-slate-900 rounded text-[9px]">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-200">{real.name} (P:{real.priority})</span>
                                            <span className="text-slate-500 text-[8px]">Mult: {real.combinatoricsMultiplier}x | Species: {real.speciesAllowed}</span>
                                        </div>
                                        <button onClick={() => handleDeleteReality(real.id)} className="text-red-400 hover:text-red-300 font-bold text-[10px]">✕</button>
                                    </div>
                                ))
                            ) : (
                                <span className="text-slate-500 italic text-[9px] text-center">No templates registered in DB.</span>
                            )}
                        </div>

                        {/* Create New Reality Template form */}
                        <div className="flex flex-col gap-1.5 border border-slate-850 p-2 rounded bg-slate-950/40">
                            <span className="text-purple-400 font-bold uppercase tracking-wider text-[8px]">Create Reality Template</span>
                            <div className="flex flex-col gap-1">
                                <input
                                    type="text"
                                    placeholder="Reality Name..."
                                    value={newRealityName}
                                    onChange={(e) => setNewRealityName(e.target.value)}
                                    className="bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded text-[9px] text-white focus:outline-none w-full"
                                />
                                <div className="flex gap-1.5">
                                    <input
                                        type="number"
                                        placeholder="Priority"
                                        value={newRealityPriority}
                                        onChange={(e) => setNewRealityPriority(Number(e.target.value))}
                                        className="bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded text-[9px] text-white focus:outline-none w-1/2"
                                    />
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Multiplier"
                                        value={newRealityMultiplier}
                                        onChange={(e) => setNewRealityMultiplier(Number(e.target.value))}
                                        className="bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded text-[9px] text-white focus:outline-none w-1/2"
                                    />
                                </div>
                                <input
                                    type="text"
                                    placeholder='Species e.g. ["crystal", "void"]...'
                                    value={newRealitySpecies}
                                    onChange={(e) => setNewRealitySpecies(e.target.value)}
                                    className="bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded text-[9px] text-white focus:outline-none w-full"
                                />
                                <button
                                    onClick={handleCreateReality}
                                    className="w-full py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold uppercase text-[9px] tracking-wider transition-all mt-1"
                                >
                                    Save Template
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'guidance' && (() => {
                    const localResolveCartesian = (m, h) => {
                        const macroCenters = [
                            { q: 0, r: 0 },   { q: 3, r: -1 },  { q: 6, r: -2 },
                            { q: -1, r: 3 },  { q: 2, r: 2 },   { q: 5, r: 1 },
                            { q: -2, r: 6 },  { q: 1, r: 5 },   { q: 4, r: 4 }
                        ];
                        const subHexOffsets = [
                            { q: 0, r: 0 },
                            { q: 1, r: 0 },  { q: 1, r: -1 }, { q: 0, r: -1 },
                            { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
                        ];
                        const center = macroCenters[m] || { q: 0, r: 0 };
                        const offset = subHexOffsets[h] || { q: 0, r: 0 };
                        const q = center.q + offset.q;
                        const r = center.r + offset.r;
                        const x = 2.0 * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
                        const z = 2.0 * (1.5 * r);
                        return { x, y: 0, z };
                    };

                    const threads = spatialData?.threads || [];
                    const objects = spatialData?.objects || [];

                    const sourceThread = threads.find(t => t.id === selectedSourceId) || threads[0];
                    const sourcePos = sourceThread ? { x: sourceThread.x, y: sourceThread.y, z: sourceThread.z } : { x: 0, y: 0, z: 0 };

                    let targetPos = { x: 0, y: 0, z: 0 };
                    let targetName = 'Target';
                    let targetMeta = 0;
                    let targetHex = 0;

                    if (selectedTargetType === 'threads') {
                        const tgt = threads.find(t => t.id === selectedTargetId) || threads[1] || threads[0];
                        if (tgt) {
                            targetPos = { x: tgt.x, y: tgt.y, z: tgt.z };
                            targetName = tgt.name;
                            targetMeta = tgt.meta || 0;
                            targetHex = tgt.hex || 0;
                        }
                    } else if (selectedTargetType === 'objects') {
                        const tgt = objects.find(o => `${o.meta}_${o.hex}` === selectedTargetId) || objects[0];
                        if (tgt) {
                            targetPos = { x: tgt.x, y: tgt.y, z: tgt.z };
                            targetName = `${tgt.type} (m:${tgt.meta} s:${tgt.hex})`;
                            targetMeta = tgt.meta;
                            targetHex = tgt.hex;
                        }
                    } else if (selectedTargetType === '8direction') {
                        targetPos = SpatialGuidanceSystem.resolveEightDirectionTarget(sourcePos, selected8DDir, selected8DDist);
                        targetName = `8-Direction Target (${selected8DDir} x ${selected8DDist})`;
                        targetMeta = 0;
                        targetHex = 0;
                    } else {
                        targetPos = localResolveCartesian(customTargetCoords.meta, customTargetCoords.hex);
                        targetName = `Custom Coordinate (m:${customTargetCoords.meta} s:${customTargetCoords.hex})`;
                        targetMeta = customTargetCoords.meta;
                        targetHex = customTargetCoords.hex;
                    }

                    const dx = targetPos.x - sourcePos.x;
                    const dy = targetPos.y - sourcePos.y;
                    const dz = targetPos.z - sourcePos.z;
                    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

                    const generatedScript = `// AUTO-GENERATED DETERMINISTIC SPATIAL TRAJECTORY SCRIPT
// SOURCE: ${sourceThread?.name || 'unknown'}
// TARGET: ${targetName}
// CARTESIAN SOURCE XYZ: [${sourcePos.x.toFixed(2)}, ${sourcePos.y.toFixed(2)}, ${sourcePos.z.toFixed(2)}]
// CARTESIAN TARGET XYZ: [${targetPos.x.toFixed(2)}, ${targetPos.y.toFixed(2)}, ${targetPos.z.toFixed(2)}]
// TRAJECTORY DELTA VECTOR: dx: ${dx.toFixed(2)}, dy: ${dy.toFixed(2)}, dz: ${dz.toFixed(2)}
// EUCLIDEAN 3D DISTANCE: ${dist.toFixed(3)} units

INITIATE_TRAJECTORY_VECTOR(${sourcePos.x.toFixed(3)}, ${sourcePos.y.toFixed(3)}, ${sourcePos.z.toFixed(3)}, ${targetPos.x.toFixed(3)}, ${targetPos.y.toFixed(3)}, ${targetPos.z.toFixed(3)});
DISPLACE_THREAD_COMPLEX_PATH(${dist.toFixed(3)});
SYNC_CARTEZIAN_COORDINATES();`;

                    return (
                        <div className="flex flex-col gap-2.5 animate-fadeIn">
                            <div className="flex justify-between items-center">
                                <h3 className="text-purple-400 font-bold uppercase tracking-wider text-[10px]">📍 Cartesian Guidance HUD</h3>
                                <button onClick={fetchSpatialData} className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[9px] font-bold">🔄 Recalculate</button>
                            </div>

                            {/* Source Selection */}
                            <div className="flex flex-col gap-1 border border-slate-850 p-1.5 rounded bg-slate-950/40">
                                <span className="text-cyan-400 font-bold uppercase tracking-wider text-[8px]">1. Source Position</span>
                                <select 
                                    value={selectedSourceId} 
                                    onChange={(e) => setSelectedSourceId(e.target.value)}
                                    className="bg-slate-950 border border-slate-850 px-1 py-0.5 rounded text-[9px] text-white focus:outline-none"
                                >
                                    {threads.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} (X:{t.x.toFixed(1)} Z:{t.z.toFixed(1)})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Target Selection */}
                            <div className="flex flex-col gap-1 border border-slate-850 p-1.5 rounded bg-slate-950/40">
                                <div className="flex justify-between items-center">
                                    <span className="text-pink-400 font-bold uppercase tracking-wider text-[8px]">2. Target Position</span>
                                    <div className="flex gap-1.5">
                                        {['threads', 'objects', 'custom', '8direction'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setSelectedTargetType(type)}
                                                className={`px-1 py-0.5 text-[7px] uppercase font-bold rounded ${selectedTargetType === type ? 'bg-pink-700 text-white' : 'bg-slate-800 text-slate-400'}`}
                                            >
                                                {type === '8direction' ? '8-DIR Vector' : type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selectedTargetType === 'threads' && (
                                    <select 
                                        value={selectedTargetId} 
                                        onChange={(e) => setSelectedTargetId(e.target.value)}
                                        className="bg-slate-950 border border-slate-850 px-1 py-0.5 rounded text-[9px] text-white focus:outline-none w-full"
                                    >
                                        {threads.map(t => (
                                            <option key={t.id} value={t.id}>{t.name} (X:{t.x.toFixed(1)} Z:{t.z.toFixed(1)})</option>
                                        ))}
                                    </select>
                                )}

                                {selectedTargetType === 'objects' && (
                                    <select 
                                        value={selectedTargetId} 
                                        onChange={(e) => setSelectedTargetId(e.target.value)}
                                        className="bg-slate-950 border border-slate-850 px-1 py-0.5 rounded text-[9px] text-white focus:outline-none w-full"
                                    >
                                        {objects.length > 0 ? (
                                            objects.map(o => (
                                                <option key={`${o.meta}_${o.hex}`} value={`${o.meta}_${o.hex}`}>{o.type} (m:{o.meta} s:{o.hex})</option>
                                            ))
                                        ) : (
                                            <option value="">No environmental targets</option>
                                        )}
                                    </select>
                                )}

                                {selectedTargetType === 'custom' && (
                                    <div className="flex gap-1.5 mt-0.5">
                                        <input
                                            type="number"
                                            placeholder="Meta"
                                            value={customTargetCoords.meta}
                                            onChange={(e) => setCustomTargetCoords({ ...customTargetCoords, meta: Number(e.target.value) })}
                                            className="bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded text-[9px] text-white focus:outline-none w-1/2"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Hex"
                                            value={customTargetCoords.hex}
                                            onChange={(e) => setCustomTargetCoords({ ...customTargetCoords, hex: Number(e.target.value) })}
                                            className="bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded text-[9px] text-white focus:outline-none w-1/2"
                                        />
                                    </div>
                                )}

                                {selectedTargetType === '8direction' && (
                                    <div className="flex gap-1.5 mt-0.5">
                                        <select
                                            value={selected8DDir}
                                            onChange={(e) => setSelected8DDir(e.target.value)}
                                            className="bg-slate-950 border border-slate-850 px-1 py-0.5 rounded text-[9px] text-white focus:outline-none w-1/2"
                                        >
                                            {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map(dir => (
                                                <option key={dir} value={dir}>{dir} ({dir === 'N' ? 'Sever' : dir === 'NE' ? 'Severovýchod' : dir === 'E' ? 'Východ' : dir === 'SE' ? 'Juhovýchod' : dir === 'S' ? 'Juh' : dir === 'SW' ? 'Juhozápad' : dir === 'W' ? 'Západ' : 'Severozápad'})</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={selected8DDist}
                                            onChange={(e) => setSelected8DDist(Number(e.target.value))}
                                            className="bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded text-[9px] text-white focus:outline-none w-1/2"
                                            placeholder="Steps"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Cartesian Trajectory Metrics */}
                            <div className="flex flex-col gap-1 border border-slate-850 p-1.5 rounded bg-slate-950/40 text-[9px]">
                                <span className="text-yellow-450 font-bold uppercase tracking-wider text-[8px]">3. Cartesian Metrics</span>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Euclidean 3D Distance:</span>
                                    <span className="font-bold text-cyan-400">{dist.toFixed(3)} units</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Slope Delta vector:</span>
                                    <span className="font-bold text-yellow-400">dx: {dx.toFixed(2)} | dz: {dz.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Auto-Generated Script Injector */}
                            <div className="flex flex-col gap-1 border border-slate-850 p-1.5 rounded bg-slate-950/40">
                                <span className="text-purple-400 font-bold uppercase tracking-wider text-[8px]">4. Trajectory Script Scripting</span>
                                <pre className="bg-slate-950 p-1.5 border border-slate-900 text-[7px] max-h-[90px] overflow-y-auto font-mono text-slate-400 leading-tight">
                                    {generatedScript}
                                </pre>
                                <button
                                    onClick={() => handleInjectTrajectoryScript(generatedScript, targetMeta, targetHex)}
                                    className="w-full py-1 bg-purple-700 hover:bg-purple-650 text-white rounded font-bold uppercase text-[9px] tracking-wider transition-all mt-1"
                                >
                                    Inject Spatial Script
                                </button>
                            </div>

                            {/* Trajectory Log */}
                            {trajectoryLog.length > 0 && (
                                <div className="flex flex-col gap-1 border border-slate-850 p-1.5 rounded bg-slate-950/40 max-h-[80px] overflow-y-auto">
                                    <span className="text-green-400 font-bold uppercase tracking-wider text-[8px]">Injected Real-Time Logs</span>
                                    {trajectoryLog.map((log, idx) => (
                                        <div key={idx} className="flex justify-between text-[8px] bg-slate-950/60 p-1 border border-slate-900 rounded">
                                            <span className="text-slate-400">Trajectory Injected</span>
                                            <span className="text-green-400 font-bold">SUCCESS</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {activeTab === 'integration' && (
                    <div className="flex flex-col gap-2.5 animate-fadeIn overflow-y-auto max-h-[580px] pr-1">
                        {/* Title Section */}
                        <div className="flex justify-between items-center">
                            <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">🔌 Real-Time API Inspector</h3>
                            <div className="flex gap-1">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                                <span className="text-[8px] text-emerald-400 font-bold">ONLINE</span>
                            </div>
                        </div>

                        {/* API Endpoint selector */}
                        <div className="flex flex-col gap-1 border border-slate-850 p-1.5 rounded bg-slate-950/40">
                            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[8px]">Select API Endpoint</span>
                            <select 
                                value={fetchedApiEndpoint} 
                                onChange={(e) => {
                                    setFetchedApiEndpoint(e.target.value);
                                    triggerApiFetch(e.target.value);
                                }}
                                className="bg-slate-950 border border-slate-850 px-1 py-0.5 rounded text-[9px] text-white focus:outline-none w-full"
                            >
                                <option value="/api/scenarios/semantic-sector/thread_king_ai">/api/scenarios/semantic-sector (Sector Info)</option>
                                <option value="/api/scenarios/terrain-telemetry/thread_king_ai">/api/scenarios/terrain-telemetry (Friction Textures)</option>
                                <option value="/api/scenarios/market-prices/thread_king_ai">/api/scenarios/market-prices (Market Values)</option>
                                <option value="/api/scenarios/hero-graphics">/api/scenarios/hero-graphics (Graphics Dataset)</option>
                                <option value="/api/scenarios/realities">/api/scenarios/realities (SQLite Realities List)</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1 border border-slate-850 p-1.5 rounded bg-slate-950/40">
                            <button
                                onClick={() => triggerApiFetch()}
                                className="w-full py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded font-bold uppercase text-[9px] tracking-wider transition-all"
                            >
                                {fetchingApi ? 'Fetching payload...' : 'Send FETCH request'}
                            </button>
                        </div>

                        {fetchedApiLatency !== null && (
                            <div className="flex justify-between text-[8px] px-1 text-slate-400">
                                <span>Fetch Latency:</span>
                                <span className="text-emerald-400 font-bold">{fetchedApiLatency.toFixed(1)} ms</span>
                            </div>
                        )}

                        <div className="flex flex-col gap-1 border border-slate-850 p-1.5 rounded bg-slate-950/40 min-h-[100px] overflow-hidden">
                            <span className="text-pink-400 font-bold uppercase tracking-wider text-[8px]">Fetched Payload Output</span>
                            <pre className="bg-slate-950 p-1 border border-slate-900 text-[8px] h-[90px] overflow-auto font-mono text-slate-300 leading-tight">
                                {fetchedApiData ? JSON.stringify(fetchedApiData, null, 2) : '// No data fetched yet. Select or click "Send FETCH request".'}
                            </pre>
                        </div>

                        {/* Sandbox & Caching Engine Integration Panel */}
                        <div className="flex flex-col gap-2 border border-[#00ffff]/20 p-2 rounded bg-slate-950/60 shadow-[0_0_15px_rgba(0,255,255,0.05)] mt-1">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                                <h4 className="text-[#00ffff] font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                                    ⚙️ Sandbox & Cache Controller
                                </h4>
                                <span className="text-[7px] text-[#00ffff]/60 font-mono">RAM GOVERNOR</span>
                            </div>

                            {/* Active Loops Integration: Quest Selection & Travel Target */}
                            <div className="grid grid-cols-2 gap-1.5 text-[8px]">
                                <div className="flex flex-col gap-1">
                                    <span className="text-slate-400 uppercase font-bold">Active Quest Target</span>
                                    <select
                                        value={selectedQuest}
                                        onChange={(e) => setSelectedQuest(e.target.value)}
                                        className="bg-slate-950 border border-slate-800 text-white rounded p-0.5 text-[8px]"
                                    >
                                        <option value="q_01_resonate">Crystal Resonance Quest</option>
                                        <option value="q_02_toxic">Swamp Toxicity Purge</option>
                                        <option value="q_03_mulligan">Barrens Mulligan Run</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-slate-400 uppercase font-bold">Travel Destination</span>
                                    <select
                                        value={travelDestination}
                                        onChange={(e) => setTravelDestination(e.target.value)}
                                        className="bg-slate-950 border border-slate-800 text-white rounded p-0.5 text-[8px]"
                                    >
                                        <option value="0x4F">Altar block 0x4F (Chunk 2)</option>
                                        <option value="0x5A">Obelisk block 0x5A (Chunk 3)</option>
                                        <option value="0x12">Swamp block 0x12 (Chunk 1)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Visible Chunk Slide controller */}
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase">
                                    <span>Visible Chunk Range (Chessboard)</span>
                                    <span className="text-cyan-400 font-bold">{visibleDistance} Chunks</span>
                                </div>
                                <input
                                    type="range"
                                    min="4"
                                    max="9"
                                    value={visibleDistance}
                                    onChange={(e) => {
                                        const dist = parseInt(e.target.value);
                                        setVisibleDistance(dist);
                                        setCacheAlerts(prev => [
                                            ...prev,
                                            `Rescaled chessboard grid culling distance to: ${dist} chunks.`
                                        ]);
                                    }}
                                    className="accent-cyan-500 bg-slate-900 border border-slate-800 rounded h-1 cursor-pointer w-full"
                                />
                            </div>

                            {/* Purge Cache Action */}
                            <button
                                onClick={triggerPurge}
                                className="w-full py-1 bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 hover:text-white rounded font-bold uppercase text-[8px] tracking-widest transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                            >
                                🗑️ EVICT OUT-OF-BOUNDS CACHE & FREE RAM
                            </button>

                            {/* Cache alerts log */}
                            <div className="flex flex-col gap-0.5 border border-slate-850 p-1.5 rounded bg-slate-950/90 h-[75px] overflow-y-auto min-h-[75px] font-mono leading-tight text-[7px] text-slate-400">
                                {cacheAlerts.map((log, idx) => (
                                    <div key={idx} className={log.includes('Freed') || log.includes('Purged') ? 'text-emerald-400/90' : 'text-slate-400'}>
                                        {`> [CACHE_MONITOR] ${log}`}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'kubernetes' && (
                    <div className="flex flex-col gap-2.5 animate-fadeIn overflow-y-auto max-h-[580px] pr-1">
                        {/* Title Section */}
                        <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                            <h3 className="text-purple-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                                ☸️ K8s Game Operations Monitor
                            </h3>
                            <span className="text-[7px] text-[#00ffff] font-mono border border-[#00ffff]/20 px-1 py-0.5 rounded bg-slate-900/60">
                                CLUSTER ACTIVE
                            </span>
                        </div>

                        {/* Cluster metrics */}
                        <div className="grid grid-cols-3 gap-1.5 text-[8px] bg-slate-950/40 p-1.5 border border-slate-850 rounded">
                            <div className="flex flex-col items-center">
                                <span className="text-slate-500 uppercase font-bold">Total Nodes</span>
                                <span className="text-white font-bold text-[10px] mt-0.5">{k8sPods.length} / 8</span>
                            </div>
                            <div className="flex flex-col items-center border-x border-slate-800">
                                <span className="text-slate-500 uppercase font-bold">Fragmentation</span>
                                <span className="text-yellow-400 font-bold text-[10px] mt-0.5">23.4%</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-slate-500 uppercase font-bold">Status</span>
                                <span className="text-emerald-400 font-bold text-[10px] mt-0.5">HEALTHY</span>
                            </div>
                        </div>

                        {/* Cluster pods layout list */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[8px]">Active Game Mesh Pods</span>
                            {k8sPods.map((pod) => (
                                <div key={pod.id} className="flex justify-between items-center border border-slate-850 p-1.5 rounded bg-slate-900/40 hover:bg-slate-900/80 transition-all">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-white font-bold">{pod.id}</span>
                                        <span className="text-[7px] text-[#00ffff] font-mono mt-0.5">
                                            Coordinate Node: <span className="underline">{pod.location}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex flex-col items-end text-[7px] text-slate-400 font-mono">
                                            <span>CPU: {pod.cpu}</span>
                                            <span>RAM: {pod.memory}</span>
                                        </div>
                                        <span className="text-[7px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1 py-0.5 rounded uppercase">
                                            {pod.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Kubernetes Cluster scaling and operations controls */}
                        <div className="flex flex-col gap-1 border border-slate-850 p-1.5 rounded bg-slate-950/40">
                            <span className="text-pink-400 font-bold uppercase tracking-wider text-[8px]">Kubernetes Scaling Controls</span>
                            <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                                <button
                                    onClick={() => scaleK8s('up')}
                                    className="py-1 bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-300 rounded font-bold uppercase text-[8px] tracking-wider transition-all"
                                >
                                    ➕ Scale Pods Up
                                </button>
                                <button
                                    onClick={() => scaleK8s('down')}
                                    className="py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded font-bold uppercase text-[8px] tracking-wider transition-all"
                                >
                                    ➖ Scale Pods Down
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 border border-slate-850 p-1.5 rounded bg-slate-950/40">
                            <button
                                onClick={triggerK8sHop}
                                className="w-full py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded font-bold uppercase text-[8px] tracking-wider transition-all"
                            >
                                ⚡ Simulate Network Telemetry Hop (Position Log)
                            </button>
                        </div>

                        {/* Live Hexadecimal telemetry logs from cluster */}
                        <div className="flex flex-col gap-1 border border-slate-850 p-1.5 rounded bg-slate-950/40 flex-1 min-h-[90px] overflow-hidden">
                            <span className="text-yellow-400 font-bold uppercase tracking-wider text-[8px]">Kubernetes Adapted Hex Logs</span>
                            <div className="bg-slate-950 p-1.5 border border-slate-900 text-[8px] h-[80px] overflow-y-auto font-mono text-slate-300 leading-tight">
                                {k8sLogs.map((log, idx) => (
                                    <div key={idx} className={log.includes('Routed') ? 'text-cyan-400' : 'text-slate-400'}>
                                        {`> [K8S] ${log}`}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Vercel DevOps Telemetry & Speculative Calculations Panel */}
                        <div className="flex flex-col gap-1.5 border border-[#00ffff]/20 p-2 rounded bg-slate-950/60 shadow-[0_0_15px_rgba(0,255,255,0.05)] mt-1">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                                <h4 className="text-[#00ffff] font-bold uppercase tracking-wider text-[9px]">
                                    🚀 Vercel DevOps Telemetry
                                </h4>
                                <span className="text-[7px] text-[#00ffff]/60 font-mono">SPECULATIVE MATRIX</span>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5 text-[8px] text-slate-400">
                                <div className="flex justify-between">
                                    <span>Lines of Code (LOC):</span>
                                    <span className="text-white font-bold">{devopsStats.linesOfCode}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Compile Time:</span>
                                    <span className="text-white font-bold">{devopsStats.compileTimeMs} ms</span>
                                </div>
                                <div className="flex justify-between col-span-2 border-t border-slate-900 pt-1">
                                    <span>HeightDeformModifier:</span>
                                    <span className="text-cyan-400 font-bold">{(devopsStats.linesOfCode / 10000).toFixed(2)} units</span>
                                </div>
                                <div className="flex justify-between col-span-2">
                                    <span>GearTeethModifier Vertices:</span>
                                    <span className="text-pink-400 font-bold">{Math.round(devopsStats.compileTimeMs / 50)} points</span>
                                </div>
                            </div>

                            <div className="text-[7px] text-slate-500 font-mono text-center mt-0.5 border-t border-slate-900 pt-1">
                                [GOVERNOR] Modifier updates debounced to 10Hz (Rule 12 compliant)
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel: Interactive 3D Canvas Preview */}
            <div className="flex-1 relative bg-[#06060c]">
                
                {/* Floating Quest Overlay Window (Toggled to prevent overlapping crucial game interactions) */}
                {questFloatingVisible ? (
                    <div className="absolute top-3 left-3 w-[200px] dota-hud-glass rounded-lg p-2.5 box-border font-mono text-[8px] text-[#ececf1] z-10 shadow-2xl backdrop-blur-md">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-1 mb-1.5">
                            <span className="text-purple-400 font-bold uppercase tracking-wider text-[7.5px] flex items-center gap-1">
                                📜 Quest Objectives
                            </span>
                            <button 
                                onClick={() => setQuestFloatingVisible(false)} 
                                className="text-slate-500 hover:text-white bg-none border-none cursor-pointer text-[9px] font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <div className="font-bold text-[9px] text-white">{simulatedQuest.title}</div>
                            <div className="flex justify-between text-[7px] text-slate-500">
                                <span>Quest ID:</span>
                                <span>{simulatedQuest.questId}</span>
                            </div>
                            
                            {/* Checklist steps */}
                            <div className="flex flex-col gap-1 mt-1">
                                {simulatedQuest.steps.map((step, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`p-1 border rounded flex flex-col gap-0.5 ${
                                            idx === currentStepIdx 
                                                ? 'bg-purple-950/40 border-purple-500/60 text-white font-bold' 
                                                : idx < currentStepIdx 
                                                    ? 'bg-slate-950/20 border-slate-900 text-slate-500 line-through' 
                                                    : 'bg-slate-950/40 border-slate-900 text-slate-400'
                                        }`}
                                    >
                                        <div className="flex justify-between">
                                            <span>{step.stepIndex + 1}. {step.action} ({step.targetHex})</span>
                                            {idx === currentStepIdx && <span className="text-yellow-400 animate-pulse text-[7px]">ACTIVE</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Player Status info */}
                            <div className="border-t border-slate-900 pt-1.5 mt-1.5 flex justify-between items-center text-[7.5px]">
                                <div>
                                    <span className="text-slate-500 block uppercase text-[6.5px]">Position</span>
                                    <span className="text-cyan-400 font-bold">{playerHex}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-slate-500 block uppercase text-[6.5px]">HP Pool</span>
                                    <span className={`font-bold ${playerHP < 30 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>{playerHP} HP</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={() => setQuestFloatingVisible(true)}
                        className="absolute top-3 left-3 px-2 py-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 rounded font-bold uppercase text-[8px] tracking-wider z-10 transition-all shadow-[0_0_10px_rgba(147,51,234,0.15)]"
                    >
                        📜 View Quest Objectives
                    </button>
                )}

                <Canvas shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [0, 2, 4], fov: 45 }}>
                    <ambientLight intensity={0.4} />
                    <directionalLight position={[5, 10, 5]} intensity={1.5} />
                    <ParallaxLightsAndNPCs playerHex={playerHex} activeTargetHex={activeTargetHex} activeHero={activeHero} />
                    <PathTrajectoryLine steps={simulatedQuest.steps} />

                    {/* Preview 3D Matte Sphere representing selected species */}
                    <mesh castShadow receiveShadow>
                        <sphereGeometry args={[0.8, 32, 32]} />
                        <meshStandardMaterial
                            color={activeHero ? activeHero.colorPalette.primary : '#00eeff'}
                            roughness={roughnessOverride}
                            metalness={0.1}
                            emissive={activeHero ? activeHero.colorPalette.glow : '#00ffff'}
                            emissiveIntensity={activeHero ? activeHero.surfaceProps.emissiveIntensity * 0.4 : 0.5}
                        />
                    </mesh>

                    {/* Evolved Hex coordinates on the map */}
                    <mesh position={[-1.2, -0.85, -1.2]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.5, 0.5, 0.1, 6]} />
                        <meshStandardMaterial color={activeTargetHex === '0x4F' ? '#ffaa00' : '#1c1c28'} roughness={0.3} />
                    </mesh>
                    <mesh position={[1.2, -0.85, -0.6]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.5, 0.5, 0.1, 6]} />
                        <meshStandardMaterial color={activeTargetHex === '0x5A' ? '#ff3366' : '#1c1c28'} roughness={0.3} />
                    </mesh>
                    <mesh position={[0, -0.85, 1.5]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.5, 0.5, 0.1, 6]} />
                        <meshStandardMaterial color={activeTargetHex === '0x82' ? '#00ffcc' : '#1c1c28'} roughness={0.3} />
                    </mesh>

                    {/* Player Position Sphere */}
                    <mesh position={(() => {
                        const base = hexToPos(playerHex);
                        return [base[0], base[1] + 0.35, base[2]];
                    })()} castShadow>
                        <sphereGeometry args={[0.15, 16, 16]} />
                        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.8} />
                    </mesh>

                    {/* Target beam indicator showing selected step action */}
                    <mesh position={(() => {
                        const base = hexToPos(activeTargetHex);
                        return [base[0], base[1] + 0.05, base[2]];
                    })()}>
                        <cylinderGeometry args={[0.4, 0.4, 0.05, 16]} />
                        <meshBasicMaterial color={
                            simulatedQuest.steps[currentStepIdx]?.action === 'COMBAT' ? '#ff3366' :
                            simulatedQuest.steps[currentStepIdx]?.action === 'INTERACT' ? '#00ffcc' : '#ffaa00'
                        } wireframe />
                    </mesh>

                    {/* NPC model at active node */}
                    <mesh position={[0, -0.6, 1.5]} castShadow>
                        <coneGeometry args={[0.12, 0.4, 4]} />
                        <meshStandardMaterial color="#39ff14" />
                    </mesh>

                    {/* Short Dialogue bubble - 3 words Slovakia response */}
                    {simulatedQuest.steps[currentStepIdx]?.action === 'INTERACT' && (
                        <Html position={[0, -0.35, 1.5]} center>
                            <div className="bg-[#0c0c14]/95 text-[#00ffcc] border border-[#00ffcc]/40 rounded-xl px-2.5 py-1 text-[8px] font-bold font-mono whitespace-nowrap shadow-2xl select-none animate-bounce">
                                💬 {getShortNPCDialogue(simulatedQuest.steps[currentStepIdx].dialogue)}
                            </div>
                        </Html>
                    )}

                    {/* Glowing Wireframe Outer Ring (Topology representation) */}
                    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
                        <ringGeometry args={[1.1, 1.2, 32]} />
                        <meshBasicMaterial color={activeHero ? activeHero.colorPalette.glow : '#00ffff'} side={2} />
                    </mesh>

                    <OrbitControls enableZoom={true} maxPolarAngle={Math.PI / 2} />

                    <EffectComposer>
                        <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} height={300} intensity={bloomIntensity} />
                    </EffectComposer>
                </Canvas>

                {/* Floating Aesthetic Overlay Tag */}
                <div className="absolute top-3 right-3 p-1.5 bg-slate-950/80 border border-[#00ffff]/20 rounded text-[9px] text-[#00ffff] font-mono font-bold tracking-wider uppercase select-none">
                    ✨ UNIFIED INTEGRATION CONSOLE
                </div>
            </div>
        </div>
    );
}
