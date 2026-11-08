import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: Analyze food from image(s) with optional reference object for 3D scale calibration
app.post('/api/analyze-food', async (req: Request, res: Response) => {
  try {
    const {
      images = [], // Array of { data: string, mimeType?: string, label?: string }
      imageBase64, // Legacy single-photo support
      mimeType = 'image/jpeg',
      userNote = '',
      referenceObject = 'none', // e.g. 'banknote', 'credit_card', 'coin_2euro', 'fork_cutlery', 'insulin_pen', 'hand'
    } = req.body;

    // Normalize images array
    const imageList: Array<{ data: string; mimeType: string; label?: string }> = [];

    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (img?.data) {
          imageList.push({
            data: img.data.replace(/^data:image\/\w+;base64,/, ''),
            mimeType: img.mimeType || 'image/jpeg',
            label: img.label || 'Mahlzeit-Foto',
          });
        }
      }
    } else if (imageBase64) {
      imageList.push({
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
        mimeType: mimeType || 'image/jpeg',
        label: 'Hauptfoto',
      });
    }

    if (imageList.length === 0) {
      return res.status(400).json({ error: 'Kein Bild bereitgestellt' });
    }

    // Build prompt text
    let scaleInstruction = '';
    if (referenceObject && referenceObject !== 'none' && referenceObject !== 'Keines') {
      scaleInstruction = `
WICHTIGE GRÖSSEN- & MAßSTABS-KALIBRIERUNG (REFERENZ-OBJEKT):
Der Nutzer hat angegeben, dass im Bild folgendes Referenzobjekt platziert wurde: "${referenceObject}".
- Falls es ein Geldschein ist (z.B. 5€ = 120x62mm, 10€ = 127x67mm, 20€ = 133x72mm, 50€ = 140x77mm): Nutze seine exakten Abmessungen, um den Tellerradius und die Speisenhöhe im 3D-Raum präzise zu kalibrieren.
- Falls es eine EC-/Kreditkarte ist (ISO-Standard: exakt 85,6 x 53,98 mm): Nutze diese als exakten Maßstab.
- Falls es eine 2-Euro-Münze ist: Durchmesser ist exakt 25,75 mm.
- Falls es Besteck / eine Gabel ist: Standard-Tischgabel hat ca. 19-20 cm Länge.
- Falls es ein Insulinpen ist: Standard-Pen hat ca. 16 cm Länge und 1,5 cm Durchmesser.
- Falls es eine Hand/Faust ist: Nutze die durchschnittliche Faustgröße (~10-11 cm) als Orientierung.
Nutze diese Kalibrierung unbedingt, um das reale 3D-Volumen und die Grammgewichte der Portionen signifikant genauer zu schätzen!`;
    }

    let multiPhotoInstruction = '';
    if (imageList.length > 1) {
      multiPhotoInstruction = `
MEHRERE FOTOS DIESER MAHLZEIT:
Der Nutzer hat ${imageList.length} verschiedene Fotos dieser Mahlzeit bereitgestellt (z.B. Vogelperspektive/Draufsicht für Fläche, Seitenansicht/Schrägansicht für Portionshöhe und Tellerwölbung, oder Beilagen).
Analysiere ALLE Fotos gemeinsam und kombiniere die Blickwinkel für eine räumlich hochpräzise Schätzung.`;
    }

    const promptText = `Du bist ein hochqualifizierter diabetologischer Ernährungsberater und Schätz-Experte für Menschen mit Typ-1-Diabetes.
Analysiere die bereitgestellten Fotos einer Mahlzeit oder eines Lebensmittels sehr genau.
Zusätzlicher Hinweis des Nutzers: "${userNote || 'Keine Notiz'}".
${scaleInstruction}
${multiPhotoInstruction}

Deine Aufgaben:
1. Identifiziere alle sichtbaren Lebensmittel und Komponenten auf dem Teller/Foto(s).
2. Schätze realistische Portionsgewichte (in Gramm) unter Berücksichtigung des Maßstabs/Referenzobjekts und der Tellerhöhe.
3. Berechne präzise die enthaltenen anrechenbaren Kohlenhydrate (in Gramm) für Typ-1-Diabetiker.
4. Schätze eine realistische Bandbreite (minCarbsGrams bis maxCarbsGrams), da Portionen und versteckte Zucker/Saucen schwanken.
5. Identifiziere VERSTECKTE KOHLENHYDRATE (z.B. Panaden, Mehlschwitzen, gezuckerte Marinaden, Sojasaucen, Ketchup, Bindemittel, Klebreis).
6. Gib an, ob es sich um schnelle oder langsame Kohlenhydrate handelt (Glykämischer Index) und ob Fett/Protein-Einheiten (FPE) den Blutzucker später ansteigen lassen könnten (z.B. bei Pizza, Pasta, fettigem Käse).
7. Falls ein Referenzobjekt erkannt wurde, bestätige dies in 'detectedReferenceNote'.
8. Gib die Antwort vollständig auf Deutsch zurück.`;

    const contentsParts: any[] = [];

    // Add each image
    for (const img of imageList) {
      contentsParts.push({
        inlineData: {
          data: img.data,
          mimeType: img.mimeType,
        },
      });
    }

    // Add prompt text
    contentsParts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: contentsParts,
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dishName: {
              type: Type.STRING,
              description: 'Prägnanter Name der Mahlzeit oder des Gerichts (auf Deutsch)',
            },
            totalCarbsGrams: {
              type: Type.NUMBER,
              description: 'Gesamte anrechenbare Kohlenhydrate in Gramm',
            },
            minCarbsGrams: {
              type: Type.NUMBER,
              description: 'Untergrenze der Kohlenhydrat-Schätzung in Gramm',
            },
            maxCarbsGrams: {
              type: Type.NUMBER,
              description: 'Obergrenze der Kohlenhydrat-Schätzung in Gramm',
            },
            totalWeightGrams: {
              type: Type.NUMBER,
              description: 'Geschätztes Gesamtgewicht in Gramm',
            },
            sugarGrams: {
              type: Type.NUMBER,
              description: 'Davon Zucker in Gramm',
            },
            proteinGrams: {
              type: Type.NUMBER,
              description: 'Protein in Gramm',
            },
            fatGrams: {
              type: Type.NUMBER,
              description: 'Fett in Gramm',
            },
            caloriesKcal: {
              type: Type.NUMBER,
              description: 'Geschätzte Gesamtkalorien in kcal',
            },
            glycemicIndex: {
              type: Type.STRING,
              description: 'hoch, mittel oder niedrig',
            },
            confidence: {
              type: Type.STRING,
              description: 'hoch, mittel oder niedrig',
            },
            detectedReferenceNote: {
              type: Type.STRING,
              description: 'Kurze Notiz ob und wie das Referenzobjekt (z.B. Geldschein/Karte/Gabel) erkannt und zur Skalierung genutzt wurde',
            },
            hiddenCarbsWarning: {
              type: Type.STRING,
              description: 'Warnung vor versteckten Zuckern, Panaden oder Soßen falls vorhanden, sonst leer',
            },
            summary: {
              type: Type.STRING,
              description: 'Kurze Erklärung der Zusammensetzung und Portionsschätzung',
            },
            diabeticAdvice: {
              type: Type.STRING,
              description: 'Praxistipp für Typ 1 Diabetiker (z.B. Spritz-Ess-Abstand oder verzögerter Bolus wegen Fett/Eiweiß)',
            },
            items: {
              type: Type.ARRAY,
              description: 'Einzelne Komponenten der Mahlzeit',
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Name der Zutat/Komponente' },
                  portionGrams: { type: Type.NUMBER, description: 'Gewicht in Gramm' },
                  carbsGrams: { type: Type.NUMBER, description: 'Kohlenhydrate in Gramm' },
                  note: { type: Type.STRING, description: 'Kurzer Hinweis zur Schätzung' },
                },
                required: ['name', 'portionGrams', 'carbsGrams'],
              },
            },
          },
          required: ['dishName', 'totalCarbsGrams', 'items', 'diabeticAdvice', 'summary'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Fehler bei der Bildanalyse:', error);
    res.status(500).json({
      error: 'Fehler bei der Foto-Analyse',
      details: error?.message || 'Unbekannter Fehler',
    });
  }
});

