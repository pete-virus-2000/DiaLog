# DiaLog — Type 1 Diabetes Suite & Smart Bolus Calculator 🩸💉

<p align="center">
  <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80" alt="DiaLog Type 1 Diabetes Suite" width="100%" style="border-radius: 12px; max-height: 380px; object-fit: cover;" />
</p>

<p align="center">
  <strong>Comprehensive daily companion for Type 1 Diabetics using Insulin Pens (MDI) and Continuous Glucose Monitors (FreeStyle Libre 3).</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.0-61dafb?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/AI-Gemini%203.8%20Flash-8e75ff?logo=google" alt="Gemini 3.8 Flash" />
  <img src="https://img.shields.io/badge/Languages-9%20Supported-success" alt="9 Languages" />
  <img src="https://img.shields.io/badge/PWA-Installable-purple" alt="PWA Ready" />
  <img src="https://img.shields.io/badge/Device-Samsung%20Galaxy%20S26%20Ultra%20Ready-black" alt="AMOLED Ready" />
</p>

---

## 🌟 Overview

**DiaLog** is a modern, high-precision progressive web application designed from the ground up for people living with **Type 1 Diabetes (T1D)**. 

While automated insulin pumps (closed-loop systems) have advanced, millions of people worldwide prefer or rely on **Multiple Daily Injections (MDI)** using **Bolus** and **Basal pens** combined with sensor technology such as **Abbott FreeStyle Libre 3**. DiaLog bridges this gap by bringing automated intelligence, AI multimodal computer vision, and clinical precision formulas to pen therapy on your mobile device.

Optimized with a dedicated thumb-reachable bottom bar and pure black AMOLED dark mode for devices like the **Samsung Galaxy S26 Ultra**, DiaLog ensures lightning-fast, intuitive logging and calculations when you are on the go.

---

## ✨ Key Features

### 🍽️ 1. Multimodal Meal & Carbohydrate Capture
Accurately estimating carbohydrates is often the hardest part of managing Type 1 Diabetes. DiaLog provides multiple input methods:
- **AI Multi-Photo Analysis (Gemini 3.8 Flash)**: Capture meals from multiple angles (top-down, 45-degree angle, close-up) for enhanced volumetric understanding.
- **3D Scale Reference Calibration**: Place a standard everyday reference object next to your plate (such as a 5/10/20 Euro banknote, credit card, coin, fork, or thumb). The AI uses the known physical dimensions to measure portion volumes, reducing carb estimation errors.
- **Nutrition Packaging OCR Scanner**: Snap a picture of nutritional labels on food packages to instantly extract Total Carbohydrates, Sugars, Dietary Fiber, and Serving Size.
- **Barcode Scanner**: Integrated barcode scanning with OpenFoodFacts data lookup and local food database fallbacks.
- **Unit Flexibility**: Enter carbs in **Grams (g)**, **Bread Units (BE = 12g)**, or **Carbohydrate Units (KE = 10g)**.
- **FPE / FPU (Fat-Protein-Units) Calculator**: Uses the Warszawska / Polish extended bolus method to calculate delayed glucose spikes caused by high-fat/high-protein meals (e.g. pizza, fondue, BBQ, burgers) and suggests dual-bolus schedules.
- **Difficult Meals Guide**: Built-in visual reference cards and tips for notorious restaurant dishes (sushi, pizza, lasagna, Indian curries, Chinese dishes).

---

### 💉 2. Smart Bolus Calculator & FreeStyle Libre 3 Trend Integration
DiaLog calculates the exact rapid-acting insulin dose needed, factoring in:
- **Meal Bolus**: Based on time-of-day specific Insulin-to-Carb Ratios (**ICR**: Morning, Noon, Evening, Night).
- **Correction Bolus**: Based on your target blood glucose and your personal **Insulin Sensitivity Factor (ISF)**.
- **FreeStyle Libre 3 Trend Arrow Delta**:
  - `↑↑` Rapidly rising (> 2 mg/dL/min): **+2.0 U**
  - `↑` Rising (1–2 mg/dL/min): **+1.5 U**
  - `↗` Slowly rising (0.5–1 mg/dL/min): **+1.0 U**
  - `→` Stable: **0.0 U**
  - `↘` Slowly falling (0.5–1 mg/dL/min): **-1.0 U**
  - `↓` Falling (1–2 mg/dL/min): **-1.5 U**
  - `↓↓` Rapidly falling (> 2 mg/dL/min): **-2.0 U**
- **Insulin on Board (IOB) Subtraction**: Exponential decay curve modeling (3 to 5-hour duration of insulin action) prevents life-threatening **insulin stacking**.
- **Pen Increment Rounding**: Automatic rounding based on your pen hardware (**1.0 U standard pens**, **0.5 U half-unit junior pens**, or **0.1 U micro-dose pens**).
- **Dual Glucose Unit Support**: Seamless toggle between **mg/dL** and **mmol/L** with automatic conversion across the entire app.

---

### 🤖 3. AI Injection Advisor (Gemini 3.8 Flash)
Every meal calculation can be evaluated by an AI clinical advisor providing actionable, personalized tips:
- **Injection-Meal Interval (SEA / Pre-Bolus Timing)**: Recommends waiting 15–20 minutes before eating for high-glycemic meals, or injecting during/after the meal if your starting glucose is low or the meal is fat-heavy.
- **Dose Splitting**: Suggests dividing the dose into an immediate shot and a second injection 2 to 3 hours later for slow-absorbing meals.
- **Pen Injection Technique**: Reminders for needle priming (air shot), 90° injection angle, and holding the pen in place for 10 seconds before needle withdrawal to prevent leakage.

