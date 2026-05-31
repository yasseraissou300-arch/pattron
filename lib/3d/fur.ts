// Génération de fourrure en temps réel par "shell rendering".
//
// Technique multiplateforme (WebGL standard, fonctionne partout) : on empile N
// coques concentriques de la même géométrie, chacune décalée vers l'extérieur le
// long des normales. Un bruit procédural fait disparaître de plus en plus de
// "brins" vers les coques externes → l'illusion d'une fourrure aux pointes
// effilées. Aucune texture requise (bruit calculé à partir de la position).

export interface FurPreset {
  id: string
  label: string
  lengthM: number // longueur des poils (mètres)
  density: number // densité des brins (plus grand = poils plus fins/serrés)
  shells: number  // nombre de coques
}

export const FUR_PRESETS: FurPreset[] = [
  { id: "courte", label: "Courte", lengthM: 0.02, density: 210, shells: 10 },
  { id: "moyenne", label: "Moyenne", lengthM: 0.045, density: 150, shells: 14 },
  { id: "longue", label: "Longue (laineuse)", lengthM: 0.08, density: 105, shells: 16 },
]

export function furPresetById(id: string): FurPreset {
  return FUR_PRESETS.find((p) => p.id === id) ?? FUR_PRESETS[1]
}

// Décale chaque coque le long de la normale ; transmet normale (vue) + position locale.
export const FUR_VERTEX_SHADER = /* glsl */ `
  uniform float uOffset;
  varying vec3 vNormalView;
  varying vec3 vPosLocal;
  void main() {
    vPosLocal = position;
    vNormalView = normalize(normalMatrix * normal);
    vec3 displaced = position + normal * uOffset;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`

// Conserve un brin si son tirage aléatoire dépasse le seuil de la coque courante :
// les coques externes (uLayer→1) perdent la plupart des brins → pointes effilées.
export const FUR_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uLayer;
  uniform float uDensity;
  uniform vec3 uLightDir;
  varying vec3 vNormalView;
  varying vec3 vPosLocal;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  }

  void main() {
    vec3 cell = floor(vPosLocal * uDensity);
    float h = hash(cell);
    if (uLayer > 0.001 && h < uLayer) discard;
    float diff = max(dot(normalize(vNormalView), normalize(uLightDir)), 0.0);
    float light = diff * 0.7 + 0.35;
    float ao = mix(0.5, 1.0, uLayer); // base plus sombre, pointes plus claires
    gl_FragColor = vec4(uColor * light * ao, 1.0);
  }
`
