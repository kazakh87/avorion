#include "../version.inl"

uniform sampler2D alphaTexture;
uniform sampler2D platingTexture;
uniform samplerCube fogTexture;
uniform float maxFoggyness;
uniform float fogStrength;

uniform vec3 lightDir;
uniform vec3 lightColor;
uniform vec3 eye;

uniform float glossyness;
uniform float specularity;

in vec4 color;
in vec3 position;
in vec3 normal;
in vec2 texCoord;
in vec2 texWorld;
in vec3 ambientLight;

#include "../ambientlight.inl"

#ifdef SHADOW
#include "../shadow.inl"
#endif

#ifdef REFLECTIONS
uniform float minReflectivity;
uniform float maxReflectivity;
uniform samplerCube skyTexture;
#endif // REFLECTIONS



void main()
{
    float alpha = texture(alphaTexture, texCoord).r;
    if (alpha <= 0.2) discard;

    vec4 texBase = texture(platingTexture, texWorld);
    vec4 texColor = texBase * color;

    vec3 nnormal = normalize(normal);
    vec3 eyedir = normalize(position - eye);

    // direct lighting
    float lightIntensity = clamp(dot(nnormal, normalize(-lightDir)), 0.0, 1.0);
    vec3 lighting = lightIntensity * lightColor;

    // shadow
#ifdef SHADOW
    float shadow = sampleShadow();
    lighting = lighting * shadow;
#endif // SHADOW

    // ambient lighting
    lighting += getAmbientLighting(nnormal);
    lighting += ambientLight;

    outFragColor.rgb = texColor.rgb * lighting;

    // reflections
    vec3 rnormal = normalize(nnormal + ((vec3(1.0) - texBase.rgb) * aberration) - aberration / 2);
    vec3 eyeReflected = reflect(eyedir, rnormal);

    float reflectivity = 0.0;
#ifdef REFLECTIONS
    reflectivity = minReflectivity + (maxReflectivity - minReflectivity) * (1.0 - dot(-eyedir, nnormal));

#if !defined(DEFERRED)
    vec3 reflection = texture(skyTexture, eyeReflected).rgb;
    outFragColor.rgb += reflection * reflectivity;
#endif

#endif // REFLECTIONS

    // specular highlight
    float specular = clamp(dot(normalize(-lightDir), eyeReflected), 0.0, 1.0);
    specular = pow(specular, glossyness) * specularity;
#ifdef SHADOW
    specular *= shadow;
#endif // SHADOW
    outFragColor.rgb += specular * texBase.r * lightColor;
    outFragColor.a = alpha;

#if defined(DEFERRED)
    outNormalColor.rgb = rnormal;
    outNormalColor.a = reflectivity;
    outPositionColor.rgb = position;
    outPositionColor.a = gl_FragCoord.z / gl_FragCoord.w;
#else
    // fog
    vec3 fogColor = texture(fogTexture, eyedir).rgb;
    float fogDistance = gl_FragCoord.z / gl_FragCoord.w;
    float fogAmount = min(maxFoggyness, 1.0 - exp(-fogDistance * fogStrength));
    outFragColor.rgb = mix(outFragColor.rgb, fogColor.rgb, fogAmount);
#endif

}