// Endpoint: AI-powered Injection Strategy & Insulin Pen Advice (KI-Spritz-Berater)
app.post('/api/ai-injection-advice', async (req: Request, res: Response) => {
  const {
    glucose,
    glucoseUnit = 'mg/dl',
    trend = 'flat', // Freestyle Libre 3 trend: 'double_up' | 'up' | 'slight_up' | 'flat' | 'slight_down' | 'down' | 'double_down'
    mealName = 'Mahlzeit',
    carbsGrams = 0,
    carbUnit = 'BE',
    carbUnitAmount = 0,
    calculatedBolus = 0,
    penStep = 0.5,
    iob = 0,
    timeOfDay = 'Mittag',
    lastInjectionSite = 'abdomen_top_left',
    activityModifier = 'normal',
    userQuestion = '',
  } = req.body;

  try {

    const promptText = `Du bist ein erfahrener Diabetologe und Berater für intensivierte konventionelle Insulintherapie (ICT mit Bolus- und Basal-Pen) sowie Freestyle Libre 3 CGM-Sensoren.
Gib dem Typ-1-Diabetiker konkrete, sichere und hochgradig praxistaugliche Spritz-Tipps für die aktuelle Mahlzeitsituation:

AKTUELLE PATIENTENDATEN:
- Aktueller Blutzucker: ${glucose} ${glucoseUnit}
- Freestyle Libre 3 Trendpfeil: ${trend} (${
      trend === 'double_up'
        ? 'stark steigend ⇈'
        : trend === 'up'
        ? 'steigend ↑'
        : trend === 'slight_up'
        ? 'leicht steigend ↗'
        : trend === 'flat'
        ? 'stabil →'
        : trend === 'slight_down'
        ? 'leicht fallend ↘'
        : trend === 'down'
        ? 'fallend ↓'
        : 'stark fallend ⇊'
    })
- Mahlzeit: "${mealName}" mit ca. ${carbsGrams}g KH (${carbUnitAmount} ${carbUnit})
- Berechneter Bolus: ${calculatedBolus} IE (Pen-Schrittweite: ${penStep} IE)
- Aktives Insulin an Bord (IOB): ${iob} IE
- Tageszeit: ${timeOfDay}
- Letzte Einstichstelle: ${lastInjectionSite}
- Geplante Aktivität/Zustand: ${activityModifier}
- Spezifische Frage des Nutzers: "${userQuestion || 'Keine Zusatzfrage'}"

DEINE AUFGABEN:
1. Spritz-Ess-Abstand (SEA): Wie viele Minuten vor (oder bei fallendem BZ nach) dem Essen sollte gespritzt werden? Begründe mit BZ + Trendpfeil + Zusammensetzung der Speise.
2. Dosis-Aufteilung (Split-Bolus mit Insulinpen): Sollte die Dosis aufgeteilt werden (z.B. bei fettigen Speisen wie Pizza, Döner, Burger, Pommes)? Wenn ja, wie viele IE sofort und wie viele IE nach wie vielen Stunden?
3. Optimale Einstichstelle & Rotation: Welche Körperstelle (Bauchquadrant oder Oberschenkel) wird empfohlen, um Lipodystrophien (Spritzhügel) zu vermeiden und eine optimale Resorptionsgeschwindigkeit zu erreichen?
4. Pen-Handhabung & Technik: 2-3 prägnante Tipps zur Pen-Technik (z.B. 10 Sekunden Nadelverweildauer nach Injektion zur Vermeidung von Rückfluss, Vorfluten mit 2 IE, Einstichwinkel).
5. Sicherheitswarnung: Gibt es akute Risiken für Unterzuckerung (z.B. bei IOB + fallendem Pfeil + Sport)?
Gib alles auf Deutsch in strukturierter Form zurück.`;

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: {
              type: Type.STRING,
              description: 'Prägnanter Leitsatz (z.B. "15 Min. Spritz-Ess-Abstand einhalten & Split-Bolus erwägen")',
            },
            seaMinutes: {
              type: Type.NUMBER,
              description: 'Empfohlener Spritz-Ess-Abstand in Minuten (-10 bis 30)',
            },
            seaAdvice: {
              type: Type.STRING,
              description: 'Erklärung zum Spritzzeitpunkt basierend auf BZ, Trendpfeil und Speise',
            },
            splitBolusRecommended: {
              type: Type.BOOLEAN,
              description: 'Ob bei dieser Mahlzeit ein Split-Bolus mit dem Pen empfohlen wird',
            },
            splitImmediateUnits: {
              type: Type.NUMBER,
              description: 'Dosis für sofortige Injektion vor/zum Essen (in IE, gerundet auf Pen-Schritt)',
            },
            splitDelayedUnits: {
              type: Type.NUMBER,
              description: 'Dosis für spätere Injektion (in IE, gerundet auf Pen-Schritt)',
            },
            splitDelayMinutes: {
              type: Type.NUMBER,
              description: 'Empfohlener Abstand für die 2. Injektion in Minuten (z.B. 120 für 2 Stunden)',
            },
            splitExplanation: {
              type: Type.STRING,
              description: 'Begründung für Dosisaufteilung (z.B. Fett-Protein-Einheiten)',
            },
            recommendedSite: {
              type: Type.STRING,
              description: 'Empfohlene Einstichstelle für diesen Bolus (z.B. Bauch rechts unten)',
            },
            siteRotationReason: {
              type: Type.STRING,
              description: 'Begründung der Stellenwahl und Hinweis zur Schonung des Gewebes',
            },
            penTechniqueTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 bis 3 konkrete Tipps zur Pen-Technik (Nadelverweildauer 10s, Vorfluten etc.)',
            },
            trendWarning: {
              type: Type.STRING,
              description: 'Warnung bezüglich Libre-3-Trendpfeil oder Hypo-Risiko falls relevant',
            },
            keyTakeaway: {
              type: Type.STRING,
              description: 'Wichtigster Merksatz für den Patienten',
            },
          },
          required: [
            'headline',
            'seaMinutes',
            'seaAdvice',
            'splitBolusRecommended',
            'recommendedSite',
            'penTechniqueTips',
            'keyTakeaway',
          ],
        },
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI_TIMEOUT_FALLBACK')), 8000)
    );

    const response: any = await Promise.race([generatePromise, timeoutPromise]);
    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Fehler bei KI-Spritz-Tipps (Fallback greift):', error);

    // Robust clinical fallback based on Diabetology guidelines
    const isHigh = typeof glucose === 'number' && glucose > 160;
    const isLow = typeof glucose === 'number' && glucose < 90;
    const isRising = trend === 'up' || trend === 'double_up' || trend === 'slight_up';
    const isFalling = trend === 'down' || trend === 'double_down' || trend === 'slight_down';

    let seaMinutes = 10;
    let seaAdvice = 'Standardmäßigen Spritz-Ess-Abstand von ca. 10 Minuten vor Mahlzeitenbeginn einhalten.';
    if (isLow || isFalling) {
      seaMinutes = 0;
      seaAdvice = 'Achtung: Blutzucker ist niedrig oder sinkt. Erst direkt zum ersten Bissen oder kurz danach spritzen, um eine Unterzuckerung zu vermeiden!';
    } else if (isHigh || isRising) {
      seaMinutes = 15;
      seaAdvice = 'Blutzucker ist erhöht oder steigt. Ein Vorlauf von 15 Minuten bremst den postprandialen Glukoseanstieg spürbar ab.';
    }

    const mealLower = (mealName || '').toLowerCase();
    const isHeavyMeal = carbsGrams >= 60 || mealLower.includes('pizza') || mealLower.includes('döner') || mealLower.includes('burger') || mealLower.includes('pasta');
    const step = penStep || 0.5;

    let splitBolusRecommended = false;
    let splitImmediateUnits = calculatedBolus;
    let splitDelayedUnits = 0;
    let splitDelayMinutes = 120;
    let splitExplanation = 'Einzelinjektion ausreichend.';

    if (isHeavyMeal && calculatedBolus >= 3) {
      splitBolusRecommended = true;
      splitImmediateUnits = Math.max(step, Math.round(((calculatedBolus * 0.6) / step)) * step);
      splitDelayedUnits = Math.max(step, Math.round(((calculatedBolus * 0.4) / step)) * step);
      splitExplanation = 'Bei kohlenhydrat- und fettreichen Mahlzeiten empfiehlt sich ein Split-Bolus (ca. 60% sofort, 40% nach 2 Stunden), um den verzögerten Fettanstieg abzufangen.';
    }

    const fallbackResponse = {
      headline: splitBolusRecommended
        ? `${seaMinutes > 0 ? `${seaMinutes} Min. SEA` : 'Sofort spritzen'} & Split-Bolus mit Pen (${splitImmediateUnits} IE + ${splitDelayedUnits} IE)`
        : `${seaMinutes > 0 ? `${seaMinutes} Min. Spritz-Ess-Abstand` : 'Sofort zum Essen spritzen'} (${calculatedBolus} IE)`,
      seaMinutes,
      seaAdvice,
      splitBolusRecommended,
      splitImmediateUnits,
      splitDelayedUnits,
      splitDelayMinutes,
      splitExplanation,
      recommendedSite: 'Bauch (Quadrant gegenüber der letzten Injektion)',
      siteRotationReason: 'Zur Schonung des Unterhautfettgewebes und Vermeidung von Lipohypertrophien (Spritzhügeln).',
      penTechniqueTips: [
        'Nadel nach vollständigem Herabdrücken des Injektionsknopfs noch mindestens 10 Sekunden im Gewebe belassen.',
        'Vor jeder Injektion mit 1–2 IE vorfluten, bis an der Nadelspitze ein Tropfen austritt.',
        'Bei 4 mm oder 5 mm Pennadeln senkrecht im 90°-Winkel ohne Hautfalte einstechen.',
      ],
      trendWarning: isFalling
        ? 'Vorsicht: Trendpfeil fällt! Kein vorzeitiger Bolus ohne Mahlzeitenbeginn.'
        : isRising
        ? 'Trendpfeil steigt: Früher Spritz-Ess-Abstand ist besonders wirksam.'
        : undefined,
      keyTakeaway: 'Präzise Insulindosierung abgestimmt auf Pen-Schrittweite und CGM-Trend.',
    };

    res.json(fallbackResponse);
  }
});

