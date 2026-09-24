# PRD: Design System — Game Motion Style

> Dokumen referensi untuk menerapkan style visual website **game-motion** ke project lain.
> Diekstrak langsung dari source code project.

---

## 1. Ringkasan Visual

Website ini menggunakan gaya **"Playful Neubrutalism"** — gabungan dari:
- Sudut membulat besar (rounded-3xl)
- Hard shadow / drop-shadow berbasis `box-shadow` offset (efek tombol "ditekan")
- Dual theme (Light + Dark) dengan transisi halus
- Tipografi tebal dan besar (font-black, uppercase, tracking-widest)
- Warna aksen neon kuat (`#d4ff00` untuk dark mode)
- Card-based layout yang interaktif (hover lift + shadow shift)

---

## 2. Tech Stack & Dependencies

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16.3.0 (App Router) |
| Styling | Tailwind CSS v4 + `@tailwindcss/postcss` |
| Font | Geist Sans + Geist Mono (via `next/font/google`) |
| Icons | `lucide-react` v1.34.0 |
| Avatar | DiceBear Avataaars API (`https://api.dicebear.com/7.x/avataaars/svg?seed=...`) |

---

## 3. Color Palette

### 3.1 Base Colors (Theme)

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| **Background** | `bg-slate-50` (`#f8fafc`) | `bg-[#0a0d0c]` |
| **Foreground (text)** | `text-slate-900` | `text-white` |
| **Muted text** | `text-slate-500` | `text-[#a0a0a0]` |
| **Surface (card)** | `bg-white` | `bg-[#1c1e1c]` |
| **Surface border** | `border-slate-200` | `border-white/5` atau `border-[#2a2d2a]` |

### 3.2 Accent Colors (Per-Game / Per-Feature)