---

### ⏰ 4. Smart Timers & Alarm Reminders
Never forget to check your blood sugar or inject:
- **Pre-Bolus Timer (SEA)**: Visual countdown until your meal is ready to be eaten.
- **Post-Prandial Check Timers**: 1-hour and 2-hour reminders after eating to catch post-meal spikes or early dips.
- **Basal Pen Daily Alarm**: Evening or morning reminder with audio/vibration for your long-acting dose.
- **Hypo 15/15 Timer**: Emergency countdown to re-test glucose 15 minutes after consuming fast-acting carbs.

---

### 📈 5. Blood Glucose Curve & TIR Analysis
- Interactive 24-hour / multi-day glucose curve with color-coded target zones (70–180 mg/dL).
- **Time in Range (TIR)** analytics:
  - Very Low (< 54 mg/dL)
  - Low (54–69 mg/dL)
  - In Target (70–180 mg/dL)
  - High (181–250 mg/dL)
  - Very High (> 250 mg/dL)
- **Estimated HbA1c (GMI)** projection based on average sensor readings.

---

### 📊 6. Factor Assistant (Automated Ratio Learning)
- Retrospective analysis of your post-prandial blood sugar outcomes.
- Identifies systematic trends (e.g., repeatedly going high 2 hours after breakfast) and suggests adjusting your morning, noon, or evening ICR factors by ±10%.

---

### 🦺 7. Hypoglycemia Emergency Helper & ICE Medical Card
- **15/15 Emergency Guide**: Clear instructions for bystanders and the patient on fast-acting carbs (dextrose tablets, fruit juice, glucose gel).
- **Emergency ICE Card (Notfall-Ausweis)**: One-tap digital medical card detailing emergency contacts, diabetologist phone number, insulin types, and life-saving first-aid instructions.

---

### 📱 8. Ergonomics, Samsung Galaxy S26 Ultra & Theme Engine
- **Pure Black AMOLED Theme (`oled`)**: True `#000000` dark mode that maximizes battery life on Samsung Dynamic AMOLED 2X displays.
- **Light & Dark Themes**: High-contrast light mode for outdoor sunlight visibility and standard slate dark mode.
- **Thumb Navigation Bar**: Ergonomic bottom navigation bar placed squarely in the primary thumb swipe zone.
- **Haptic Feedback**: Native vibration pulses (`navigator.vibrate`) upon recording injections and selecting tabs.
- **Scalable Typography**: Compact, Standard, and Large font modes.

---

### 🌐 9. Multi-Language Support (9 Languages)
DiaLog is fully translated and switchable anytime in **Settings ⚙️**:
1. 🇩🇪 **Deutsch** (German)
2. 🇬🇧 **English** (English)
3. 🇪🇸 **Español** (Spanish)
4. 🇫🇷 **Français** (French)
5. 🇮🇹 **Italiano** (Italian)
6. 🇵🇱 **Polski** (Polish)
7. 🇷🇺 **Русский** (Russian)
8. 🇨🇳 **中文** (Simplified Chinese)
9. 🇯🇵 **日本語** (Japanese)

---

### 🔒 10. Privacy & Data Ownership
- **100% Client-Side Persistence**: All diary logs, insulin records, and profile settings are stored locally in the browser (`localStorage`).
- **Complete Export**: Export all historical data as formatted JSON or doctor-friendly CSV reports anytime.
- **No telemetry, no tracking, no ads.**

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with pure OLED black palette and responsive grid
- **Icons & Animation**: [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/)
- **AI Backend Proxy**: [Express](https://expressjs.com/) with [@google/genai](https://www.npmjs.com/package/@google/genai) SDK powering Gemini 3.8 Flash multimodal vision and reasoning
- **Storage**: LocalStorage with schema versioning and robust migration fallbacks

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ installed
- A Google Gemini API key (optional, required only for AI photo food analysis and injection tips)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/dialog-diabetes.git
   cd dialog-diabetes
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key (if using AI photo analysis):
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   PORT=3000
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser (or your smartphone via local network IP).

5. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

---

## 📋 Default Medical Profile Setup

Upon first launch, navigate to **Settings ⚙️** to configure your personal therapy parameters:
- **Glucose Unit**: `mg/dL` or `mmol/L`
- **Target Blood Glucose Range**: Default `100 mg/dL` (target min: 80, target max: 130)
- **Insulin Sensitivity Factor (ISF)**: E.g., `40 mg/dL` per 1.0 U
- **Insulin-to-Carb Ratios (ICR)**:
  - Breakfast: `1.5 U / BE`
  - Lunch: `1.0 U / BE`
  - Dinner: `1.2 U / BE`
  - Night: `1.0 U / BE`
- **Pen Step Size**: `1.0 U` (Standard) or `0.5 U` (Junior/Micro)
- **Insulin Types**: e.g., Bolus: *NovoRapid / Fiasp / Humalog / Lyumjev*; Basal: *Lantus / Toujeo / Tresiba*

---

## ⚠️ Medical Disclaimer

> **IMPORTANT MEDICAL NOTICE**:
> 
> DiaLog is a personal tracking, calculation, and decision-support application built for informational and self-management purposes by Type 1 Diabetics. **DiaLog is NOT a certified medical device and does not provide medical diagnoses.**
> 
> All calculated insulin recommendations, correction factors, and AI suggestions are estimates and must be critically verified by the patient prior to any injection. Never alter your prescribed medical regimen, basal rates, or medication without consulting your certified diabetologist or endocrinologist.

---

## 📄 License

This project is licensed under the [Apache License 2.0](LICENSE).
