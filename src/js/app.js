import * as THREE from "three";
import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertex.glsl";

const cache = {};

// 👉 precarga todas las imágenes que tengan data-img en los enlaces
function preloadAllImages() {
  const loader = new THREE.TextureLoader();
  document.querySelectorAll(".projects a[data-img]").forEach((link) => {
    const url = link.getAttribute("data-img");
    loader.load(url, (tex) => {
      tex.encoding = THREE.sRGBEncoding;
      tex.needsUpdate = true;
      cache[url] = tex;
    });
  });
}

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    const frustumSize = 1;
    this.camera = new THREE.OrthographicCamera(
      frustumSize / -2,
      frustumSize / 2,
      frustumSize / 2,
      frustumSize / -2,
      -1000,
      1000
    );
    this.camera.position.set(0, 0, 2);

    this.time = 0;
    this.imageAspect = 1;
    this.isPlaying = false;

    this.settings();
    this.addObjects();
    this.resize();
    this.setupResize();
  }

  getValue(val) {
    return parseFloat(this.container.getAttribute("data-" + val));
  }

  settings() {
    this.settings = {
      grid: this.getValue("grid") || 34,
      mouse: this.getValue("mouse") || 0.25,
      strength: this.getValue("strength") || 1,
      relaxation: this.getValue("relaxation") || 0.9,
    };
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    let a1 = 1,
      a2 = 1;
    if (this.imageAspect) {
      if (this.height / this.width > this.imageAspect) {
        a1 = (this.width / this.height) * this.imageAspect;
        a2 = 1;
      } else {
        a1 = 1;
        a2 = (this.height / this.width) / this.imageAspect;
      }
    }

    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;
    this.material.uniforms.resolution.value.w = a2;

    this.regenerateGrid();
  }

  regenerateGrid() {
    this.size = this.settings.grid;
    const width = this.size;
    const height = this.size;
    const size = width * height;
    const data = new Float32Array(3 * size);

    for (let i = 0; i < size; i++) {
      const r = Math.random() * 255 - 125;
      const r1 = Math.random() * 255 - 125;
      const stride = i * 3;
      data[stride] = r;
      data[stride + 1] = r1;
      data[stride + 2] = r;
    }

    this.texture = new THREE.DataTexture(
      data,
      width,
      height,
      THREE.RGBFormat,
      THREE.FloatType
    );
    this.texture.magFilter = this.texture.minFilter = THREE.NearestFilter;

    if (this.material) {
      this.material.uniforms.uDataTexture.value = this.texture;
      this.material.uniforms.uDataTexture.value.needsUpdate = true;
    }
  }

  addObjects() {
    this.regenerateGrid();

    const emptyData = new Uint8Array([255, 255, 255]);
    const placeholderTex = new THREE.DataTexture(
      emptyData,
      1,
      1,
      THREE.RGBFormat
    );
    placeholderTex.needsUpdate = true;

    this.material = new THREE.ShaderMaterial({
      extensions: { derivatives: "#extension GL_OES_standard_derivatives : enable" },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector4() },
        uTexture: { value: placeholderTex },
        uDataTexture: { value: this.texture },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);
  }

  setImage(src) {
    if (cache[src]) {
      const tex = cache[src];
      this.material.uniforms.uTexture.value = tex;
      this.imageAspect = tex.image.height / tex.image.width;
      this.resize();
    }
  }

  updateDataTexture() {
    const data = this.texture.image.data;
    for (let i = 0; i < data.length; i += 3) {
      data[i] *= this.settings.relaxation;
      data[i + 1] *= this.settings.relaxation;
    }
    this.texture.needsUpdate = true;
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    this.updateDataTexture();
    this.material.uniforms.time.value = this.time;
    this.raf = requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.isPlaying = false;
  }

  start() {
    this.stop();
    this.regenerateGrid();
    this.time = 0;
    this.isPlaying = true;
    this.render();
  }
}

// ------ Inicialización ------
const sketch = new Sketch({
  dom: document.getElementById("canvasContainer"),
});

sketch.container.querySelector("canvas").style.display = "none";

preloadAllImages();

// Detectar si es dispositivo táctil
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Crear botón "Go to website" (oculto por defecto)
const goButton = document.createElement('button');
goButton.className = 'go-to-website-btn';
goButton.textContent = 'visit website';
goButton.style.cssText = `
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10001;
  padding: 5px 10px;
  font-size: 13px;
  background: #F6F6F4;
  color: #0059F4;
  border: none;
  cursor: pointer;
  display: none;
  font-family: Euclid Flex;
  letter-spacing: .03em;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
`;
document.body.appendChild(goButton);

// Variable para guardar el enlace activo
let currentLink = null;

// ------ Eventos ------
document.querySelectorAll(".projects a[data-img]").forEach((link) => {
  const imgSrc = link.getAttribute("data-img");
  const href = link.getAttribute("href");

  if (isTouchDevice) {
    // En dispositivos táctiles
    link.addEventListener("click", (e) => {
      e.preventDefault();
      
      // Mostrar canvas e imagen
      sketch.container.querySelector("canvas").style.display = "block";
      sketch.setImage(imgSrc);
      sketch.start();
      
      // Mostrar botón
      goButton.style.display = 'block';
      currentLink = href;
    });
  } else {
    // En escritorio (comportamiento original)
    link.addEventListener("mouseenter", () => {
      sketch.container.querySelector("canvas").style.display = "block";
      sketch.setImage(imgSrc);
      sketch.start();
    });

    link.addEventListener("mouseleave", () => {
      sketch.stop();
      sketch.container.querySelector("canvas").style.display = "none";
    });
  }
});

// Click en el botón para ir al sitio
goButton.addEventListener('click', () => {
  if (currentLink) {
    window.open(currentLink, '_blank');
  }
});

// Cerrar al hacer click fuera (en el canvas o en cualquier parte)
if (isTouchDevice) {
  document.addEventListener('click', (e) => {
    // Si el click no es en un enlace de proyecto ni en el botón
    if (!e.target.closest('.projects a[data-img]') && !e.target.closest('.go-to-website-btn')) {
      sketch.stop();
      sketch.container.querySelector("canvas").style.display = "none";
      goButton.style.display = 'none';
      currentLink = null;
    }
  });
}

// Selector de idioma
document.querySelectorAll('[data-lang]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    const lang = el.getAttribute('data-lang');

    // Guardamos preferencia durante 1 año
    document.cookie = `lang_pref=${lang}; path=/; max-age=${60 * 60 * 24 * 365}`;

    // Redirigimos al idioma elegido
    if (lang === 'en') {
      window.location.href = '/en/';
    } else {
      window.location.href = '/';
    }
  });
});

// Convierte el submit en "lead real" para Google Ads
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form[name="contacto"]');
    if (!form) return;

    form.addEventListener('submit', () => {
      // Dispara conversión sin redirigir
      if (typeof gtag_report_conversion === 'function') {
        gtag_report_conversion();
      }
    });
  });

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  const openButtons = document.querySelectorAll(".open-contact");
  const closeButtons = document.querySelectorAll(".close-contact");

  openButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      body.classList.add("contact-open");
    });
  });

  closeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      body.classList.remove("contact-open");
    });
  });
});