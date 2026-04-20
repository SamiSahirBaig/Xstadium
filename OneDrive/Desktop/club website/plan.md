This is a serious build. Let me give you the complete system architecture, development plan, and section-by-section breakdown.

---

# SYSTEM ARCHITECTURE

## Tech Stack

```
Frontend Framework:    React 18 + Vite
3D Engine:             React Three Fiber (R3F) + Three.js
3D Helpers:            @react-three/drei
Physics:               @react-three/rapier
Animation:             GSAP 3 + ScrollTrigger + Framer Motion
Smooth Scroll:         Lenis.js
Shader Effects:        GLSL custom shaders via R3F
Styling:               Tailwind CSS + CSS custom properties
3D Models:             Blender → GLTF/GLB export
Fonts:                 Syne + DM Sans (Google Fonts)
Build:                 Vite + Rollup
Deployment:            Vercel / Netlify
```

## Folder Structure

```
csi-dypatil/
├── public/
│   ├── models/
│   │   ├── laptop.glb
│   │   └── csi-badge.glb
│   ├── textures/
│   │   ├── screen-ui.png
│   │   └── key-normal-map.png
│   └── fonts/
├── src/
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── Laptop.jsx
│   │   │   ├── Keys.jsx
│   │   │   ├── Particles.jsx
│   │   │   ├── ScreenUI.jsx
│   │   │   └── Scene.jsx
│   │   ├── sections/
│   │   │   ├── Hero.jsx
│   │   │   ├── About.jsx
│   │   │   ├── Events.jsx
│   │   │   ├── Team.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── Achievements.jsx
│   │   │   └── Contact.jsx
│   │   ├── ui/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Cursor.jsx
│   │   │   ├── Loader.jsx
│   │   │   └── SectionTransition.jsx
│   ├── hooks/
│   │   ├── useMouse.js
│   │   ├── useScroll.js
│   │   └── useLoader.js
│   ├── shaders/
│   │   ├── glowVertex.glsl
│   │   └── glowFragment.glsl
│   ├── store/
│   │   └── useStore.js       ← Zustand global state
│   ├── utils/
│   │   └── lerp.js
│   ├── App.jsx
│   └── main.jsx
```

---

# PHASE-BY-PHASE DEVELOPMENT PLAN

---

## PHASE 1 — Project Setup

### Anti-Gravity / Vibe Coding Prompt:
```
Scaffold a React 18 + Vite project with the following 
dependencies pre-installed and configured:

- @react-three/fiber
- @react-three/drei
- @react-three/rapier
- gsap + @gsap/react
- @studio-freight/lenis
- framer-motion
- zustand
- tailwindcss + postcss + autoprefixer
- three

Configure Tailwind with this theme extension:
colors:
  bg: '#07070a'
  surface: '#0f0f14'
  border: 'rgba(255,255,255,0.06)'
  accent: '#4efbcf'   ← neon cyan
  accent2: '#a78bfa'  ← soft violet
  text: '#e8e6f0'
  muted: '#6b6880'

fontFamily:
  display: ['Syne', 'sans-serif']
  body: ['DM Sans', 'sans-serif']

Add Google Fonts import for Syne (400,700,800) 
and DM Sans (300,400,500) in index.html.

Set body background to #07070a, 
color to #e8e6f0, overflow-x hidden.
```

---

## PHASE 2 — Global Systems

### Prompt 2A — Smooth Scroll (Lenis)
```
In main.jsx, initialize Lenis smooth scroll with:
  duration: 1.4
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
  orientation: vertical
  smoothWheel: true

Connect Lenis raf loop to GSAP ticker:
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)

Export the lenis instance so ScrollTrigger 
can use it via ScrollTrigger.scrollerProxy.
```

