// Water Surface Shader - Toxic Swamp Biome
// Creates animated liquid surface with ripples and reflections

varying vec2 vUv;
varying float vTime;
varying vec3 vPosition;
varying vec3 vNormal;

uniform float time;
uniform vec3 waterColor;
uniform float waveHeight;
uniform float waveSpeed;
uniform vec2 waveDirection1;
uniform vec2 waveDirection2;

// Simplex noise function
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                            dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

void main() {
    vUv = uv;
    vTime = time;
    vPosition = position;
    vNormal = normal;
    
    // Create layered wave motion
    float wave1 = snoise((vPosition.xy * 2.0) + (time * waveSpeed) * waveDirection1) * waveHeight;
    float wave2 = snoise((vPosition.xy * 4.0) - (time * waveSpeed * 0.7) * waveDirection2) * (waveHeight * 0.5);
    float wave3 = snoise((vPosition.xy * 8.0) + (time * waveSpeed * 1.3) * waveDirection1) * (waveHeight * 0.25);
    
    // Combine waves for vertex displacement
    vec3 newPosition = position;
    newPosition.z += wave1 + wave2 + wave3;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}

---

// Fragment Shader

varying vec2 vUv;
varying float vTime;
varying vec3 vPosition;
varying vec3 vNormal;

uniform float time;
uniform vec3 waterColor;
uniform vec3 foamColor;
uniform float transparency;
uniform float reflectivity;

void main() {
    // Calculate fresnel effect for realistic water edges
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - dot(viewDirection, vNormal), 3.0);
    
    // Animated foam pattern using noise
    float foamNoise = sin(vPosition.x * 10.0 + time) * cos(vPosition.y * 10.0 + time);
    float foam = smoothstep(0.6, 0.8, foamNoise) * fresnel;
    
    // Mix water color with foam
    vec3 finalColor = mix(waterColor, foamColor, foam * 0.5);
    
    // Add fresnel rim lighting
    finalColor += fresnel * 0.3;
    
    // Apply transparency
    float alpha = transparency + (fresnel * 0.3);
    
    gl_FragColor = vec4(finalColor, alpha);
}