| Game / Feature | Light Mode | Dark Mode |
|---------------|-----------|-----------|
| **Primary Accent** | `text-indigo-600` | `text-[#d4ff00]` (Neon Lime) |
| **Endless Runner** | `from-emerald-400 to-emerald-600` | `bg-[#d4ff00]` on hover |
| **Heli Runner** | `from-blue-400 to-blue-600` | `bg-[#3b82f6]` (#3b82f6 = blue-500) |
| **Basket Shoot** | `from-orange-400 to-orange-600` | `bg-[#f97316]` (#f97316 = orange-500) |
| **Leaderboard / Trophy** | `bg-yellow-100 text-yellow-600` | `bg-yellow-500/10 text-yellow-500` |

### 3.3 Shadow Colors

| Context | Light Mode | Dark Mode |
|---------|-----------|-----------|
| **Card default** | `shadow-[0_6px_0_0_#e2e8f0]` | `shadow-[0_6px_0_0_#2a2d2a]` |
| **Card hover (emerald)** | `shadow-[0_8px_0_0_#047857]` | `shadow-[0_8px_0_0_#9bb800]` |
| **Card hover (blue)** | `shadow-[0_8px_0_0_#1d4ed8]` | `shadow-[0_8px_0_0_#2563eb]` |
| **Card hover (orange)** | `shadow-[0_8px_0_0_#c2410c]` | `shadow-[0_8px_0_0_#ea580c]` |
| **Card active (pressed)** | `shadow-none` | `shadow-none` |

---

## 4. Typography

### 4.1 Font Family

```css
font-family: var(--font-geist-sans), Arial, Helvetica, sans-serif;
/* Monospace: var(--font-geist-mono) */
```

### 4.2 Scale & Weight Pattern

| Element | Class | Keterangan |
|---------|-------|------------|
| **Hero heading** | `text-4xl md:text-5xl font-bold tracking-tight leading-tight` | Judul besar di halaman game |
| **Page title (H1)** | `text-2xl md:text-3xl font-bold tracking-tight` | Header bar |
| **Section title (H2)** | `text-2xl font-bold` | Judul section |
| **Card title** | `text-2xl font-black uppercase tracking-tight` | Nama game di card |
| **Body text** | `text-sm font-medium` | Deskripsi card |
| **Label / Badge** | `text-[10px] font-bold uppercase tracking-wider` | Tag "Populer" |
| **Score display** | `text-4xl md:text-5xl font-black` | Skor di HUD |
| **Button text** | `text-2xl font-black tracking-widest` | CTA button |
| **Subtitle** | `text-xs` atau `text-sm` | Sub-info |

### 4.3 Key Rules
- Judul game selalu `uppercase` + `font-black`
- Tombol CTA selalu `uppercase` + `tracking-widest` + `font-black`
- Label/badge menggunakan `tracking-wider` atau `tracking-widest`

---

## 5. Component Patterns

### 5.1 Game Card (Homepage)

```
┌─────────────────────────────────┐
│  [Title]            [Badge]     │  ← rounded-3xl, p-6, border-2
│  [Description]                  │  ← min-h-[220px]
│                                 │
│  (●→) Mainkan                   │  ← Arrow icon + text
└─────────────────────────────────┘
      ████████ ← box-shadow 8px
```

**Struktur CSS:**

```
/* Light Mode */
rounded-3xl p-6 border-2 min-h-[220px]
bg-gradient-to-br from-{color}-400 to-{color}-600
border-{color}-600 text-white
shadow-[0_8px_0_0_{dark-color}]

/* Hover */
hover:-translate-y-1
hover:shadow-[0_10px_0_0_{darker-color}]

/* Active (pressed) */
active:translate-y-[8px]
active:shadow-none
```

```
/* Dark Mode */
bg-[#1c1e1c] text-white border-[#2a2d2a]
shadow-[0_8px_0_0_#2a2d2a]

/* Hover */
hover:bg-[#d4ff00] hover:text-black hover:border-[#d4ff00]
hover:shadow-[0_10px_0_0_#9bb800]
```

**Efek dekoratif di dalam card:**
```html
<!-- Blur circle di pojok kanan atas -->
<div class="absolute top-0 right-0 w-32 h-32 bg-white/10 
     group-hover:bg-white/20 rounded-full blur-2xl 
     -mr-10 -mt-10 pointer-events-none transition-colors">
</div>
```

### 5.2 Leaderboard Card

```
┌──────────────────────────────────────────────┐
│  (#1) [Avatar] [Name]        Skor            │
│                [Date]         420             │
└──────────────────────────────────────────────┘
```

**Rank #1 Card:**
```
/* Endless Runner */
bg-[#d4ff00] text-black border-[#9bb800] 
shadow-[0_6px_0_0_#9bb800]

/* Heli Runner */
bg-[#3b82f6] text-white border-[#2563eb] 
shadow-[0_6px_0_0_#2563eb]

/* Basket Shoot */
bg-[#f97316] text-black border-[#ea580c] 
shadow-[0_6px_0_0_#ea580c]
```

**Rank #2+ Card:**
```
/* Light */
bg-white text-slate-800 border-slate-200 shadow-sm

/* Dark */
bg-[#1c1e1c] text-white border-[#2a2d2a] 
shadow-[0_6px_0_0_#2a2d2a]
```

### 5.3 Icon Buttons (Toolbar)

```
/* Light Mode */
w-12 h-12 rounded-full
bg-white text-slate-700 shadow-md hover:bg-slate-100 
border-transparent

/* Dark Mode */
w-12 h-12 rounded-full
bg-[#1c1e1c] text-[#a0a0a0] hover:text-white 
border border-white/5
```

### 5.4 CTA Button (Full-Width, Fixed Bottom)

```
/* Active / Enabled */
flex-1 h-20 rounded-full
text-2xl font-black tracking-widest

/* Light Mode */
bg-{color}-500 text-white border-2 border-{color}-600
shadow-[0_8px_0_0_{dark-color}]

hover:-translate-y-1 
hover:shadow-[0_10px_0_0_{dark-color}]
active:translate-y-[8px] active:shadow-none

/* Disabled */
bg-[#1c1e1c] text-[#555] cursor-not-allowed
border-2 border-[#2a2d2a] shadow-[0_6px_0_0_#2a2d2a]
```

### 5.5 Input Field

```
/* Light Mode */
rounded-full px-8 py-5 text-xl font-bold
bg-white border-2 border-slate-200
placeholder:text-slate-400 
focus:border-{accent-color} focus:outline-none shadow-sm

/* Dark Mode */
rounded-full px-8 py-5 text-xl font-bold
bg-[#1c1e1c] border border-white/5
text-white placeholder:text-[#555]
focus:border-[{accent-hex}] focus:outline-none
```

### 5.6 Pill Toggle (Game Duration Selector)

```
/* Container */
p-1 rounded-full border
Light: bg-white border-slate-200 shadow-sm
Dark:  bg-[#1c1e1c] border-white/5

/* Active Pill */
px-3 py-1.5 rounded-full text-xs font-bold
Light: bg-emerald-500 text-white shadow-md
Dark:  bg-[#d4ff00] text-black

/* Inactive Pill */
Light: text-slate-500 hover:bg-slate-100
Dark:  text-[#a0a0a0] hover:text-white
```

### 5.7 Filter Chips (Score Log)

```
/* Active */
Light: bg-slate-900 text-white border-slate-900
Dark:  bg-white text-black border-white

/* Inactive */
Light: bg-white text-slate-600 border-slate-200 hover:border-slate-300
Dark:  bg-[#0a0d0c] text-[#a0a0a0] border-white/10 hover:border-white/30
```

### 5.8 Data Table / List (Score Log)

```
/* Container */
rounded-3xl border overflow-hidden
Light: bg-white border-slate-200 shadow-sm
Dark:  bg-[#1c1e1c] border-white/5

/* Header row */
grid-cols-12 gap-4 p-6 border-b
font-bold text-xs uppercase tracking-wider
Light: border-slate-200 text-slate-500
Dark:  border-white/5 text-[#a0a0a0]

/* Data row */
grid-cols-12 gap-4 p-5 border-b
Light: hover:bg-slate-50 border-slate-200
Dark:  hover:bg-white/5 border-white/5
```

### 5.9 Search Input (Score Log)

```
/* Full-width inside filter bar */
rounded-full py-4 pl-12 pr-6
/* Icon positioned absolute left-4 */
Light: bg-slate-50 border-slate-200 focus:border-slate-400
Dark:  bg-[#0a0d0c] border-white/10 focus:border-white/30
```

### 5.10 HUD Overlay (In-Game)

```
/* Score/Timer Panel */
bg-[#1c1e1c]/90 backdrop-blur-md
px-6 py-4 md:px-8 md:py-5 
rounded-3xl border border-white/10 shadow-2xl

/* Best Score Pill */
bg-[#1c1e1c]/90 backdrop-blur-md 
px-4 py-2 rounded-full border border-white/5 
h-[52px]

/* Status dot (animated) */
w-3 h-3 rounded-full bg-[{game-color}] animate-pulse
```

### 5.11 Modal Overlay

```
/* Backdrop */
fixed inset-0 z-50 bg-black/90 backdrop-blur-md

/* Modal content */
bg-[#1c1e1c] border border-white/5 rounded-3xl
w-full max-w-4xl p-6 h-[85vh]

/* Close button */
w-10 h-10 rounded-full bg-white/10
text-[#a0a0a0] hover:text-white
```

### 5.12 Back Button (Circular, Navigation)

```
/* Header version */
w-14 h-14 rounded-full border
Light: bg-white text-slate-500 border-slate-200 shadow-sm
       hover:border-slate-400 hover:text-slate-900
Dark:  bg-[#1c1e1c] text-[#a0a0a0] border-white/5
       hover:border-white/50 hover:text-white

/* Bottom bar version */
w-20 h-20 rounded-full shadow-2xl
Light: bg-white text-slate-700 hover:bg-slate-100
Dark:  bg-[#1c1e1c] border border-white/5 hover:bg-[#2a2c2a]
```

### 5.13 Game Badge / Tag

```
text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider

Light: bg-white/20 text-white
Dark:  bg-white/5 text-[#a0a0a0]
       group-hover:bg-black group-hover:text-[#d4ff00]
```

### 5.14 Game Color Badge (Score Log)

```
px-3 py-1 rounded-full text-xs font-bold border

/* Endless Runner */
Light: text-emerald-700 bg-emerald-100 border-emerald-200
Dark:  text-[#d4ff00] bg-[#d4ff00]/10 border-[#d4ff00]/30

/* Heli Runner */
Light: text-blue-700 bg-blue-100 border-blue-200
Dark:  text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30

/* Basket Shoot */
Light: text-orange-700 bg-orange-100 border-orange-200
Dark:  text-[#f97316] bg-[#f97316]/10 border-[#f97316]/30
```

---

## 6. Layout Patterns

### 6.1 Page Shell

```
<main class="flex min-h-screen flex-col font-sans px-6 py-12 
             md:px-12 md:py-16 w-full transition-colors duration-300
             {theme-classes}">
```

### 6.2 Header Bar

```
<div class="flex justify-between items-center mb-10">
  <!-- Left: Avatar + Greeting -->
  <div class="flex items-center gap-3">
    <div class="w-12 h-12 rounded-full ...">
      <img src="dicebear-avatar" />
    </div>
    <div>
      <p class="text-xs muted">Subtitle</p>
      <h1 class="text-lg font-bold">Title</h1>
    </div>
  </div>
  
  <!-- Right: Actions -->
  <div class="flex items-center gap-2 md:gap-4">
    [Pill Toggle] [Icon Buttons]
  </div>
</div>
```

### 6.3 Game Page Layout (Two Column)

```
<div class="flex flex-col md:flex-row gap-12 lg:gap-20">
  <!-- Left Column: flex-[1.2] -->
  <div class="flex-[1.2] flex flex-col gap-10">
    [Profile Input]
    [Controls Info Cards]
  </div>
  
  <!-- Right Column: flex-1 -->
  <div class="flex-1 flex flex-col">
    [Leaderboard Section]
  </div>
</div>
```

### 6.4 Fixed Bottom Action Bar

```
<div class="fixed bottom-0 left-0 w-full p-6 md:p-8 z-40
            bg-gradient-to-t from-{bg} via-{bg} to-transparent
            pointer-events-none">
  <div class="flex items-center justify-between gap-6 pointer-events-auto">
    [Back Button (w-20 h-20)]
    [CTA Button (flex-1 h-20)]
  </div>
</div>

<!-- Don't forget bottom padding on scrollable content! -->
<div class="pb-36"></div>
```

### 6.5 Homepage Card Grid

```
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  [Game Card] [Game Card] [Game Card]
</div>
```

### 6.6 Score Log Filter Bar

```
<div class="rounded-3xl border p-6 mb-8 flex flex-col md:flex-row gap-6 items-center
            {surface-classes}">
  [Search Input (flex-1)]
  [Filter Chips (horizontal scroll on mobile)]
</div>
```

---

## 7. Interaction Patterns

### 7.1 "Neubrutalism Button Press" Effect

Semua card dan tombol utama menggunakan pola ini:

```css
/* Default */
shadow-[0_Npx_0_0_{color}]

/* Hover → shadow bertambah + angkat */
hover:-translate-y-1
hover:shadow-[0_(N+2)px_0_0_{color}]

/* Active/Press → shadow hilang + turun */
active:translate-y-[Npx]
active:shadow-none
```

> Ini memberikan kesan tombol 3D yang bisa ditekan secara fisik.

### 7.2 Dark Mode Color Flip

Pada dark mode, card game yang di-hover berubah jadi aksen neon:
```
default:  bg-[#1c1e1c] text-white border-[#2a2d2a]
hover:    bg-[#d4ff00] text-black border-[#d4ff00]
```

### 7.3 Theme Toggle

- Disimpan di `localStorage` key `isLightMode` (string "true"/"false")
- Transisi: `transition-colors duration-300`
- Icon: `Moon` (light→dark) / `Sun` (dark→light) dari lucide-react

### 7.4 Loading Spinner

```html
<div class="animate-spin rounded-full h-8 w-8 border-t-2 
            {light: border-slate-900 | dark: border-white}">
</div>
```

### 7.5 Empty State

```html
<div class="flex flex-col items-center justify-center h-64 {muted-text}">
  <Icon class="w-12 h-12 mb-4 opacity-20" />
  <p class="text-lg font-medium">Tidak ada data ditemukan</p>
</div>
```

### 7.6 Hidden Scrollbar

Digunakan di semua area scrollable:
```css
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

---

## 8. Avatar System

Menggunakan DiceBear Avataaars API:

```
https://api.dicebear.com/7.x/avataaars/svg?seed={identifier}
```

| Context | Size | Container |
|---------|------|-----------|
| Header profile | `w-12 h-12` / `w-14 h-14` | `rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-[#1c1e1c]` |
| Leaderboard large | `w-14 h-14` | `rounded-full bg-black/40` |
| Leaderboard small | `w-8 h-8` | `rounded-full bg-black/40` |
| Table row | `w-10 h-10` | `rounded-full bg-black/40` |

---

## 9. Responsive Breakpoints

Mengikuti default Tailwind:

| Breakpoint | Width | Usage |
|-----------|-------|-------|
| Default | `< 768px` | Single column, padding `px-6 py-12` |
| `md:` | `≥ 768px` | Two columns, padding `md:px-12 md:py-16` |
| `lg:` | `≥ 1024px` | Three columns grid, wider gaps `lg:gap-20` |

---

## 10. Design Tokens (Quick Copy)

```js
const designTokens = {
  // Backgrounds
  bgLight: 'bg-slate-50',
  bgDark: 'bg-[#0a0d0c]',
  surfaceLight: 'bg-white',
  surfaceDark: 'bg-[#1c1e1c]',

  // Text
  textLight: 'text-slate-900',
  textDark: 'text-white',
  mutedLight: 'text-slate-500',
  mutedDark: 'text-[#a0a0a0]',
  placeholderDark: 'text-[#555]',

  // Borders
  borderLight: 'border-slate-200',
  borderDark: 'border-[#2a2d2a]',
  borderSubtleDark: 'border-white/5',

  // Accent (Dark Mode primary)
  accentNeon: '#d4ff00',
  accentNeonDarker: '#9bb800',

  // Game colors
  emerald: { from: '#34d399', to: '#059669', shadow: '#047857' },
  blue:    { from: '#60a5fa', to: '#2563eb', shadow: '#1d4ed8' },
  orange:  { from: '#fb923c', to: '#ea580c', shadow: '#c2410c' },

  // Shadows
  shadowLight: '#e2e8f0',
  shadowDark: '#2a2d2a',

  // Radius
  cardRadius: 'rounded-3xl',     // 1.5rem
  buttonRadius: 'rounded-full',
  pillRadius: 'rounded-full',

  // Spacing
  pagePadding: 'px-6 py-12 md:px-12 md:py-16',
  cardPadding: 'p-6',
  cardPaddingLarge: 'p-6 md:p-8',
};
```

---

## 11. Checklist Implementasi di Project Baru

- [ ] Install dependencies: `tailwindcss@4`, `lucide-react`, `next/font/google` (Geist)
- [ ] Setup dark/light mode toggle dengan `localStorage`
- [ ] Terapkan base background & text color sesuai theme
- [ ] Gunakan `rounded-3xl` untuk semua card
- [ ] Implementasi neubrutalism shadow system (`shadow-[0_Npx_0_0_color]`)
- [ ] Implementasi press effect (`hover:-translate-y-1` + `active:translate-y-[8px]`)
- [ ] Gunakan font weight: `font-bold` untuk heading, `font-black` untuk display/game titles
- [ ] Terapkan uppercase + tracking-wider untuk labels dan badges
- [ ] Implementasi hidden scrollbar utility class
- [ ] Gunakan DiceBear API untuk avatar generation
- [ ] Fixed bottom bar dengan gradient fade untuk CTA
- [ ] Responsive: 1 kolom → 2 kolom → 3 kolom

---

## 12. Do's and Don'ts

### ✅ Do
- Gunakan hard shadow (`box-shadow offset`) bukan blur shadow
- Rounded besar (`rounded-3xl`, `rounded-full`) — bukan `rounded-md`
- Warna aksen berbeda per fitur/game/section
- Transisi halus di semua interaksi (`transition-all`, `transition-colors`)
- Heading besar dan bold sebagai focal point
- Border tipis di semua card/container

### ❌ Don't
- Jangan pakai drop-shadow biasa (blur-based) untuk card
- Jangan pakai `rounded-md` atau `rounded-lg` — terlalu kecil
- Jangan campur warna aksen dalam satu card
- Jangan buat tombol tanpa press-effect (translate + shadow)
- Jangan hilangkan border pada card — border penting untuk definition