### Prompt 2B — Custom Cursor
```
Create a Cursor.jsx component with two elements:
1. A 10px filled circle (color: #4efbcf) 
   that follows mouse exactly with no lag
2. A 40px ring (border: 1px solid rgba(78,251,207,0.3)) 
   that follows mouse with 0.08 lerp factor (smooth lag)

On hovering any interactive element (a, button, [data-cursor]):
  - Inner dot scales to 0 and fades
  - Ring scales to 64px, border brightens to opacity 0.7
  - Add a CSS class "cursor--hover" for this state

On clicking:
  - Both elements scale down to 0.8 for 100ms then spring back

Use requestAnimationFrame for the lerp loop.
Replace default cursor: cursor: none on body.
```

### Prompt 2C — Page Loader
```
Create a full-screen loader overlay in Loader.jsx:

Background: #07070a
Center content:
  - CSI logo (img tag, 80px) fades in first
  - Below it: "CSI × DY PATIL" in Syne 13px 
    uppercase tracked, color #4efbcf, fades in 200ms later
  - Below: a thin 200px progress bar
    background: rgba(255,255,255,0.08)
    fill: linear-gradient(90deg, #4efbcf, #a78bfa)
    height: 1px
    animates width from 0 to 100% over 2.5s

Once R3F useProgress hits 100:
  - Progress bar completes
  - Entire overlay slides UP off screen 
    (translateY -100vh) over 0.8s, ease: power3.inOut
  - Reveal the page underneath

Use R3F's useProgress hook from @react-three/drei 
to track actual asset loading.
```

---

## PHASE 3 — Hero Section (Most Important)

### Prompt 3A — 3D Scene Setup
```
In Scene.jsx, create an R3F Canvas with:
  camera: { position: [0, 0, 6], fov: 45 }
  dpr: [1, 2]
  gl: { antialias: true, alpha: true }
  background: transparent (canvas sits over CSS background)

Add these drei helpers:
  - <Environment preset="night" />
  - <ContactShadows opacity={0.4} blur={2} far={10} />
  - <PerformanceMonitor> to auto-lower DPR on weak devices

Canvas CSS: position absolute, inset 0, z-index 1
The HTML hero content sits behind at z-index 2 
(pointer-events: none on canvas so HTML is still clickable)
```

### Prompt 3B — Laptop Model + Key Physics
```
In Laptop.jsx, load the laptop GLB using useGLTF.
Apply these materials:
  - Body: MeshStandardMaterial, color #0a0a12, 
    roughness 0.3, metalness 0.8
  - Screen bezel: same as body
  - Keys: MeshStandardMaterial, color #111118, 
    roughness 0.5, metalness 0.6, emissive #4efbcf, 
    emissiveIntensity 0 (will animate on hover)

Mouse interaction for keys:
  - Track normalized mouse position: 
    mouseX = (clientX / window.innerWidth) * 2 - 1
    mouseY = -(clientY / window.innerHeight) * 2 + 1

  - Each key has a base position from the model
  - On every frame, lerp each key's position toward:
    key.position.x += (mouseX * 0.3 - key.position.x) * 0.05
    key.position.y += (mouseY * 0.2 - key.position.y) * 0.05
    key.position.z += (Math.abs(mouseX) * 0.4 - key.position.z) * 0.05

  - Also lerp emissiveIntensity up when mouse moves fast:
    velocity = distance mouse moved this frame
    key.material.emissiveIntensity = lerp(current, velocity * 2, 0.1)
    clamp between 0 and 0.8

  - Keys closer to cursor glow brighter (proximity-based glow):
    distance = 2D distance from mouse to key screen position
    glow = 1 - clamp(distance / 0.5, 0, 1)
    key.material.emissiveIntensity = glow * 0.6
```