// Endpoint: Scan Nutrition Label (Nährwerttabelle / Fertiggericht Verpackung)
app.post('/api/scan-nutrition-label', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Kein Bild der Nährwerttabelle bereitgestellt' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const promptText = `Du bist ein spezialisierter OCR- und Nährwert-Scanner für Lebensmittelverpackungen und Fertiggerichte für Typ-1-Diabetiker.
Lies das Foto der Lebensmittelverpackung oder der Nährwerttabelle (Packungsrückseite) präzise aus.

Aufgaben:
1. Erkenne den Produktnamen oder die Art des Fertiggerichts falls lesbar.
2. Lies die Kohlenhydrate pro 100g ('Kohlenhydrate / Carbohydrates') exakt ab.
3. Lies 'davon Zucker', 'Fett' und 'Eiweiß' pro 100g ab.
4. Prüfe, ob das Packungs-Gesamtgewicht (Nettofüllmenge, z.B. 400g, 350g, 500g) oder eine Portionsgröße auf der Verpackung zu sehen ist.
5. Gib die Werte als saubere Zahlen zurück.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          { text: promptText },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: {
              type: Type.STRING,
              description: 'Produktname oder Art des Lebensmittels',
            },
            carbsPer100g: {
              type: Type.NUMBER,
              description: 'Kohlenhydrate pro 100g in Gramm',
            },
            sugarPer100g: {
              type: Type.NUMBER,
              description: 'Davon Zucker pro 100g in Gramm (0 falls nicht angegeben)',
            },
            proteinPer100g: {
              type: Type.NUMBER,
              description: 'Eiweiß/Protein pro 100g in Gramm',
            },
            fatPer100g: {
              type: Type.NUMBER,
              description: 'Fett pro 100g in Gramm',
            },
            caloriesPer100g: {
              type: Type.NUMBER,
              description: 'Kalorien pro 100g in kcal',
            },
            packageWeightGrams: {
              type: Type.NUMBER,
              description: 'Erkanntes Packungsgesamtgewicht in Gramm (z.B. 400), oder 0 falls nicht auf dem Foto',
            },
            servingSizeGrams: {
              type: Type.NUMBER,
              description: 'Portionsgröße in Gramm laut Tabelle (z.B. 200), oder 0 falls nicht angegeben',
            },
            notes: {
              type: Type.STRING,
              description: 'Kurzer Hinweis zur Ablesung (z.B. ob zubereitet oder unzubereitet)',
            },
          },
          required: ['productName', 'carbsPer100g'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Fehler beim Nährwert-Scan:', error);
    res.status(500).json({
      error: 'Fehler beim Ablesen der Nährwerttabelle',
      details: error?.message || 'Unbekannter Fehler',
    });
  }
});

