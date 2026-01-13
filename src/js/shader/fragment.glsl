uniform float time;
uniform sampler2D uDataTexture;
uniform sampler2D uTexture;
uniform vec4 resolution;
varying vec2 vUv;

void main() {
    // Ajuste UV con cover
    vec2 newUV = (vUv - 0.5) * resolution.zw + 0.5;

    // Textura base
    vec4 color = texture2D(uTexture, newUV);

    // Desplazamiento con ruido, si quieres mantenerlo
    vec4 offset = texture2D(uDataTexture, vUv);
    color = texture2D(uTexture, newUV - 0.02 * offset.rg);

    // Corrección gamma para que no se vea oscura
    color.rgb = pow(color.rgb, vec3(1.0/2.2));

    gl_FragColor = color;
}