### Prompt 3C — Laptop Screen UI
```
In ScreenUI.jsx, create an animated texture 
rendered onto the laptop screen using R3F's 
<Html transform> inside the screen frame:

Screen content (HTML rendered in 3D space):
  Background: #030308
  Top bar: "CSI — DY PATIL" in Syne 10px, 
           color #4efbcf, with a blinking cursor
  
  Animated code lines using CSS animation:
    6-8 lines of fake code text, 
    each line types itself out left to right,
    staggered 0.4s apart,
    font: DM Mono 9px, color #a78bfa
    Lines like:
      > initializing CSI.core()
      > loading events[2025]
      > members.count = 500+
      > status: ACTIVE ✓

  Bottom: a small waveform animation 
  (5 bars, height animating up and down, color #4efbcf)

Use useVideoTexture or Html component from drei.
```

### Prompt 3D — Floating Particles
```
In Particles.jsx, create 200 floating particles 
around the laptop using Points geometry:

Setup:
  - Generate 200 random positions in a sphere 
    of radius 3 centered on the laptop
  - Each particle: size 0.015, color #4efbcf, 
    opacity randomized 0.2 to 0.6

Animation per frame:
  - Each particle drifts slowly using its own 
    sin/cos offset based on index:
    x += sin(time * 0.3 + index) * 0.001
    y += cos(time * 0.2 + index * 0.5) * 0.001
    z += sin(time * 0.4 + index * 0.3) * 0.0008

  - On mouse move: particles within 1.5 units 
    of the cursor ray gently push away (0.002 per frame)
    and slowly drift back

Use BufferGeometry + Points + PointsMaterial.
Update positions in useFrame.
```

### Prompt 3E — Hero HTML Content
```
The HTML layer of the hero section (behind the 3D canvas):

Layout: full viewport height, dark background #07070a
Left side (50% width, vertically centered):

  Top label: 
    "CSI × DR. DY PATIL INSTITUTE OF TECHNOLOGY"
    11px, uppercase, letter-spacing 0.2em, color #4efbcf
    Fades in on load after loader exits, delay 0.2s

  Main headline (3 lines, each animates up on load):
    Line 1: "Build."
    Line 2: "Innovate."  
    Line 3: "Disrupt."
    Font: Syne, 10vw, weight 800, color #e8e6f0
    Each line: overflow hidden wrapper,
    inner text animates from translateY(110%) to 0
    GSAP stagger: 0.12s, duration 1s, ease power4.out
    Delay: starts after loader (0.9s)

  Subtext below headline:
    "A futuristic tech community shaping the engineers 
     of tomorrow at DY Patil Institute, Pune."
    DM Sans, 18px, color #6b6880, max-width 380px
    Fades in at delay 1.4s

  Two CTA buttons:
    Button 1: "Explore Universe" 
      filled, background #4efbcf, color #07070a, 
      Syne font, 13px uppercase, sharp corners (border-radius 0)
      padding 14px 32px
      On hover: background scales inward 
      (clip-path animation from center)
    
    Button 2: "Join CSI →"
      no background, border: 1px solid rgba(255,255,255,0.15)
      color #e8e6f0, same font + size
      On hover: border color → #4efbcf, color → #4efbcf

Right side (50%): reserved for the R3F canvas (the laptop)

Bottom of hero (absolute bottom):
  Scroll indicator: "SCROLL TO EXPLORE" 
  9px uppercase tracked, color #6b6880
  A thin animated line extends downward, 
  1px wide, grows from 0 to 40px height, 
  repeating 2s loop
```

---

## PHASE 4 — About Section

