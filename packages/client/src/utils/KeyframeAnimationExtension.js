// packages/client/src/utils/KeyframeAnimationExtension.js

/**
 * Keyframe Coordinate Animation Extension
 * Generates coordinate keyframes for character movements and setups compositions of raster elements with VFX.
 */
export const KeyframeAnimationExtension = {
    /**
     * Generates a timeline of keyframes from start position to end position.
     * @param {number[]} startPos - [x, y, z] start coordinates
     * @param {number[]} endPos - [x, y, z] end coordinates
     * @param {string} profile - faction animation walk profile ('slow_walk', 'slime_trail', 'teleport_dash', 'earth_glide')
     * @param {boolean} isStealthed - is character currently in stealth mode
     * @returns {Array<{position: number[], scale: number[], opacity: number, rotation: number[], vfxType: string, time: number}>} keyframes list
     */
    generateKeyframes(startPos, endPos, profile = 'slow_walk', isStealthed = false) {
        const keyframes = [];
        const STEPS = 12; // Number of keyframe coordinates

        const dx = endPos[0] - startPos[0];
        const dy = endPos[1] - startPos[1];
        const dz = endPos[2] - startPos[2];

        // Direction vector for slithering calculations
        const length = Math.sqrt(dx * dx + dz * dz);
        const dirX = length > 0 ? dx / length : 0;
        const dirZ = length > 0 ? dz / length : 0;
        // Perpendicular vector for side-to-side slithering
        const perpX = -dirZ;
        const perpZ = dirX;

        // Base opacity depending on stealth mode
        const baseOpacity = isStealthed ? 0.35 : 1.0;

        for (let i = 0; i <= STEPS; i++) {
            const t = i / STEPS;
            const keyframe = {
                time: t,
                position: [
                    startPos[0] + dx * t,
                    startPos[1] + dy * t,
                    startPos[2] + dz * t
                ],
                scale: [1, 1, 1],
                opacity: baseOpacity,
                rotation: [0, 0, 0],
                vfxType: 'none'
            };

            // Custom math equations for each walk profile
            if (isStealthed) {
                // Stealth Mode Dash: Speed is constant but opacity gets slightly shimmery/glitchy,
                // and we spawn digital camo footprints
                keyframe.opacity = baseOpacity * (0.8 + Math.sin(t * 25) * 0.2); // Cloak shimmer
                keyframe.scale = [0.95, 0.95, 0.95];
                keyframe.vfxType = 'stealth_shimmer';
                
                // Parabolic small hover
                keyframe.position[1] += Math.sin(t * Math.PI) * 0.3;
            } else if (profile === 'slow_walk') {
                // Crystal faction: Hop leap trajectory (parabolic Bezier-like curve)
                const heightOffset = Math.sin(t * Math.PI) * 1.5; // Rise up to 1.5 units
                keyframe.position[1] += heightOffset;
                
                // Lean forward while jumping, lean back on landing
                const leanAngle = Math.cos(t * Math.PI) * 0.15;
                keyframe.rotation = [leanAngle, 0, 0];
                
                // Squash and stretch scale based on leap phase
                const stretch = 1.0 + Math.sin(t * Math.PI) * 0.15;
                const squash = 1.0 - Math.sin(t * Math.PI) * 0.08;
                keyframe.scale = [squash, stretch, squash];
                
                if (t > 0.1 && t < 0.9) {
                    keyframe.vfxType = 'crystal_spark';
                }
            } else if (profile === 'slime_trail') {
                // Toxic faction: Sine-wave slither along the horizontal plane
                const slitherFreq = 2.5; // cycles of slither
                const slitherAmp = 0.45; // max horizontal offset
                const offset = Math.sin(t * Math.PI * 2 * slitherFreq) * slitherAmp;
                
                keyframe.position[0] += perpX * offset;
                keyframe.position[2] += perpZ * offset;
                
                // Rotate body to face the heading angle + slither yaw adjustment
                const slitherYaw = Math.cos(t * Math.PI * 2 * slitherFreq) * 0.3;
                keyframe.rotation = [0, slitherYaw, 0];
                keyframe.vfxType = 'acid_droplet';
            } else if (profile === 'teleport_dash') {
                // Void faction: Quantum displacement warp
                if (t < 0.2) {
                    // Shrink and dissolve at start
                    const progress = t / 0.2;
                    keyframe.opacity = baseOpacity * (1.0 - progress);
                    const sc = 1.0 - progress;
                    keyframe.scale = [sc, sc, sc];
                    keyframe.position = [...startPos];
                    keyframe.vfxType = 'void_implosion';
                } else if (t >= 0.2 && t < 0.8) {
                    // Invisible phase - coordinate is offset instantly to endPos
                    keyframe.opacity = 0.0;
                    keyframe.scale = [0.001, 0.001, 0.001];
                    keyframe.position = [...endPos];
                } else {
                    // Reappear and expand at destination with overshoot bounce
                    const progress = (t - 0.8) / 0.2; // 0 -> 1
                    keyframe.opacity = baseOpacity * progress;
                    // Overshoot growth
                    const bounceScale = Math.sin(progress * Math.PI * 0.5) * 1.25;
                    keyframe.scale = [bounceScale, bounceScale, bounceScale];
                    keyframe.position = [...endPos];
                    keyframe.vfxType = 'void_warp_burst';
                }
            } else if (profile === 'earth_glide') {
                // Druid faction: Sink underground and pop back up
                const diveDepth = 0.9;
                const progressY = Math.sin(t * Math.PI); // 0 -> 1 -> 0
                
                keyframe.position[1] -= progressY * diveDepth; // sinking down
                
                // Scale model down as it goes underground to represent burrowing
                const sc = 1.0 - progressY * 0.45;
                keyframe.scale = [sc, sc, sc];
                
                // Yaw spin while diving
                keyframe.rotation = [0, t * Math.PI * 2, 0];
                keyframe.vfxType = 'dust_cloud';
            }

            keyframes.push(keyframe);
        }

        return keyframes;
    },

    /**
     * Given an active keyframe list and current progress, calculates interpolated state.
     * @param {Array<object>} keyframes - keyframes array
     * @param {number} t - progress from 0.0 to 1.0
     * @returns {object} interpolated state { position, scale, opacity, rotation, vfxType }
     */
    interpolate(keyframes, t) {
        if (!keyframes || keyframes.length === 0) {
            return null;
        }

        const clampedT = Math.max(0, Math.min(1, t));
        
        // Find keyframe interval
        let startKey = keyframes[0];
        let endKey = keyframes[keyframes.length - 1];

        for (let i = 0; i < keyframes.length - 1; i++) {
            if (clampedT >= keyframes[i].time && clampedT <= keyframes[i + 1].time) {
                startKey = keyframes[i];
                endKey = keyframes[i + 1];
                break;
            }
        }

        const range = endKey.time - startKey.time;
        const localT = range > 0 ? (clampedT - startKey.time) / range : 0;

        // LERP helpers
        const lerp = (a, b, alpha) => a + (b - a) * alpha;
        const lerpArray = (arrA, arrB, alpha) => arrA.map((val, idx) => lerp(val, arrB[idx], alpha));

        return {
            position: lerpArray(startKey.position, endKey.position, localT),
            scale: lerpArray(startKey.scale, endKey.scale, localT),
            opacity: lerp(startKey.opacity, endKey.opacity, localT),
            rotation: lerpArray(startKey.rotation, endKey.rotation, localT),
            vfxType: startKey.vfxType
        };
    },

    /**
     * Calculates the coordinate offsets for decoy compositions.
     * Generates a trailing path of ghost points.
     * @param {Array<object>} keyframes - active keyframes
     * @param {number} t - current progress
     * @param {number} count - number of trail elements
     * @param {number} lag - delay spacing (e.g. 0.15)
     * @returns {Array<object>} list of active decoy transform states
     */
    generateDecoyTrail(keyframes, t, count = 2, lag = 0.18) {
        const decoys = [];
        if (!keyframes || keyframes.length === 0) return decoys;

        for (let i = 1; i <= count; i++) {
            const decoyT = t - i * lag;
            if (decoyT > 0 && decoyT < 1) {
                const state = this.interpolate(keyframes, decoyT);
                if (state) {
                    decoys.push({
                        id: `decoy_${i}_t${decoyT.toFixed(3)}`,
                        position: state.position,
                        scale: [state.scale[0] * 0.85, state.scale[1] * 0.85, state.scale[2] * 0.85], // Slightly smaller
                        opacity: state.opacity * 0.45 // More transparent
                    });
                }
            }
        }
        return decoys;
    }
};
