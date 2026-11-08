import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  Check,
  X,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Info,
  UtensilsCrossed,
  Tag,
  BookOpen,
  Hand,
  Sliders,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Clock,
  ArrowRight,
  Maximize2,
  Layers,
  Ruler,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  CarbUnit,
  FoodComponent,
  FoodPreset,
  MealRecord,
  UserDiabetesProfile,
} from '../types/diabetes';
import { COMMON_GERMAN_FOODS } from '../data/commonGermanFoods';
import { DIFFICULT_MEALS_DATABASE, DifficultDish } from '../data/difficultMealsGuide';
import { carbsGramsToUnit } from '../utils/diabetesCalculations';

interface FoodInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMeal: (meal: MealRecord) => void;
  profile: UserDiabetesProfile;
}

type TabType = 'photo' | 'nutrition_label' | 'difficult' | 'visual' | 'barcode' | 'catalog';

interface UploadedPhoto {
  id: string;
  data: string; // base64
  label: string;
}

export const FoodInputModal: React.FC<FoodInputModalProps> = ({
  isOpen,
  onClose,
  onSaveMeal,
  profile,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('photo');

  // Meal basket
  const [mealName, setMealName] = useState('Mahlzeit');
  const [items, setItems] = useState<FoodComponent[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [diabeticAdvice, setDiabeticAdvice] = useState<string | undefined>(undefined);
  const [hiddenCarbsWarning, setHiddenCarbsWarning] = useState<string | undefined>(undefined);
  const [detectedReferenceNote, setDetectedReferenceNote] = useState<string | undefined>(undefined);
  const [carbRange, setCarbRange] = useState<{ min: number; max: number } | undefined>(undefined);
  const [glycemicIndex, setGlycemicIndex] = useState<'niedrig' | 'mittel' | 'hoch' | undefined>('mittel');
  const [activeSource, setActiveSource] = useState<MealRecord['source']>('manual');

  // Tab 1: Multi-Photo AI state
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [userNote, setUserNote] = useState('');
  const [selectedReferenceObject, setSelectedReferenceObject] = useState<string>(
    '💶 Geldschein (z.B. 10€ / 20€)'
  );
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab 2: Nutrition Label Scan & Calculator state
  const [labelImageBase64, setLabelImageBase64] = useState<string | null>(null);
  const [isScanningLabel, setIsScanningLabel] = useState(false);
  const [labelScanError, setLabelScanError] = useState<string | null>(null);
  const [labelProductName, setLabelProductName] = useState('');
  const [labelCarbsPer100g, setLabelCarbsPer100g] = useState<string>('20');
  const [labelSugarPer100g, setLabelSugarPer100g] = useState<string>('5');
  const [labelPackageTotalWeight, setLabelPackageTotalWeight] = useState<string>('400');
  const [labelSelectedEatenWeight, setLabelSelectedEatenWeight] = useState<number>(400);
  const labelFileInputRef = useRef<HTMLInputElement>(null);

  // Tab 3: Difficult Dishes Guide
  const [difficultSearch, setDifficultSearch] = useState('');
  const [difficultCategory, setDifficultCategory] = useState<string>('Alle');
  const [expandedDishId, setExpandedDishId] = useState<string | null>('diff_doener_fladenbrot');

  // Tab 4: Barcode state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isLookingUpBarcode, setIsLookingUpBarcode] = useState(false);
  const [barcodeResult, setBarcodeResult] = useState<any>(null);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [barcodePortionGrams, setBarcodePortionGrams] = useState<number>(100);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Tab 5: Catalog & Manual
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [manualCustomName, setManualCustomName] = useState('');
  const [manualCustomCarbs, setManualCustomCarbs] = useState<string>('');
  const [manualCustomWeight, setManualCustomWeight] = useState<string>('100');

  // Cleanup scanner on unmount or tab switch
  useEffect(() => {
    return () => {
      stopBarcodeScanner();
    };
  }, []);

  if (!isOpen) return null;

  // Calculate total carbs in current meal basket
  const totalCarbsGrams = Math.round(items.reduce((sum, item) => sum + (item.carbsGrams || 0), 0) * 10) / 10;
  const carbInUnit = carbsGramsToUnit(totalCarbsGrams, profile.carbUnit, profile.gramsPerBE);

  // Adjust item portion
  const updateItemPortion = (id: string, deltaGrams: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const currentPortion = it.portionGrams || 100;
        const newPortion = Math.max(10, currentPortion + deltaGrams);
        const carbsPerGram = (it.carbsGrams || 0) / currentPortion;
        const newCarbs = Math.round(newPortion * carbsPerGram * 10) / 10;
        return {
          ...it,
          portionGrams: newPortion,
          carbsGrams: newCarbs,
        };
      })
    );
  };

  // Handlers for Multi-Photo AI
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const count = uploadedPhotos.length;
      const label =
        count === 0
          ? 'Draufsicht (Vogelperspektive)'
          : count === 1
          ? 'Seitenansicht (Tellerhöhe)'
          : count === 2
          ? 'Beilage / Nachtisch'
          : `Foto ${count + 1}`;

      const newPhoto: UploadedPhoto = {
        id: `photo-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        data: result,
        label,
      };

      setUploadedPhotos((prev) => [...prev, newPhoto]);
      if (!photoUrl) {
        setPhotoUrl(result);
      }
      setPhotoError(null);
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be re-selected if needed
    e.target.value = '';
  };

  const removeUploadedPhoto = (id: string) => {
    setUploadedPhotos((prev) => {
      const remaining = prev.filter((p) => p.id !== id);
      if (remaining.length > 0) {
        setPhotoUrl(remaining[0].data);
      } else {
        setPhotoUrl(undefined);
      }
      return remaining;
    });
  };

  const analyzePhoto = async () => {
    if (uploadedPhotos.length === 0) return;
    setIsAnalyzingPhoto(true);
    setPhotoError(null);

    try {
      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: uploadedPhotos.map((p) => ({ data: p.data, label: p.label })),
          referenceObject: selectedReferenceObject,
          userNote,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Fehler bei der Bilderkennung');
      }

      const res = data.data;
      setMealName(res.dishName || 'Mahlzeit');
      setDiabeticAdvice(res.diabeticAdvice);
      setGlycemicIndex(res.glycemicIndex || 'mittel');
      setActiveSource('photo_ai');
      setAllPhotos(uploadedPhotos.map((p) => p.data));

      if (res.detectedReferenceNote) {
        setDetectedReferenceNote(res.detectedReferenceNote);
      }
      if (res.hiddenCarbsWarning) {
        setHiddenCarbsWarning(res.hiddenCarbsWarning);
      }
      if (res.minCarbsGrams && res.maxCarbsGrams) {
        setCarbRange({ min: res.minCarbsGrams, max: res.maxCarbsGrams });
      }

      if (Array.isArray(res.items)) {
        const mappedItems: FoodComponent[] = res.items.map((it: any, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          name: it.name,
          portionGrams: it.portionGrams || 100,
          carbsGrams: it.carbsGrams || 0,
          note: it.note,
        }));
        setItems(mappedItems);
      }
    } catch (err: any) {
      console.error(err);
      setPhotoError(err.message || 'Die KI-Analyse konnte nicht durchgeführt werden.');
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  // Handlers for Nutrition Label OCR
  const handleLabelImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLabelImageBase64(result);
      setLabelScanError(null);
      scanNutritionLabel(result);
    };
    reader.readAsDataURL(file);
  };

  const scanNutritionLabel = async (imageBase64: string) => {
    setIsScanningLabel(true);
    setLabelScanError(null);

    try {
      const response = await fetch('/api/scan-nutrition-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Nährwerttabelle konnte nicht gelesen werden');
      }

      const res = data.data;
      if (res.productName) setLabelProductName(res.productName);
      if (res.carbsPer100g !== undefined) setLabelCarbsPer100g(res.carbsPer100g.toString());
      if (res.sugarPer100g !== undefined) setLabelSugarPer100g(res.sugarPer100g.toString());
      if (res.packageWeightGrams && res.packageWeightGrams > 0) {
        setLabelPackageTotalWeight(res.packageWeightGrams.toString());
        setLabelSelectedEatenWeight(res.packageWeightGrams);
      } else if (res.servingSizeGrams && res.servingSizeGrams > 0) {
        setLabelPackageTotalWeight(res.servingSizeGrams.toString());
        setLabelSelectedEatenWeight(res.servingSizeGrams);
      }
    } catch (err: any) {
      console.error(err);
      setLabelScanError(err.message || 'Konnte Nährwerttabelle nicht scannen. Bitte Werte manuell eingeben.');
    } finally {
      setIsScanningLabel(false);
    }
  };

  const addNutritionLabelToMeal = () => {
    const carbs100 = parseFloat(labelCarbsPer100g) || 0;
    const sugar100 = parseFloat(labelSugarPer100g) || 0;
    const eatenGrams = labelSelectedEatenWeight || 100;
    const totalCarbs = Math.round(((carbs100 * eatenGrams) / 100) * 10) / 10;
    const totalSugar = Math.round(((sugar100 * eatenGrams) / 100) * 10) / 10;

    const name = labelProductName.trim() || 'Fertiggericht / Packung';
    const newItem: FoodComponent = {
      id: `label-${Date.now()}`,
      name: `${name} (${eatenGrams}g)`,
      portionGrams: eatenGrams,
      carbsGrams: totalCarbs,
      sugarGrams: totalSugar > 0 ? totalSugar : undefined,
      note: `Nährwerttabelle: ${carbs100}g KH / 100g`,
    };

    setItems((prev) => [...prev, newItem]);
    if (mealName === 'Mahlzeit') {
      setMealName(name);
    }
    setActiveSource('nutrition_label');
  };

  // Handlers for Difficult Meals
  const addDifficultDishToMeal = (dish: DifficultDish) => {
    setMealName(dish.name);
    setGlycemicIndex(dish.glycemicIndex);
    setHiddenCarbsWarning(dish.hiddenCarbsExplanation);
    setDiabeticAdvice(`${dish.diabeticTrap} Empfehlung: ${dish.recommendedStrategy}`);
    setCarbRange(dish.carbRange);
    setActiveSource('difficult_dish');

    const mappedComponents: FoodComponent[] = dish.components.map((c, idx) => ({
      id: `diff-${Date.now()}-${idx}`,
      name: c.name,
      portionGrams: c.portionGrams,
      carbsGrams: c.carbsGrams,
      note: c.note,
    }));

    setItems(mappedComponents);
  };

  // Handlers for Visual Hand Estimation
  const addVisualItem = (name: string, grams: number, carbs: number, note?: string) => {
    const newItem: FoodComponent = {
      id: `vis-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: `${name} (${grams}g)`,
      portionGrams: grams,
      carbsGrams: carbs,
      note,
    };
    setItems((prev) => [...prev, newItem]);
    if (mealName === 'Mahlzeit') {
      setMealName(name);
    }
    setActiveSource('visual_guide');
  };

  // Handlers for Barcode
  const startBarcodeScanner = async () => {
    setBarcodeError(null);
    setIsScannerActive(true);

    try {
      setTimeout(async () => {
        const qrCode = new Html5Qrcode('barcode-scanner-viewport');
        html5QrCodeRef.current = qrCode;

        await qrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 160 },
          },
          (decodedText) => {
            setBarcodeInput(decodedText);
            stopBarcodeScanner();
            lookupBarcode(decodedText);
          },
          () => {}
        );
      }, 200);
    } catch (err: any) {
      console.error('Kamerafehler:', err);
      setIsScannerActive(false);
      setBarcodeError('Kamerazugriff nicht möglich. Bitte Barcode manuell eingeben.');
    }
  };

  const stopBarcodeScanner = () => {
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.stop().catch(() => {});
      } catch (e) {}
      html5QrCodeRef.current = null;
    }
    setIsScannerActive(false);
  };

  const lookupBarcode = async (codeToLookup?: string) => {
    const code = (codeToLookup || barcodeInput).trim();
    if (!code) {
      setBarcodeError('Bitte gib einen Barcode ein.');
      return;
    }

    setIsLookingUpBarcode(true);
    setBarcodeError(null);
    setBarcodeResult(null);

    try {
      const resp = await fetch(`/api/barcode/${encodeURIComponent(code)}`);
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || 'Fehler beim Abrufen des Barcodes');
      }

      if (!data.found) {
        setBarcodeError('Produkt wurde nicht gefunden. Du kannst es über die Nährwerttabelle erfassen.');
        return;
      }

      setBarcodeResult(data);
      setBarcodePortionGrams(100);
    } catch (err: any) {
      setBarcodeError(err.message || 'Netzwerkfehler beim Barcode-Scan');
    } finally {
      setIsLookingUpBarcode(false);
    }
  };

  const addBarcodeItemToMeal = () => {
    if (!barcodeResult) return;

    const carbsGrams = Math.round(((barcodeResult.carbs100g * barcodePortionGrams) / 100) * 10) / 10;
    const newItem: FoodComponent = {
      id: `bc-${Date.now()}`,
      name: `${barcodeResult.name} (${barcodePortionGrams}g)`,
      portionGrams: barcodePortionGrams,
      carbsGrams: carbsGrams,
      sugarGrams: barcodeResult.sugars100g
        ? Math.round(((barcodeResult.sugars100g * barcodePortionGrams) / 100) * 10) / 10
        : undefined,
      proteinGrams: barcodeResult.protein100g
        ? Math.round(((barcodeResult.protein100g * barcodePortionGrams) / 100) * 10) / 10
        : undefined,
      fatGrams: barcodeResult.fat100g
        ? Math.round(((barcodeResult.fat100g * barcodePortionGrams) / 100) * 10) / 10
        : undefined,
      note: `Barcode: ${barcodeResult.barcode}`,
    };

    setItems((prev) => [...prev, newItem]);
    if (mealName === 'Mahlzeit') {
      setMealName(barcodeResult.name);
    }
    setActiveSource('barcode');
    setBarcodeResult(null);
    setBarcodeInput('');
  };

  // Add from Preset catalog
  const addPresetItem = (preset: FoodPreset, grams: number) => {
    const carbsGrams = Math.round(((preset.carbsPer100g * grams) / 100) * 10) / 10;
    const newItem: FoodComponent = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: `${preset.name} (${grams}g)`,
      portionGrams: grams,
      carbsGrams,
    };
    setItems((prev) => [...prev, newItem]);
    if (mealName === 'Mahlzeit') {
      setMealName(preset.name);
    }
  };

  // Add custom manual item
  const addCustomManualItem = () => {
    if (!manualCustomName.trim()) return;
    const carbs = parseFloat(manualCustomCarbs) || 0;
    const weight = parseFloat(manualCustomWeight) || 100;

    const newItem: FoodComponent = {
      id: `custom-${Date.now()}`,
      name: manualCustomName.trim(),
      portionGrams: weight,
      carbsGrams: carbs,
    };

    setItems((prev) => [...prev, newItem]);
    if (mealName === 'Mahlzeit') {
      setMealName(manualCustomName.trim());
    }
    setManualCustomName('');
    setManualCustomCarbs('');
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Final save
  const handleFinalSave = () => {
    const record: MealRecord = {
      name: mealName.trim() || 'Mahlzeit',
      totalCarbsGrams,
      minCarbsGrams: carbRange?.min,
      maxCarbsGrams: carbRange?.max,
      hiddenCarbsWarning,
      detectedReferenceNote,
      items,
      photoUrl,
      photos: allPhotos.length > 0 ? allPhotos : undefined,
      source: activeSource,
      diabeticAdvice,
      glycemicIndex,
    };
    onSaveMeal(record);
    onClose();
  };

  // Filters for Catalog
  const categories = ['Alle', ...Array.from(new Set(COMMON_GERMAN_FOODS.map((f) => f.category)))];
  const filteredPresets = COMMON_GERMAN_FOODS.filter((food) => {
    const matchesCat = selectedCategory === 'Alle' || food.category === selectedCategory;
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Filters for Difficult Meals
  const diffCategories = ['Alle', 'Imbiss & Fast Food', 'Asiatisch & Wok', 'Italienisch & Pizza', 'Hausmannskost & Deftig', 'Bäckerei & Café', 'International'];
  const filteredDifficultDishes = DIFFICULT_MEALS_DATABASE.filter((d) => {
    const matchesCat = difficultCategory === 'Alle' || d.category === difficultCategory;
    const matchesSearch =
      d.name.toLowerCase().includes(difficultSearch.toLowerCase()) ||
      d.hiddenCarbsExplanation.toLowerCase().includes(difficultSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Calculated package carbs preview
  const packageTotalWeightNum = parseFloat(labelPackageTotalWeight) || 400;
  const carbsPer100Num = parseFloat(labelCarbsPer100g) || 0;
  const currentEatenCarbs = Math.round(((carbsPer100Num * labelSelectedEatenWeight) / 100) * 10) / 10;

  // Reference object presets
  const referenceObjects = [
    { id: 'banknote', label: '💶 Geldschein (z.B. 10€ / 20€)' },
    { id: 'credit_card', label: '💳 EC- / Kreditkarte (8,5 x 5,4 cm)' },
    { id: 'coin_2euro', label: '🪙 2-Euro-Münze (2,6 cm)' },
    { id: 'pen', label: '💉 Insulinpen (~16 cm)' },
    { id: 'fork', label: '🍴 Gabel / Besteck (~20 cm)' },
    { id: 'hand', label: '🖐️ Handfläche / Faust (~11 cm)' },
    { id: 'none', label: 'Keines (Standard-Teller)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Mahlzeit &amp; Kohlenhydrate erfassen</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">
                  Typ 1
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Multi-Foto, Maßstabs-Kalibrierung (Geldschein/Karte) &amp; Nährwert-Scanner
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Method Tabs - Thumb friendly */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1 overflow-x-auto text-xs no-scrollbar">
          <button
            onClick={() => {
              stopBarcodeScanner();
              setActiveTab('photo');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold whitespace-nowrap transition-all ${
              activeTab === 'photo'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Foto &amp; KI (Multi-Ansicht)</span>
          </button>

          <button
            onClick={() => {
              stopBarcodeScanner();
              setActiveTab('nutrition_label');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold whitespace-nowrap transition-all ${
              activeTab === 'nutrition_label'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Nährwert-Tabelle (Packung)</span>
          </button>

          <button
            onClick={() => {
              stopBarcodeScanner();
              setActiveTab('difficult');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold whitespace-nowrap transition-all ${
              activeTab === 'difficult'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Schwierige Mahlzeiten (Spickzettel)</span>
          </button>

          <button
            onClick={() => {
              stopBarcodeScanner();
              setActiveTab('visual');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold whitespace-nowrap transition-all ${
              activeTab === 'visual'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Hand- &amp; Teller-Schätzer</span>
          </button>

          <button
            onClick={() => setActiveTab('barcode')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold whitespace-nowrap transition-all ${
              activeTab === 'barcode'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>Strichcode</span>
          </button>

          <button
            onClick={() => {
              stopBarcodeScanner();
              setActiveTab('catalog');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold whitespace-nowrap transition-all ${
              activeTab === 'catalog'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Katalog</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {/* TAB 1: MULTI-PHOTO AI SCAN WITH REFERENCE OBJECT SCALING */}
          {activeTab === 'photo' && (
            <div className="space-y-4">
              {/* Hidden file input */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* Multi-Photo Gallery Box */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-teal-400" />
                    <span>Fotos der Mahlzeit ({uploadedPhotos.length}/4)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Tipp: Draufsicht + Seitenansicht kombiniert
                  </span>
                </div>

                {uploadedPhotos.length === 0 ? (
                  <div className="py-6 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-2.5">
                      <Camera className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-200 mb-1">
                      Fotografiere deine Mahlzeit
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">
                      Du kannst jetzt <strong>mehrere Fotos</strong> aufnehmen (z.B. Draufsicht für die Fläche,
                      Seitenansicht für die Füllhöhe) und ein <strong>Referenzobjekt</strong> (Geldschein, EC-Karte oder
                      Pen) zur 3D-Maßstabskalibrierung beilegen.
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs sm:text-sm hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/20 flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Erstes Foto aufnehmen / wählen
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Photos Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {uploadedPhotos.map((photo, index) => (
                        <div
                          key={photo.id}
                          className="relative group rounded-xl overflow-hidden bg-black border border-slate-700 h-28 flex flex-col justify-between"
                        >
                          <img
                            src={photo.data}
                            alt={photo.label}
                            className="object-cover w-full h-full"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1.5 text-[10px] text-white font-semibold truncate">
                            {photo.label}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeUploadedPhoto(photo.id)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/80 text-slate-300 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                            title="Foto entfernen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Add more button */}
                      {uploadedPhotos.length < 4 && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-xl border-2 border-dashed border-slate-700 hover:border-teal-500/50 bg-slate-900/40 hover:bg-slate-900/80 h-28 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-teal-300 transition-all cursor-pointer p-2 text-center"
                        >
                          <Plus className="w-5 h-5 text-teal-400" />
                          <span className="text-[11px] font-bold">+ Weiteres Foto</span>
                          <span className="text-[9px] text-slate-500">(z.B. Seitenansicht)</span>
                        </button>
                      )}
                    </div>

                    {/* Scale Reference Object Selection */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-teal-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                          <Ruler className="w-4 h-4 text-teal-400" />
                          <span>Größenreferenz-Objekt im Bild (Maßstabs-Kalibrierung):</span>
                        </label>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {referenceObjects.map((obj) => (
                          <button
                            key={obj.id}
                            type="button"
                            onClick={() => setSelectedReferenceObject(obj.label)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              selectedReferenceObject === obj.label
                                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {obj.label}
                          </button>
                        ))}
                      </div>

                      <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                        💡 <strong>Wie es funktioniert:</strong> Wenn ein Geldschein (z.B. 10€ = 127x67mm), eine
                        EC-Karte (85x54mm) oder dein Insulinpen neben dem Teller liegt, errechnet Gemini das exakte
                        3D-Volumen und die Grammgewichte wesentlich genauer!
                      </p>
                    </div>

                    {/* Optional Note */}
                    <div>
                      <input
                        type="text"
                        placeholder="Hinweis für KI (z.B. 'große Portion Nudeln mit süß-saurer Soße und Rind')"
                        value={userNote}
                        onChange={(e) => setUserNote(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    {/* Submit AI Analysis */}
                    <button
                      type="button"
                      disabled={isAnalyzingPhoto}
                      onClick={analyzePhoto}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-xs sm:text-sm hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 cursor-pointer"
                    >
                      {isAnalyzingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Analysiere {uploadedPhotos.length} Fotos &amp; Maßstab mit Gemini...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>
                            {uploadedPhotos.length > 1
                              ? `${uploadedPhotos.length} Fotos jetzt gemeinsam analysieren`
                              : 'Foto jetzt mit KI analysieren & zerlegen'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {photoError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{photoError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NUTRITION LABEL OCR & PACKAGING CALCULATOR */}
          {activeTab === 'nutrition_label' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300">
                <span className="font-bold">Speziell für Fertiggerichte &amp; Verpackungen:</span> Fotografiere die
                Nährwerttabelle auf der Rückseite oder trage die Angaben &bdquo;pro 100g&ldquo; direkt ein. Wähle
                anschließend, wie viel du von der Packung isst.
              </div>

              {/* Photo OCR trigger for Label */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={labelFileInputRef}
                onChange={handleLabelImageUpload}
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => labelFileInputRef.current?.click()}
                  disabled={isScanningLabel}
                  className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-teal-400 border border-teal-500/30 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  {isScanningLabel ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Lese Nährwerttabelle per KI...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-teal-400" />
                      <span>Nährwerttabelle fotografieren (OCR)</span>
                    </>
                  )}
                </button>
              </div>

              {labelScanError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{labelScanError}</span>
                </div>
              )}

              {/* Input Fields for Nährwerte */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Nährwerte laut Verpackung
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Produktname</label>
                    <input
                      type="text"
                      placeholder="z.B. TK Lasagne Bolognese"
                      value={labelProductName}
                      onChange={(e) => setLabelProductName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Kohlenhydrate pro 100g <span className="text-teal-400 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="z.B. 18.5"
                        value={labelCarbsPer100g}
                        onChange={(e) => setLabelCarbsPer100g(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-bold focus:outline-none focus:border-teal-500"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400">g</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">davon Zucker pro 100g</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="z.B. 3.2"
                        value={labelSugarPer100g}
                        onChange={(e) => setLabelSugarPer100g(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400">g</span>
                    </div>
                  </div>
                </div>

                {/* Portion selection */}
                <div className="pt-2 border-t border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      Packungs-Gesamtgewicht (Nettofüllmenge):
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={labelPackageTotalWeight}
                        onChange={(e) => {
                          setLabelPackageTotalWeight(e.target.value);
                          setLabelSelectedEatenWeight(parseFloat(e.target.value) || 400);
                        }}
                        className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-center font-bold text-white focus:outline-none focus:border-teal-500"
                      />
                      <span className="text-xs text-slate-400">g</span>
                    </div>
                  </div>

                  {/* 1-Click Portion Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setLabelSelectedEatenWeight(packageTotalWeightNum)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        labelSelectedEatenWeight === packageTotalWeightNum
                          ? 'bg-teal-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Ganze Packung ({packageTotalWeightNum}g)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLabelSelectedEatenWeight(Math.round(packageTotalWeightNum / 2))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        labelSelectedEatenWeight === Math.round(packageTotalWeightNum / 2)
                          ? 'bg-teal-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      1/2 Packung ({Math.round(packageTotalWeightNum / 2)}g)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLabelSelectedEatenWeight(Math.round(packageTotalWeightNum / 3))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        labelSelectedEatenWeight === Math.round(packageTotalWeightNum / 3)
                          ? 'bg-teal-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      1/3 ({Math.round(packageTotalWeightNum / 3)}g)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLabelSelectedEatenWeight(100)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        labelSelectedEatenWeight === 100
                          ? 'bg-teal-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Exakt 100g
                    </button>
                  </div>

                  {/* Custom grams slider */}
                  <div className="pt-2 flex items-center gap-3">
                    <span className="text-xs text-slate-400">Eigene Portion:</span>
                    <input
                      type="range"
                      min="10"
                      max={Math.max(1000, packageTotalWeightNum * 1.5)}
                      step="5"
                      value={labelSelectedEatenWeight}
                      onChange={(e) => setLabelSelectedEatenWeight(parseInt(e.target.value))}
                      className="flex-1 accent-teal-400"
                    />
                    <span className="text-xs font-bold text-white w-14 text-right">
                      {labelSelectedEatenWeight} g
                    </span>
                  </div>
                </div>

                {/* Calculation Result Preview */}
                <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Errechnete Kohlenhydrate:</div>
                    <div className="text-lg font-extrabold text-teal-400">
                      {currentEatenCarbs} g KH
                      <span className="text-xs font-normal text-slate-300 ml-2">
                        ≈ {carbsGramsToUnit(currentEatenCarbs, profile.carbUnit, profile.gramsPerBE)}{' '}
                        {profile.carbUnit === 'g_KH' ? 'g' : profile.carbUnit}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addNutritionLabelToMeal}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-teal-500/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>In Mahlzeit legen</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIFFICULT MEALS GUIDE */}
          {activeTab === 'difficult' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                <span className="font-bold flex items-center gap-1 text-amber-300 mb-0.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Schwierige &amp; Restaurant-Mahlzeiten richtig einschätzen:
                </span>
                Gerichte wie Döner, gebratene Asia-Nudeln, Sushi oder Schnitzel bergen versteckte Zucker, Panaden und
                starke Fett-Verzögerungen (Pizza-Effekt). Wähle ein Gericht für die detaillierte Aufschlüsselung:
              </div>

              {/* Search & Categories */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Schwieriges Gericht suchen (Döner, Pizza, Sushi, Schnitzel, Sweet-Sour)..."
                    value={difficultSearch}
                    onChange={(e) => setDifficultSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                  {diffCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setDifficultCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
                        difficultCategory === cat
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficult dishes accordion list */}
              <div className="space-y-2">
                {filteredDifficultDishes.map((dish) => {
                  const isExpanded = expandedDishId === dish.id;
                  return (
                    <div
                      key={dish.id}
                      className="bg-slate-800/40 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden transition-all"
                    >
                      <div
                        onClick={() => setExpandedDishId(isExpanded ? null : dish.id)}
                        className="p-3 flex items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{dish.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-500/20 font-semibold">
                              {dish.typicalCarbsGrams}g KH ({dish.carbRange.min}–{dish.carbRange.max}g)
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                            {dish.hiddenCarbsExplanation}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addDifficultDishToMeal(dish);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-teal-500/20"
                            title="In Warenkorb übernehmen"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Übernehmen</span>
                          </button>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="p-3 pt-0 border-t border-slate-800/60 bg-slate-950/40 space-y-2.5 text-xs">
                          {/* Hidden carbs explanation */}
                          <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/20 text-amber-200">
                            <span className="font-bold text-amber-300 block mb-0.5">
                              🔍 Wo verstecken sich die Kohlenhydrate?
                            </span>
                            {dish.hiddenCarbsExplanation}
                          </div>

                          {/* Diabetic trap */}
                          <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/20 text-rose-200">
                            <span className="font-bold text-rose-300 block mb-0.5">
                              ⚠️ Typ-1-Tücke (Blutzucker-Verlauf):
                            </span>
                            {dish.diabeticTrap}
                          </div>

                          {/* Strategy */}
                          <div className="p-2.5 rounded-lg bg-teal-950/30 border border-teal-500/20 text-teal-200">
                            <span className="font-bold text-teal-300 block mb-0.5">
                              💡 Empfohlene Spritz- &amp; Bolusstrategie:
                            </span>
                            {dish.recommendedStrategy}
                          </div>

                          {/* Decomposed components preview */}
                          <div>
                            <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider block mb-1">
                              Typische Zusammensetzung ({dish.typicalPortionGrams}g Portion):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {dish.components.map((c, i) => (
                                <div
                                  key={i}
                                  className="p-1.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]"
                                >
                                  <span className="text-slate-300">{c.name}</span>
                                  <span className="font-mono font-bold text-teal-400">
                                    {c.carbsGrams}g KH ({c.portionGrams}g)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => addDifficultDishToMeal(dish)}
                              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Als Mahlzeit mit {dish.typicalCarbsGrams}g KH übernehmen</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: VISUAL PORTION & HAND ESTIMATOR */}
          {activeTab === 'visual' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300">
                <span className="font-bold">Unterwegs ohne Waage?</span> Nutze die Handteller- und
                Portions-Schätzmethode der Diabetologie. Ein Klick fügt die Portion direkt deiner Mahlzeit hinzu:
              </div>

              {/* Express Stärke-Tasten für bekannte Beilagen wie Kartoffeln */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🥔 Stärkebeilagen &amp; Kartoffeln (Schnellwahl)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => addVisualItem('1 kleine Salzkartoffel', 60, 9, 'ca. 60g gekocht')}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-bold text-white">1 kleine Kartoffel</div>
                    <div className="text-[11px] text-teal-400 font-semibold">9g KH (ca. 0,7 BE)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => addVisualItem('1 mittelgroße Kartoffel', 100, 15, 'ca. 100g gekocht')}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-bold text-white">1 mittlere Kartoffel</div>
                    <div className="text-[11px] text-teal-400 font-semibold">15g KH (ca. 1,2 BE)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => addVisualItem('1 große Kartoffel', 160, 24, 'ca. 160g gekocht')}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-bold text-white">1 große Kartoffel</div>
                    <div className="text-[11px] text-teal-400 font-semibold">24g KH (ca. 2,0 BE)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => addVisualItem('1 Scheibe Mischbrot', 50, 22, 'ca. 50g')}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-bold text-white">1 Scheibe Mischbrot</div>
                    <div className="text-[11px] text-teal-400 font-semibold">22g KH (ca. 1,8 BE)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => addVisualItem('1 Brötchen / Semmel', 60, 31, 'ca. 60g')}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-bold text-white">1 Brötchen / Semmel</div>
                    <div className="text-[11px] text-teal-400 font-semibold">31g KH (ca. 2,6 BE)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => addVisualItem('1 Schale Kartoffelpüree', 180, 25, 'ca. 180g')}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-bold text-white">Kartoffelpüree</div>
                    <div className="text-[11px] text-teal-400 font-semibold">25g KH (ca. 2,1 BE)</div>
                  </button>
                </div>
              </div>

              {/* Hand- & Tellermethode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1 Faust Beilage */}
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                      <span>✊ 1 Faust gekochte Beilage</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      1 Faust Reis, Nudeln oder Kartoffeln (~1 Tasse / 150g).
                    </p>
                    <div className="text-xs font-bold text-teal-400 mt-1">ca. 35–42g KH (ca. 3 BE)</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addVisualItem('1 Faust Nudeln/Reis', 150, 40, 'Faustgroße Portion')}
                    className="p-2 rounded-lg bg-teal-500/20 hover:bg-teal-500 text-teal-300 hover:text-slate-950 transition-colors shrink-0 cursor-pointer"
                    title="+ 1 Faust hinzufügen"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* 1 Handteller Fleisch/Fisch */}
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                      <span>✋ 1 Handfläche Fleisch/Fisch</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ungeniertes Steak, Hähnchenfilet oder Lachs (~150g).
                    </p>
                    <div className="text-xs font-bold text-emerald-400 mt-1">0g KH (Reines Protein/Fett)</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addVisualItem('Handteller Fleisch/Fisch', 150, 0, 'Reines Eiweiß')}
                    className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 transition-colors shrink-0 cursor-pointer"
                    title="+ Hinzufügen"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* 2 Hände voll Salat */}
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                      <span>🤲 2 Hände voll Gemüse / Salat</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Blattsalate, Tomaten, Gurken, gedünsteter Brokkoli.
                    </p>
                    <div className="text-xs font-bold text-teal-400 mt-1">&lt; 5g KH (vernachlässigbar)</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addVisualItem('2 Hände Gemüse/Salat', 150, 4, 'Gemüse')}
                    className="p-2 rounded-lg bg-teal-500/20 hover:bg-teal-500 text-teal-300 hover:text-slate-950 transition-colors shrink-0 cursor-pointer"
                    title="+ Hinzufügen"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Tennisball Obst */}
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                      <span>🎾 Tennisball-Größe Obst</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      1 mittelgroßer Apfel, Birne, Pfirsich (~150g).
                    </p>
                    <div className="text-xs font-bold text-teal-400 mt-1">ca. 15g KH (ca. 1,2 BE)</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addVisualItem('1 Stück Obst (Tennisball)', 150, 15, 'Frucht')}
                    className="p-2 rounded-lg bg-teal-500/20 hover:bg-teal-500 text-teal-300 hover:text-slate-950 transition-colors shrink-0 cursor-pointer"
                    title="+ Hinzufügen"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* 1 Esslöffel süße Soße */}
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                      <span>🥄 1 EL süße Soße / Ketchup</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sweet-Chili, Teriyaki, Ketchup, Barbecue (~20g).
                    </p>
                    <div className="text-xs font-bold text-amber-400 mt-1">ca. 6g schneller Zucker</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addVisualItem('1 EL süße Sauce/Ketchup', 20, 6, 'Schnelle KH')}
                    className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 transition-colors shrink-0 cursor-pointer"
                    title="+ Hinzufügen"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* 1 Schöpfkelle Suppe / Eintopf */}
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                      <span>🥣 1 Kelle Kartoffel-/Nudelsuppe</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Eintopf oder Suppe mit stärkehaltiger Einlage (~200g).
                    </p>
                    <div className="text-xs font-bold text-teal-400 mt-1">ca. 14g KH (ca. 1,1 BE)</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addVisualItem('1 Kelle Suppe mit Einlage', 200, 14, 'Suppeneinlage')}
                    className="p-2 rounded-lg bg-teal-500/20 hover:bg-teal-500 text-teal-300 hover:text-slate-950 transition-colors shrink-0 cursor-pointer"
                    title="+ Hinzufügen"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BARCODE SCANNER */}
          {activeTab === 'barcode' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Barcode eingeben (z.B. 7622210449283)"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && lookupBarcode()}
                    className="flex-1 px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => lookupBarcode()}
                      disabled={isLookingUpBarcode}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 border border-teal-500/30 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isLookingUpBarcode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      <span>Suchen</span>
                    </button>

                    {!isScannerActive ? (
                      <button
                        type="button"
                        onClick={startBarcodeScanner}
                        className="px-4 py-2 bg-teal-500 text-slate-950 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 hover:bg-teal-400 transition-colors shadow-md shadow-teal-500/20 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Kamera</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopBarcodeScanner}
                        className="px-4 py-2 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-xl text-xs sm:text-sm font-semibold hover:bg-rose-500/30 transition-colors cursor-pointer"
                      >
                        Scanner stoppen
                      </button>
                    )}
                  </div>
                </div>

                {isScannerActive && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-teal-500/40 bg-black p-2">
                    <div id="barcode-scanner-viewport" className="w-full"></div>
                    <p className="text-center text-xs text-slate-400 mt-2">
                      Halte den Barcode mittig vor die Kamera
                    </p>
                  </div>
                )}
              </div>

              {barcodeError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{barcodeError}</span>
                </div>
              )}

              {barcodeResult && (
                <div className="bg-slate-800/60 border border-teal-500/30 rounded-xl p-4 space-y-3 animate-fade-in">
                  <div className="flex items-start gap-3">
                    {barcodeResult.imageUrl ? (
                      <img
                        src={barcodeResult.imageUrl}
                        alt={barcodeResult.name}
                        className="w-14 h-14 object-contain rounded-lg bg-white p-1 border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                        <Barcode className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">{barcodeResult.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="font-semibold text-teal-400">
                          {barcodeResult.carbs100g}g KH / 100g
                        </span>
                        {barcodeResult.sugars100g !== undefined && (
                          <span>(davon Zucker: {barcodeResult.sugars100g}g)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <label className="text-xs text-slate-300 font-medium">Verzehrte Menge:</label>
                      <input
                        type="number"
                        min="1"
                        max="2000"
                        value={barcodePortionGrams}
                        onChange={(e) => setBarcodePortionGrams(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-20 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-center font-bold text-white focus:outline-none focus:border-teal-500"
                      />
                      <span className="text-xs text-slate-400">Gramm</span>
                    </div>

                    <div className="text-right w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3">
                      <div>
                        <div className="text-sm font-extrabold text-teal-400">
                          {Math.round(((barcodeResult.carbs100g * barcodePortionGrams) / 100) * 10) / 10}g KH
                        </div>
                        <div className="text-[11px] text-slate-400">
                          ≈ {carbsGramsToUnit(
                            ((barcodeResult.carbs100g * barcodePortionGrams) / 100),
                            profile.carbUnit,
                            profile.gramsPerBE
                          )} {profile.carbUnit === 'g_KH' ? 'g' : profile.carbUnit}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={addBarcodeItemToMeal}
                        className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-md shadow-teal-500/20 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Hinzufügen</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: CATALOG & MANUAL ENTRY */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Lebensmittel suchen (Apfel, Kartoffeln, Vollkornbrot, Haferflocken)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-teal-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {filteredPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2 transition-all"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate">{preset.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {preset.standardPortionLabel} ={' '}
                        <span className="text-teal-400 font-semibold">
                          {Math.round(((preset.carbsPer100g * preset.standardPortionGrams) / 100) * 10) / 10}g KH
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addPresetItem(preset, preset.standardPortionGrams)}
                      className="p-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500 text-teal-400 hover:text-slate-950 transition-colors shrink-0 cursor-pointer"
                      title="1 Portion hinzufügen"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Freie Manuelle Eingabe */}
              <div className="pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Eigene Zutat / Freie Eingabe
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Name (z.B. Selbstgemachter Kuchen)"
                      value={manualCustomName}
                      onChange={(e) => setManualCustomName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Kohlenhydrate (g)"
                      value={manualCustomCarbs}
                      onChange={(e) => setManualCustomCarbs(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addCustomManualItem}
                    disabled={!manualCustomName.trim() || !manualCustomCarbs}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-teal-500 text-slate-300 hover:text-slate-950 font-bold text-xs disabled:opacity-40 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Hinzufügen</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MEAL BASKET: Zusammenfassung & Feinjustierung */}
          <div className="mt-4 pt-3 border-t border-slate-800 space-y-3 bg-slate-950/30 p-3 rounded-2xl border border-slate-800/80">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex-1 w-full sm:w-auto">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Mahlzeiten-Bezeichnung
                </label>
                <input
                  type="text"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="w-full font-bold text-sm bg-transparent border-b border-slate-700 focus:border-teal-500 py-1 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                {carbRange && (
                  <div className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] text-teal-300 font-mono">
                    Spanne: {carbRange.min}–{carbRange.max}g KH
                  </div>
                )}
                {glycemicIndex && (
                  <div
                    className={`px-2 py-1 rounded text-[11px] font-bold ${
                      glycemicIndex === 'hoch'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : glycemicIndex === 'mittel'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    GI: {glycemicIndex}
                  </div>
                )}
              </div>
            </div>

            {/* Scale Detected Banner */}
            {detectedReferenceNote && (
              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-200 text-xs flex items-start gap-2">
                <Ruler className="w-4 h-4 shrink-0 text-teal-400 mt-0.5" />
                <div>
                  <span className="font-bold text-teal-300">Maßstab im Bild erkannt: </span>
                  {detectedReferenceNote}
                </div>
              </div>
            )}

            {/* Hidden Carbs Warning Banner */}
            {hiddenCarbsWarning && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300">Versteckte Kohlenhydrate erkannt: </span>
                  {hiddenCarbsWarning}
                </div>
              </div>
            )}

            {/* Diabetic Advice from AI if present */}
            {diabeticAdvice && (
              <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-200 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
                <span>{diabeticAdvice}</span>
              </div>
            )}

            {/* List of items with fine-tuning +/- buttons */}
            {items.length === 0 ? (
              <div className="text-center py-5 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Noch keine Komponenten in dieser Mahlzeit. Wähle oben Foto, Nährwerttabelle, Spickzettel oder den Schätzer.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="min-w-0 pr-2 flex-1">
                      <div className="font-medium text-slate-200 truncate">{it.name}</div>
                      {it.note && <div className="text-[10px] text-slate-400 truncate">{it.note}</div>}
                    </div>

                    {/* Fine-tuning portion buttons */}
                    <div className="flex items-center gap-1 shrink-0 px-2">
                      <button
                        type="button"
                        onClick={() => updateItemPortion(it.id, -20)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        title="Portion verringern (-20g)"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono text-[11px] text-slate-300 px-1 font-semibold">
                        {it.portionGrams || 100}g
                      </span>
                      <button
                        type="button"
                        onClick={() => updateItemPortion(it.id, 20)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        title="Portion erhöhen (+20g)"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <span className="font-extrabold text-teal-400">{it.carbsGrams}g KH</span>
                        <span className="text-[10px] text-slate-400 ml-1">
                          (≈ {carbsGramsToUnit(it.carbsGrams, profile.carbUnit, profile.gramsPerBE)}{' '}
                          {profile.carbUnit === 'g_KH' ? 'g' : profile.carbUnit})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                        title="Entfernen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Total Carbs and Confirm */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-400">Berechnete Gesamtkohlenhydrate:</span>
            <span className="text-xl sm:text-2xl font-extrabold text-teal-400">{totalCarbsGrams} g KH</span>
            <span className="text-sm font-semibold text-slate-300">
              = <strong className="text-white">{carbInUnit} {profile.carbUnit === 'g_KH' ? 'g' : profile.carbUnit}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="button"
              disabled={items.length === 0 && totalCarbsGrams === 0}
              onClick={handleFinalSave}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-xs sm:text-sm hover:from-teal-400 hover:to-cyan-400 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/20 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>In Bolus-Rechner übernehmen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