### Prompt:
```
Create an About section with this layout:

Background: #0a0a0f (slightly lighter than hero)
Padding: 120px vertical

Left column (45%):
  Overline: "ABOUT US" — 11px cyan tracked
  Heading: "We Are The" line 1, 
           "Future Builders." line 2
  Syne, 5vw, weight 700
  
  Body copy (DM Sans 17px, color #9b99a8, line-height 1.8):
  "CSI DY Patil is a student-led technology chapter 
   dedicated to building real-world skills, 
   fostering innovation, and creating a community 
   where engineers become creators."

  3 stat pills below the text:
    "500+ Members" | "12+ Events" | "Since 2015"
    Each: small pill, border 1px solid rgba(255,255,255,0.1),
    background rgba(255,255,255,0.03),
    Syne font, 13px, color #4efbcf
    On hover: background rgba(78,251,207,0.08), 
    border-color rgba(78,251,207,0.3)

Right column (55%):
  3 glassmorphism feature cards in a staggered grid:
  
  Card style:
    background: rgba(255,255,255,0.03)
    border: 1px solid rgba(255,255,255,0.07)
    backdrop-filter: blur(12px)
    border-radius: 2px (nearly sharp)
    padding: 32px
    
  On hover:
    border-color: rgba(78,251,207,0.25)
    background: rgba(78,251,207,0.04)
    translateY: -4px
    transition: all 0.4s ease
    A subtle cyan glow appears behind card:
    box-shadow: 0 0 40px rgba(78,251,207,0.06)

  Card 1: Icon + "Technical Workshops"
    "Hands-on sessions in AI, Web Dev, Cloud, 
     and Competitive Programming."
  Card 2: Icon + "Hackathons"
    "Annual and inter-college hackathons 
     with real problem statements."
  Card 3: Icon + "Industry Connect"
    "Guest lectures and sessions from 
     engineers at top tech companies."

ScrollTrigger: entire section reveals on scroll.
Cards stagger in from translateY 60px opacity 0.
```

---

## PHASE 5 — Events Section

### Prompt:
```
Create an Events section with a horizontal 
scroll timeline layout.

Outer container: full viewport height, overflow hidden
Pin this section using GSAP ScrollTrigger pinning
while the inner timeline scrolls horizontally.

Header (stays fixed while events scroll):
  Top left: "EVENTS" overline in cyan
  Large heading: "What's" line 1, "Happening." line 2
  Syne, 5vw

Horizontal scrolling track:
  Display: flex, flex-direction: row
  gap: 60px, padding: 0 120px
  Will be animated with GSAP horizontal scroll:
    gsap.to(track, {
      x: () => -(track.scrollWidth - window.innerWidth),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        pin: true,
        scrub: 1,
        end: () => "+=" + track.scrollWidth
      }
    })

Each event card (5 cards):
  Width: 360px, height: 480px, flex-shrink: 0
  background: rgba(255,255,255,0.02)
  border: 1px solid rgba(255,255,255,0.06)
  border-radius: 2px
  padding: 40px 32px
  
  Card layout top to bottom:
    - Event number: "01" Syne 80px, weight 800,
      color rgba(78,251,207,0.1) (watermark style)
    - Category tag: "HACKATHON" 10px uppercase cyan
    - Event name: Syne 28px weight 700 white
    - Date: DM Sans 14px muted
    - Description: DM Sans 15px, color #9b99a8, 3 lines
    - Bottom: "Register →" text link, cyan

  On hover:
    Card border → rgba(78,251,207,0.2)
    Number watermark opacity → 0.2
    Entire card shifts up 6px

Events:
  01 — Hackathon 2025 — April 12
  02 — AI/ML Workshop — April 28
  03 — DevTalk: Open Source — May 3
  04 — Web3 Bootcamp — May 20
  05 — CSI Annual Fest — June 7
```

---

## PHASE 6 — Team Section

