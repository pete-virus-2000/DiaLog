import { FoodComponent } from '../types/diabetes';

export interface DifficultDish {
  id: string;
  name: string;
  category: 'Imbiss & Fast Food' | 'Asiatisch & Wok' | 'Italienisch & Pizza' | 'Hausmannskost & Deftig' | 'Bäckerei & Café' | 'International';
  typicalPortionGrams: number;
  typicalCarbsGrams: number;
  carbRange: { min: number; max: number };
  hiddenCarbsExplanation: string;
  diabeticTrap: string;
  recommendedStrategy: string;
  glycemicIndex: 'niedrig' | 'mittel' | 'hoch';
  components: Array<{
    name: string;
    portionGrams: number;
    carbsGrams: number;
    note?: string;
  }>;
}

export const DIFFICULT_MEALS_DATABASE: DifficultDish[] = [
  // 1. IMBISS & FAST FOOD
  {
    id: 'diff_doener_fladenbrot',
    name: 'Döner Kebab im Fladenbrot',
    category: 'Imbiss & Fast Food',
    typicalPortionGrams: 420,
    typicalCarbsGrams: 68,
    carbRange: { min: 55, max: 80 },
    hiddenCarbsExplanation:
      'Das 1/4 Fladenbrot schlägt mit ca. 50–55g KH zu Buche. Die Tücke: Weiße Joghurt-/Knoblauch- und scharfe Soßen enthalten oft Stärke, Zucker oder Ketchup (ca. 10–15g KH). Fleisch und Salat haben praktisch 0g KH.',
    diabeticTrap:
      'Das fette Dönerfleisch verzögert die Verdauung. Das Fladenbrot wirkt anfangs moderat, aber 2–4 Stunden später kann der Blutzucker durch Fett-Protein-Einheiten (FPE) deutlich nachsteigen.',
    recommendedStrategy:
      'Ggf. 70% Bolus sofort spritzen, 30% als verzögerter Bolus nach 1,5 bis 2 Stunden. Unbedingt 3h-Kontrollmessung einplanen.',
    glycemicIndex: 'mittel',
    components: [
      { name: 'Fladenbrot (1/4 Stück)', portionGrams: 150, carbsGrams: 52, note: 'Haupt-Kohlenhydratquelle' },
      { name: 'Döner-Soßen (Knoblauch/Kräuter)', portionGrams: 50, carbsGrams: 12, note: 'Enthält oft versteckten Zucker/Stärke' },
      { name: 'Dönerfleisch (Kalb/Hähnchen)', portionGrams: 160, carbsGrams: 1, note: 'Reich an Fett & Protein (FPE beachten)' },
      { name: 'Salat, Tomaten, Zwiebeln, Rotkohl', portionGrams: 60, carbsGrams: 3, note: 'Geringe anrechenbare KH' },
    ],
  },
  {
    id: 'diff_dueruem_yufka',
    name: 'Dürüm / Yufka Rolle',
    category: 'Imbiss & Fast Food',
    typicalPortionGrams: 450,
    typicalCarbsGrams: 75,
    carbRange: { min: 65, max: 88 },
    hiddenCarbsExplanation:
      'Der dünn gewalzte Yufka-Fladen wirkt optisch leicht, hat aber oft 200g Mehlgewicht und damit ca. 60–65g reine Kohlenhydrate. Zusammen mit den Soßen liegt ein Dürüm meist höher als ein normales Dönerbrot.',
    diabeticTrap:
      'Durch die enge Wicklung und das heiße Fett sättigt es schwer, die Kohlenhydrate werden über mehrere Stunden abgegeben.',
    recommendedStrategy: 'Split-Bolus empfohlen. Nicht unterschätzen: Meist 1–1,5 BE mehr als ein Standard-Döner.',
    glycemicIndex: 'mittel',
    components: [
      { name: 'Yufka-Teigfladen', portionGrams: 180, carbsGrams: 62 },
      { name: 'Soßen (Kräuter / Scharf)', portionGrams: 50, carbsGrams: 10 },
      { name: 'Fleisch & Gemüsefüllung', portionGrams: 220, carbsGrams: 3 },
    ],
  },
  {
    id: 'diff_currywurst_pommes',
    name: 'Currywurst mit Pommes Frites (Manta-Platte)',
    category: 'Imbiss & Fast Food',
    typicalPortionGrams: 380,
    typicalCarbsGrams: 72,
    carbRange: { min: 60, max: 85 },
    hiddenCarbsExplanation:
      'Die Pommes machen ca. 45–50g KH aus. Die größte Tücke ist die Currysauce: Ketchup- und Pflaumen-/Apfelmus-Basis bringt pro Portion 15–20g reinen, schnellen Zucker mit!',
    diabeticTrap:
      'Die Currysauce lässt den BZ schnell hochschnellen (hoher GI), während das Frittierfett der Pommes und Wurst die restliche Aufnahme streckt.',
    recommendedStrategy:
      'Spritz-Ess-Abstand (SEA) von 10–15 Minuten einhalten, um den schnellen Zucker der Currysauce abzufangen.',
    glycemicIndex: 'hoch',
    components: [
      { name: 'Pommes Frites frittiert', portionGrams: 160, carbsGrams: 50, note: 'Stärke' },
      { name: 'Currysauce (Ketchup-Basis)', portionGrams: 80, carbsGrams: 18, note: 'Sehr zuckerhaltig!' },
      { name: 'Bratwurst / Currywurst', portionGrams: 140, carbsGrams: 4, note: 'Fett & Eiweiß' },
    ],
  },

  // 2. ASIATISCH & WOK
  {
    id: 'diff_gebratene_nudeln_wok',
    name: 'Gebratene Wok-Nudeln mit Hähnchen',
    category: 'Asiatisch & Wok',
    typicalPortionGrams: 450,
    typicalCarbsGrams: 82,
    carbRange: { min: 70, max: 95 },
    hiddenCarbsExplanation:
      'Die Eiernudeln saugen sich beim Braten mit Wok-Öl voll und wiegen schwer (ca. 65g KH). Dunkle Wok-Saucen enthalten Sojasauce, Zucker, Maisstärke zum Andicken und Austernsauce (weitere 15g KH).',
    diabeticTrap:
      'Reis- und Eiernudeln wirken recht zügig, doch die Stärke in der Sauce verdichtet die Kohlenhydrate enorm. Portionsgrößen im Asia-Imbiss sind meist riesig (oft über 400g).',
    recommendedStrategy: 'Große Portionen lieber mit 7,5 bis 8,5 BE kalkulieren. Bolus kurz vor dem Essen abgeben.',
    glycemicIndex: 'hoch',
    components: [
      { name: 'Gebratene Eiernudeln', portionGrams: 280, carbsGrams: 68 },
      { name: 'Wok-Soße (Sojasauce, Stärke, Zucker)', portionGrams: 50, carbsGrams: 12 },
      { name: 'Hähnchenbruststreifen & Gemüse', portionGrams: 120, carbsGrams: 2 },
    ],
  },
  {
    id: 'diff_sweet_sour_chicken',
    name: 'Knuspriges Hähnchen Süß-Sauer mit Reis',
    category: 'Asiatisch & Wok',
    typicalPortionGrams: 500,
    typicalCarbsGrams: 98,
    carbRange: { min: 85, max: 115 },
    hiddenCarbsExplanation:
      'Eine der schwierigsten Mahlzeiten überhaupt! 1. Die Panade um das Fleisch besteht aus Stärke/Mehl (~20g KH). 2. Die knallrote Süß-Sauer-Sauce besteht zu einem großen Teil aus reinem Zucker (~30g KH). 3. Die Portion weißer Duftreis schlägt mit ~48g KH zu.',
    diabeticTrap:
      'Explosiver Blutzuckeranstieg durch die zuckrige Sauce, gefolgt von einer verzögerten Fett-Resorption der frittierten Panade. Hypo-Gefahr bei Überkorrektur oder langanhaltende Hyperglykämie.',
    recommendedStrategy:
      'Spritz-Ess-Abstand unbedingt beachten (mind. 15 Min), falls Ausgangs-BZ normal ist. Eventuell Split-Bolus erwägen.',
    glycemicIndex: 'hoch',
    components: [
      { name: 'Jasmin-/Duftreis gekocht', portionGrams: 180, carbsGrams: 48 },
      { name: 'Süß-Sauer-Sauce', portionGrams: 120, carbsGrams: 28, note: 'Sehr viel gelöster Zucker!' },
      { name: 'Gebackenes Hähnchen mit Panade', portionGrams: 160, carbsGrams: 20, note: 'Teighülle/Panade hat viele KH' },
      { name: 'Wok-Gemüse (Paprika, Ananas)', portionGrams: 40, carbsGrams: 2 },
    ],
  },
  {
    id: 'diff_sushi_box',
    name: 'Sushi Set (8 Maki + 4 Nigiri)',
    category: 'Asiatisch & Wok',
    typicalPortionGrams: 280,
    typicalCarbsGrams: 65,
    carbRange: { min: 55, max: 75 },
    hiddenCarbsExplanation:
      'Sushi-Reis ist kein normaler Naturreis: Er wird traditionell mit einer Mischung aus Reisessig, reichlich ZUCKER und Salz mariniert ("Sushi-Su"), damit er klebrig glänzt. Pro Rolle steckt deutlich mehr Zucker als vermutet.',
    diabeticTrap:
      'Klebriger, gewürzter Sushi-Reis hat einen sehr hohen Glykämischen Index. Der BZ schießt innerhalb von 45–60 Minuten steil nach oben. Fisch/Avocado liefern nur wenig Verzögerung.',
    recommendedStrategy:
      'Faustformel: 1 Stück Nigiri = ca. 5g KH (ca. 0,4 BE). 1 Stück Maki = ca. 3,5g KH (ca. 0,3 BE). 1 Inside-Out Roll = ca. 5–6g KH. Etwas SEA einhalten.',
    glycemicIndex: 'hoch',
    components: [
      { name: 'Gezuckerter Sushi-Klebreis', portionGrams: 200, carbsGrams: 58, note: 'Enthält Reisessig-Zuckermarinade' },
      { name: 'Lachs, Thunfisch & Nori-Alge', portionGrams: 70, carbsGrams: 1 },
      { name: 'Sojasauce & Ingwer', portionGrams: 20, carbsGrams: 6, note: 'Eingelegter Ingwer ist gezuckert' },
    ],
  },

  // 3. ITALIENISCH & PIZZA
  {
    id: 'diff_pizza_margherita_steinofen',
    name: 'Pizza Margherita (30cm Steinofen)',
    category: 'Italienisch & Pizza',
    typicalPortionGrams: 380,
    typicalCarbsGrams: 95,
    carbRange: { min: 85, max: 110 },
    hiddenCarbsExplanation:
      'Der Pizzateig aus Weizenmehl Typ 00 wiegt ca. 250–280g Rohteig = ca. 85g reine Kohlenhydrate. Die Tomatensauce bringt ca. 8–10g KH mit.',
    diabeticTrap:
      'Der berüchtigte "Pizza-Effekt": Unmengen an Fett aus Mozzarella und Olivenöl blockieren die Magenentleerung. Der Blutzucker bleibt 2 Stunden flach (Gefahr von Unterzuckerung bei vollem Sofortbolus!), explodiert dann aber nach 3–6 Stunden.',
    recommendedStrategy:
      'Niemals 100% sofort bolusen! Empfehlung: 50–60% vor dem Essen, die restlichen 40–50% nach 2 bis 2,5 Stunden nachspritzen (oder dualer Bolus bei Pumpe). 3h-Alarm stellen!',
    glycemicIndex: 'mittel',
    components: [
      { name: 'Hefeteigboden (30cm)', portionGrams: 260, carbsGrams: 86, note: 'Feines Weißmehl' },
      { name: 'Pizzatomatensauce gewürzt', portionGrams: 70, carbsGrams: 8 },
      { name: 'Mozzarella & Olivenöl', portionGrams: 90, carbsGrams: 1, note: 'Enorm viele FPE (Fett-Verzögerung)' },
    ],
  },
  {
    id: 'diff_lasagne_bolognese',
    name: 'Lasagne al Forno (Bolognese)',
    category: 'Italienisch & Pizza',
    typicalPortionGrams: 400,
    typicalCarbsGrams: 62,
    carbRange: { min: 50, max: 75 },
    hiddenCarbsExplanation:
      'Nudelplatten liefern ca. 45g KH. Versteckte Kohlenhydrate lauern in der Béchamel-Sauce (wird mit Butter und reichlich Weizenmehl/Mehlschwitze angedickt = ca. 12g KH) sowie Möhren/Zucker in der Tomatenbolognese.',
    diabeticTrap:
      'Kombination aus Hackfleisch, Béchamel und Gratin-Käse liefert hohe FPE. Blutzucker steigt zeitverzögert an.',
    recommendedStrategy: 'Ca. 5–6 BE kalkulieren. Bolusabgabe direkt zu Beginn der Mahlzeit, BZ nach 2,5h prüfen.',
    glycemicIndex: 'mittel',
    components: [
      { name: 'Lasagne-Nudelplatten', portionGrams: 150, carbsGrams: 45 },
      { name: 'Béchamelsauce (Mehlschwitze)', portionGrams: 100, carbsGrams: 12, note: 'Mehlbindung beachten' },
      { name: 'Bolognese-Hackfleischsauce & Käse', portionGrams: 150, carbsGrams: 5 },
    ],
  },

  // 4. HAUSMANNSKOST & DEFTIG
  {
    id: 'diff_schnitzel_panade_kartoffelsalat',
    name: 'Schnitzel Wiener Art mit Kartoffelsalat',
    category: 'Hausmannskost & Deftig',
    typicalPortionGrams: 420,
    typicalCarbsGrams: 62,
    carbRange: { min: 50, max: 75 },
    hiddenCarbsExplanation:
      'Fleisch hat 0g KH, aber die knusprige Panade (Mehl + Semmelbrösel) saugt Fett auf und hat allein ca. 22–28g KH! Der schwäbische oder bayrische Kartoffelsalat wird mit heißer Brühe und oft 1–2 TL Zucker mariniert (ca. 35g KH).',
    diabeticTrap:
      'Viele Diabetiker vergessen die Panade komplett einzurechnen und wundern sich über unerklärliche BZ-Werte von über 200 mg/dl.',
    recommendedStrategy:
      'Immer 2 bis 2,5 BE nur für die Panade anrechnen! Den Kartoffelsalat mit ca. 3 BE (bei 200g Portion) veranschlagen.',
    glycemicIndex: 'mittel',
    components: [
      { name: 'Kartoffelsalat (mit Essig/Öl/Brühe)', portionGrams: 200, carbsGrams: 36 },
      { name: 'Panade aus Semmelbrösel & Mehl', portionGrams: 70, carbsGrams: 25, note: 'Häufig vergessen!' },
      { name: 'Schweine- oder Kalbsschnitzel', portionGrams: 150, carbsGrams: 1, note: 'Reines Eiweiß/Fett' },
    ],
  },
  {
    id: 'diff_kaesespaetzle',
    name: 'Käsespätzle mit Röstzwiebeln',
    category: 'Hausmannskost & Deftig',
    typicalPortionGrams: 380,
    typicalCarbsGrams: 74,
    carbRange: { min: 62, max: 88 },
    hiddenCarbsExplanation:
      'Frische Eierspätzle bestehen aus Mehl und Eiern (ca. 60g KH). Die Röstzwiebeln werden vor dem Frittieren fast immer in Mehl gewendet, um kross zu werden (+10g KH).',
    diabeticTrap:
      'Enorme Mengen Bergkäse/Emmentaler und Butter sorgen für extreme Fettmengen. Verzögerter Anstieg über 4–5 Stunden.',
    recommendedStrategy: 'Split-Bolus empfohlen. Nicht zu früh nachkorrigieren, da der Bolus erst spät greift.',
    glycemicIndex: 'mittel',
    components: [
      { name: 'Eierspätzle gekocht', portionGrams: 250, carbsGrams: 62 },
      { name: 'Röstzwiebeln (in Mehl frittiert)', portionGrams: 40, carbsGrams: 10, note: 'Mehlhülle beachten' },
      { name: 'Würziger Reibekäse & Butter', portionGrams: 90, carbsGrams: 2, note: 'Hohe FPE' },
    ],
  },
  {
    id: 'diff_kartoffelpuffer_apfelmus',
    name: 'Kartoffelpuffer / Reibekuchen mit Apfelmus (3 Stück)',
    category: 'Hausmannskost & Deftig',
    typicalPortionGrams: 350,
    typicalCarbsGrams: 78,
    carbRange: { min: 65, max: 92 },
    hiddenCarbsExplanation:
      'Geriebene Kartoffeln werden mit Stärke oder Mehl gebunden und schwimmend in Fett ausgebacken (3 Puffer = ca. 45g KH). Das dazu servierte Apfelmus ist meist gezuckert (100g = ca. 22g schnelle Fructose/Saccharose!).',
    diabeticTrap:
      'Gezuckertes Apfelmus geht pfeilschnell ins Blut (Steilkurve im Libre 3), während das Frittieröl den Kartoffelanteil nach hinten zieht.',
    recommendedStrategy:
      'Spritz-Ess-Abstand 10–15 Min. Wenn möglich ungezuckertes Apfelmark wählen.',
    glycemicIndex: 'hoch',
    components: [
      { name: '3 Kartoffelpuffer in Fett gebacken', portionGrams: 240, carbsGrams: 48 },
      { name: 'Apfelmus gezuckert', portionGrams: 110, carbsGrams: 28, note: 'Schneller Zuckeranstieg' },
    ],
  },

  // 5. BÄCKEREI & CAFÉ
  {
    id: 'diff_franzbroetchen',
    name: 'Franzbrötchen (Zimt-Zucker Plundergebäck)',
    category: 'Bäckerei & Café',
    typicalPortionGrams: 120,
    typicalCarbsGrams: 58,
    carbRange: { min: 50, max: 68 },
    hiddenCarbsExplanation:
      'Ein Meisterstück an verstecktem Zucker: Der Plunderteig ist mit karamellisiertem Zimt-Zucker und üppig Butter gefüllt. Ein einziges Stück wiegt 100–130g und entspricht fast 5 ganzen Broteinheiten!',
    diabeticTrap:
      'Sehr hoher Zuckergehalt bei gleichzeitig hohem Butterfett. Der Blutzucker schießt zunächst hoch und bleibt dann stundenlang erhöht.',
    recommendedStrategy:
      'Voll berechnen mit mind. 4,8 bis 5,2 BE. Spritz-Ess-Abstand 10 Min vor dem ersten Bissen.',
    glycemicIndex: 'hoch',
    components: [
      { name: 'Plunderteig gebacken', portionGrams: 85, carbsGrams: 34 },
      { name: 'Zimt-Zucker-Karamellfüllung', portionGrams: 35, carbsGrams: 24, note: 'Reiner Zucker' },
    ],
  },
  {
    id: 'diff_laugenstange_ueberbacken',
    name: 'Laugenstange mit Käse überbacken',
    category: 'Bäckerei & Café',
    typicalPortionGrams: 110,
    typicalCarbsGrams: 46,
    carbRange: { min: 40, max: 54 },
    hiddenCarbsExplanation:
      'Laugengebäck hat eine höhere Dichte als normales Brötchenmehl. Eine einzige Laugenstange bringt es auf ca. 45–48g KH (ca. 4 BE).',
    diabeticTrap: 'Wird oft wie ein kleines Frühstücksbrötchen unterschätzt (das nur 30g KH hat).',
    recommendedStrategy: 'Mit 3,8 bis 4 BE berechnen.',
    glycemicIndex: 'hoch',
    components: [
      { name: 'Laugengebäck-Teig', portionGrams: 95, carbsGrams: 45 },
      { name: 'Gouda überbacken', portionGrams: 25, carbsGrams: 1 },
    ],
  },

  // 6. INTERNATIONAL
  {
    id: 'diff_burrito_grande',
    name: 'Burrito Grande (Rind, Reis, Bohnen, Käse)',
    category: 'International',
    typicalPortionGrams: 450,
    typicalCarbsGrams: 86,
    carbRange: { min: 75, max: 100 },
    hiddenCarbsExplanation:
      'Die große Weizentortilla hat allein ~40g KH. Drinnen stecken mexikanischer Reis (~25g KH) und Pintobohnen/Refried Beans (~18g KH). Guacamole und Sour Cream liefern Fett.',
    diabeticTrap:
      'Bohnen enthalten komplexe Ballaststoffe und Stärke, die sehr langsam verstoffwechselt werden. Später Anstieg nach 3 Stunden garantiert.',
    recommendedStrategy: 'Split-Bolus: 60% sofort, 40% nach 2h. 7 bis 8 BE ansetzen.',
    glycemicIndex: 'mittel',
    components: [
      { name: 'Große Weizentortilla (30cm)', portionGrams: 110, carbsGrams: 42 },
      { name: 'Mexikanischer Würzreis', portionGrams: 100, carbsGrams: 25 },
      { name: 'Schwarze / Pinto Bohnen', portionGrams: 90, carbsGrams: 16 },
      { name: 'Rindfleisch, Käse, Salsa', portionGrams: 150, carbsGrams: 3 },
    ],
  },
  {
    id: 'diff_butter_chicken_naan',
    name: 'Indisches Butter Chicken mit Basmatireis & Knoblauch Naan',
    category: 'International',
    typicalPortionGrams: 550,
    typicalCarbsGrams: 112,
    carbRange: { min: 95, max: 130 },
    hiddenCarbsExplanation:
      'Eine der größten Kohlenhydrat-Bomben: 1. Eine Portion Basmatireis = ~45g KH. 2. Ein frisches Knoblauch-Naan-Brot = ~48g KH. 3. Die sämige Makhani-Tomatensoße wird mit Sahne, Butter und oft reichlich Honig oder Zucker eingekocht (+18g KH).',
    diabeticTrap:
      'Extreme Kombination aus weißem Mehl, Reis, Zucker in der Soße und viel Ghee/Butter. Hält den Blutzucker bis zu 6 Stunden auf Trab.',
    recommendedStrategy:
      'Dringend Split-Bolus erforderlich. Bei Insulinpens: Teil 1 vor dem Essen, Teil 2 nach 2 Stunden spritzen. 9 bis 10 BE.',
    glycemicIndex: 'hoch',
    components: [
      { name: 'Knoblauch Naan-Brot aus dem Tandoor', portionGrams: 130, carbsGrams: 48, note: 'Sehr dichtes Weißmehl' },
      { name: 'Basmatireis gedämpft', portionGrams: 160, carbsGrams: 44 },
      { name: 'Makhani Buttersauce (mit Honig/Zucker)', portionGrams: 140, carbsGrams: 18, note: 'Versteckter Zucker in Sauce' },
      { name: 'Hähnchenfleisch mariniert', portionGrams: 120, carbsGrams: 2 },
    ],
  },
];
