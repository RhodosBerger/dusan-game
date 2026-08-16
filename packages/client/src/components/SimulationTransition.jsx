import React, { useState, useEffect, useRef } from 'react';

/**
 * AAA Game Transition System with Canvas Skew Animation
 * 
 * Features:
 * - Full-screen canvas-based transition effects
 * - Skew/warp distortion for simulation entry
 * - Hearthstone-style "match start" cinematic flow
 * - Smooth UI hide/reveal with staggered animations
 * - Particle burst on transition completion
 */

export default function SimulationTransition({ 
    isActive = false, 
    onComplete,
    transitionType = 'warp', // 'warp', 'shatter', 'portal'
    duration = 2000 
}) {
    const canvasRef = useRef(null);
    const [phase, setPhase] = useState('idle'); // idle, building, warping, resolving, complete
    const animationRef = useRef(null);
    const startTimeRef = useRef(null);

    useEffect(() => {
        if (!isActive) {
            setPhase('idle');
            return;
        }

        setPhase('building');
        startTimeRef.current = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1.0);

            if (progress < 0.3) {
                setPhase('building');
            } else if (progress < 0.7) {
                setPhase('warping');
            } else if (progress < 0.95) {
                setPhase('resolving');
            } else {
                setPhase('complete');
                onComplete?.();
            }

            renderFrame(progress, elapsed);

            if (progress < 1.0) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isActive, duration, onComplete]);

    const renderFrame = (progress, elapsed) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear with trail effect for motion blur
        ctx.fillStyle = `rgba(5, 5, 15, ${0.3 + progress * 0.4})`;
        ctx.fillRect(0, 0, width, height);

        if (transitionType === 'warp') {
            renderWarpEffect(ctx, width, height, progress, elapsed);
        } else if (transitionType === 'shatter') {
            renderShatterEffect(ctx, width, height, progress, elapsed);
        } else if (transitionType === 'portal') {
            renderPortalEffect(ctx, width, height, progress, elapsed);
        }
    };

    const renderWarpEffect = (ctx, width, height, progress, elapsed) => {
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Create radial warp lines
        const numLines = 60;
        const maxRadius = Math.max(width, height) * 0.8;
        
        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2 + (elapsed * 0.001);
            const speed = 1 + Math.sin(i * 0.5) * 0.5;
            
            const innerRadius = progress * maxRadius * speed;
            const outerRadius = Math.min((progress * 1.3) * maxRadius * speed, maxRadius);
            
            const gradient = ctx.createLinearGradient(
                centerX + Math.cos(angle) * innerRadius,
                centerY + Math.sin(angle) * innerRadius,
                centerX + Math.cos(angle) * outerRadius,
                centerY + Math.sin(angle) * outerRadius
            );
            
            const hue = (i * 6 + elapsed * 0.1) % 360;
            gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0)`);
            gradient.addColorStop(0.2, `hsla(${hue}, 80%, 60%, ${0.1 + progress * 0.3})`);
            gradient.addColorStop(0.5, `hsla(${hue}, 100%, 70%, ${0.3 + progress * 0.5})`);
            gradient.addColorStop(0.8, `hsla(${hue}, 80%, 60%, ${0.1 + progress * 0.3})`);
            gradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);
            
            ctx.save();
            ctx.translate(centerX, centerY);
            
            // Apply skew transformation
            const skewAmount = (1 - progress) * 0.3;
            ctx.transform(1, skewAmount * Math.sin(elapsed * 0.002), skewAmount * Math.cos(elapsed * 0.002), 1, 0, 0);
            
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
            ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2 + progress * 4;
            ctx.stroke();
            
            ctx.restore();
        }

        // Central vortex
        const vortexGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, maxRadius * progress
        );
        vortexGradient.addColorStop(0, `rgba(255, 255, 255, ${progress * 0.8})`);
        vortexGradient.addColorStop(0.3, `rgba(0, 180, 255, ${progress * 0.4})`);
        vortexGradient.addColorStop(0.6, `rgba(168, 85, 247, ${progress * 0.2})`);
        vortexGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = vortexGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius * progress, 0, Math.PI * 2);
        ctx.fill();

        // Screen edge glow
        if (progress > 0.5) {
            const edgeIntensity = (progress - 0.5) * 2;
            const edgeGradient = ctx.createRadialGradient(
                centerX, centerY, maxRadius * 0.8,
                centerX, centerY, maxRadius
            );
            edgeGradient.addColorStop(0, 'transparent');
            edgeGradient.addColorStop(1, `rgba(0, 180, 255, ${edgeIntensity * 0.5})`);
            
            ctx.fillStyle = edgeGradient;
            ctx.fillRect(0, 0, width, height);
        }
    };

    const renderShatterEffect = (ctx, width, height, progress, elapsed) => {
        const centerX = width / 2;
        const centerY = height / 2;
        const numShards = 100;
        
        for (let i = 0; i < numShards; i++) {
            const angle = (i / numShards) * Math.PI * 2;
            const distance = (progress * Math.max(width, height)) / 2;
            const shardSize = 10 + Math.sin(i * 0.3) * 20;
            
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            const hue = (i * 3.6 + elapsed * 0.05) % 360;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle + elapsed * 0.001);
            
            ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${1 - progress})`;
            ctx.beginPath();
            ctx.moveTo(0, -shardSize / 2);
            ctx.lineTo(shardSize / 2, shardSize / 2);
            ctx.lineTo(-shardSize / 2, shardSize / 2);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
    };

    const renderPortalEffect = (ctx, width, height, progress, elapsed) => {
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.max(width, height) * 0.6;
        
        // Expanding rings
        for (let i = 0; i < 8; i++) {
            const ringProgress = (progress + i * 0.125) % 1;
            const radius = ringProgress * maxRadius;
            const alpha = 1 - ringProgress;
            
            const gradient = ctx.createRadialGradient(
                centerX, centerY, radius * 0.8,
                centerX, centerY, radius
            );
            gradient.addColorStop(0, `rgba(0, 180, 255, 0)`);
            gradient.addColorStop(0.5, `rgba(168, 85, 247, ${alpha * 0.5})`);
            gradient.addColorStop(1, `rgba(0, 180, 255, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Central portal
        const portalSize = progress * maxRadius;
        const portalGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, portalSize
        );
        portalGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        portalGradient.addColorStop(0.2, 'rgba(0, 180, 255, 0.8)');
        portalGradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)');
        portalGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = portalGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, portalSize, 0, Math.PI * 2);
        ctx.fill();
    };

    return (
        <div 
            className={`fixed inset-0 z-[100] pointer-events-none transition-opacity duration-500 ${
                phase !== 'idle' && phase !== 'complete' ? 'opacity-100' : 'opacity-0'
            }`}
        >
            {/* Canvas Layer */}
            <canvas
                ref={(el) => {
                    canvasRef.current = el;
                    if (el) {
                        el.width = window.innerWidth;
                        el.height = window.innerHeight;
                    }
                }}
                className="absolute inset-0 w-full h-full"
                style={{ background: '#05050f' }}
            />

            {/* Overlay Text for Match Start */}
            {phase === 'warping' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div 
                        className="text-6xl md:text-8xl font-bold uppercase tracking-widest"
                        style={{
                            background: 'linear-gradient(135deg, #00b4ff, #a855f7, #ffffff)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 0 20px rgba(0, 180, 255, 0.8))',
                            animation: 'pulse-scale 0.5s ease-in-out infinite alternate',
                        }}
                    >
                        BATTLE START
                    </div>
                </div>
            )}

            {/* Vignette Overlay */}
            <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at center, transparent 0%, rgba(0,0,0,${0.3 + phase === 'warping' ? 0.5 : 0.8}) 100%)`,
                }}
            />
        </div>
    );
}

// Add global CSS animations
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse-scale {
            0% { transform: scale(0.95); opacity: 0.8; }
            100% { transform: scale(1.05); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}