### Prompt:
```
Create a Team section with an animated orbital layout.

Background: #07070a
Section height: 100vh

Center of section: 
  A slowly rotating orbit ring (SVG circle, 
  radius 280px, stroke 1px dashed, 
  color rgba(78,251,207,0.12),
  rotates 360deg over 30s, CSS animation)

  4 team member cards orbit around this ring.
  Each card positioned at 0°, 90°, 180°, 270°.
  All 4 cards also rotate around center using 
  CSS animation, same 30s duration.
  Each card counter-rotates itself 
  so the card content stays upright.

Member card style:
  width: 160px
  background: rgba(255,255,255,0.04)
  border: 1px solid rgba(255,255,255,0.08)
  backdrop-filter: blur(16px)
  border-radius: 2px
  padding: 20px 16px
  text-align: center

  - Circular image placeholder 64px, 
    border: 1.5px solid rgba(78,251,207,0.3)
  - Name: Syne 15px bold white
  - Role: DM Sans 11px uppercase cyan muted

On hover over any card:
  - Orbit animation pauses
  - Hovered card scales 1.08
  - Card border glows cyan
  - Other cards dim to 40% opacity

Left of orbit (text area):
  Overline: "THE TEAM"
  Heading: "The Minds" / "Behind It."
  Syne 5vw

Below heading:
  "Our core team of passionate engineers, 
   designers, and innovators driving CSI forward."
  DM Sans 17px muted

Members:
  President, Vice President, Technical Head, Events Head
```

---

## PHASE 7 — Achievements + Contact

### Prompt:
```
Create an Achievements section followed by Contact/Footer.

ACHIEVEMENTS:
Background: #0a0a0f
Layout: full width, 2 rows of counters

Animated number counters (count up on scroll into view):
  500+  Members
  12+   Events per Year
  8+    Workshops Conducted
  3     National Level Wins
  1965  Year CSI was Founded
  100+  Industry Connections

Each counter:
  Number: Syne 72px weight 800, color #4efbcf
  Label: DM Sans 14px uppercase tracked, color #6b6880
  Separated by thin 1px vertical lines

On scroll into view:
  Numbers count up from 0 using GSAP's 
  textContent animation over 2s, ease power2.out

CONTACT / FOOTER:
Background: #07070a
Border-top: 1px solid rgba(255,255,255,0.06)
Padding: 100px 0 60px

Top row:
  Left: "Let's" line 1, "Connect." line 2
  Syne 6vw weight 800

  Right: Contact details stacked
    Email: csi@dypatil.edu (cyan link)
    Location: Pimpri, Pune, Maharashtra
    Social: Instagram  LinkedIn  GitHub  Twitter
    Each icon: 20px SVG, color #6b6880, 
    hover: color #4efbcf + translateY -2px

Middle: thin full-width 1px divider

Bottom row: 
  Left: "CSI — Dr. DY Patil Institute of Technology"
  DM Sans 13px muted
  Right: "© 2025 All Rights Reserved"
  DM Sans 13px muted
```

---

## PHASE 8 — Performance + Final Polish

### Prompt:
```
Optimize the entire website for performance:

1. Lazy load all sections below the hero using 
   React.lazy + Suspense with a minimal fallback

2. Add useDetectGPU from @react-three/drei:
   - If GPU tier < 2: disable particles, 
     reduce key physics to simple lerp only,
     disable backdrop-filter on all cards

3. Add prefers-reduced-motion media query:
   if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
     disable GSAP animations, disable orbit rotation,
     disable particle animation
   }

4. Compress all GLTF models using gltf-pipeline:
   npx gltf-pipeline -i laptop.glb -o laptop-compressed.glb --draco.compressionLevel 10

5. Add meta tags in index.html:
   title: "CSI — DY Patil Institute of Technology"
   description: "Official website of Computer Society of India, 
   Dr. DY Patil Institute of Technology, Pune."
   og:image: /og-preview.jpg (1200x630px screenshot of hero)
   theme-color: #07070a
```

---

# FULL DEPENDENCY INSTALL COMMAND

```bash
npm create vite@latest csi-dypatil -- --template react
cd csi-dypatil
npm install three @react-three/fiber @react-three/drei 
  @react-three/rapier gsap @gsap/react framer-motion 
  zustand @studio-freight/lenis tailwindcss 
  postcss autoprefixer
npx tailwindcss init -p
```

---

Build Phase 1 → 2 → 3 in order. The hero (Phase 3) is the hardest and most impactful — get that right first before touching other sections. Everything else follows the same pattern. 🚀