// Endpoint: Text-based quick carb estimate
app.post('/api/quick-estimate', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Suchanfrage fehlt' });
    }

    const promptText = `Du bist ein diabetologischer Ernährungsassistent.
Der Typ-1-Diabetiker hat folgende Mahlzeit/Lebensmittel beschrieben: "${query}".
Schätze die Kohlenhydrate, Portionsgewichte und Nährwerte auf Deutsch.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dishName: { type: Type.STRING },
            totalCarbsGrams: { type: Type.NUMBER },
            totalWeightGrams: { type: Type.NUMBER },
            sugarGrams: { type: Type.NUMBER },
            proteinGrams: { type: Type.NUMBER },
            fatGrams: { type: Type.NUMBER },
            caloriesKcal: { type: Type.NUMBER },
            glycemicIndex: { type: Type.STRING },
            summary: { type: Type.STRING },
            diabeticAdvice: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  portionGrams: { type: Type.NUMBER },
                  carbsGrams: { type: Type.NUMBER },
                  note: { type: Type.STRING },
                },
                required: ['name', 'portionGrams', 'carbsGrams'],
              },
            },
          },
          required: ['dishName', 'totalCarbsGrams', 'items', 'diabeticAdvice'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Fehler bei der Schnellschätzung:', error);
    res.status(500).json({ error: error?.message || 'Fehler bei der Schätzung' });
  }
});

// Endpoint: Barcode Lookup via OpenFoodFacts with fallback
app.get('/api/barcode/:barcode', async (req: Request, res: Response) => {
  const barcode = req.params.barcode.trim();
  if (!barcode) {
    return res.status(400).json({ error: 'Barcode fehlt' });
  }

  try {
    const offUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
    const offResp = await fetch(offUrl, {
      headers: {
        'User-Agent': 'DiaLogApp - Type1DiabeticManager - WebApp',
      },
    });

    if (offResp.ok) {
      const data = await offResp.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const name = p.product_name_de || p.product_name || p.generic_name_de || p.generic_name || 'Unbekanntes Produkt';
        const brand = p.brands || '';
        const nutriments = p.nutriments || {};

        const carbs100g = typeof nutriments.carbohydrates_100g === 'number' 
          ? nutriments.carbohydrates_100g 
          : parseFloat(nutriments.carbohydrates_100g) || 0;
        
        const sugars100g = typeof nutriments.sugars_100g === 'number'
          ? nutriments.sugars_100g
          : parseFloat(nutriments.sugars_100g) || 0;

        const protein100g = typeof nutriments.proteins_100g === 'number'
          ? nutriments.proteins_100g
          : parseFloat(nutriments.proteins_100g) || 0;

        const fat100g = typeof nutriments.fat_100g === 'number'
          ? nutriments.fat_100g
          : parseFloat(nutriments.fat_100g) || 0;

        const kcal100g = typeof nutriments['energy-kcal_100g'] === 'number'
          ? nutriments['energy-kcal_100g']
          : parseFloat(nutriments['energy-kcal_100g']) || 0;

        const servingSize = p.serving_size || '';
        const servingCarbs = typeof nutriments.carbohydrates_serving === 'number'
          ? nutriments.carbohydrates_serving
          : parseFloat(nutriments.carbohydrates_serving) || null;

        return res.json({
          found: true,
          source: 'OpenFoodFacts',
          barcode,
          name: brand ? `${brand} - ${name}` : name,
          brand,
          carbs100g: Math.round(carbs100g * 10) / 10,
          sugars100g: Math.round(sugars100g * 10) / 10,
          protein100g: Math.round(protein100g * 10) / 10,
          fat100g: Math.round(fat100g * 10) / 10,
          calories100g: Math.round(kcal100g),
          servingSize,
          servingCarbs: servingCarbs !== null ? Math.round(servingCarbs * 10) / 10 : null,
          imageUrl: p.image_front_url || p.image_url || null,
        });
      }
    }

    // Fallback: Ask Gemini if barcode is recognizable or provide helpful prompt
    res.json({
      found: false,
      barcode,
      message: 'Barcode wurde in der Datenbank nicht gefunden. Du kannst die Kohlenhydrate manuell eingeben.',
    });
  } catch (error: any) {
    console.error('Barcode Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Barcode-Daten' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DiaLog Server läuft auf Port ${PORT} (dev: ${!isProd})`);
  });
}

startServer();
