// Hex Glow Shader - Animated Border Effect
// Vertex Shader

varying vec2 vUv;
varying float vTime;
varying vec3 vPosition;

uniform float time;
uniform vec3 glowColor;
uniform float glowIntensity;
uniform float pulseSpeed;

void main() {
    vUv = uv;
    vTime = time;
    vPosition = position;
    
    // Add subtle vertex displacement for pulsing effect
    vec3 newPosition = position;
    float pulse = sin(time * pulseSpeed) * 0.02 * glowIntensity;
    newPosition.z += pulse;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}

---

// Fragment Shader

varying vec2 vUv;
varying float vTime;
varying vec3 vPosition;

uniform float time;
uniform vec3 glowColor;
uniform float glowIntensity;
uniform float pulseSpeed;

void main() {
    // Create animated glow gradient from edges
    float distFromCenter = distance(vUv, vec2(0.5));
    float edgeFactor = smoothstep(0.45, 0.5, distFromCenter);
    
    // Pulsing animation
    float pulse = sin(vTime * pulseSpeed) * 0.3 + 0.7;
    
    // Combine edge glow with pulse
    float alpha = edgeFactor * glowIntensity * pulse;
    
    // Add secondary glow ring
    float ringFactor = smoothstep(0.35, 0.4, abs(distFromCenter - 0.38));
    alpha += ringFactor * 0.3 * glowIntensity;
    
    gl_FragColor = vec4(glowColor, alpha);
}
