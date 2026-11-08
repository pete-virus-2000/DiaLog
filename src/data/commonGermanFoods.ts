import { FoodPreset } from '../types/diabetes';

export const COMMON_GERMAN_FOODS: FoodPreset[] = [
  // Brot & Backwaren
  { id: 'brot_vollkorn', name: 'Vollkornbrot', category: 'Brot & Backwaren', carbsPer100g: 38, standardPortionGrams: 50, standardPortionLabel: '1 Scheibe (ca. 50g)' },
  { id: 'brot_misch', name: 'Mischbrot / Graubrot', category: 'Brot & Backwaren', carbsPer100g: 45, standardPortionGrams: 50, standardPortionLabel: '1 Scheibe (ca. 50g)' },
  { id: 'brot_toast', name: 'Toastbrot (weiß)', category: 'Brot & Backwaren', carbsPer100g: 50, standardPortionGrams: 30, standardPortionLabel: '1 Scheibe Toast (ca. 30g)' },
  { id: 'broetchen_weizen', name: 'Weizenbrötchen / Semmel', category: 'Brot & Backwaren', carbsPer100g: 52, standardPortionGrams: 60, standardPortionLabel: '1 Brötchen (ca. 60g)' },
  { id: 'brezel', name: 'Laugenbrezel', category: 'Brot & Backwaren', carbsPer100g: 54, standardPortionGrams: 85, standardPortionLabel: '1 Brezel (ca. 85g)' },
  { id: 'croissant', name: 'Croissant (Butter)', category: 'Brot & Backwaren', carbsPer100g: 45, standardPortionGrams: 60, standardPortionLabel: '1 Stück (ca. 60g)' },
  { id: 'knaeckebrot', name: 'Knäckebrot', category: 'Brot & Backwaren', carbsPer100g: 65, standardPortionGrams: 15, standardPortionLabel: '1 Scheibe (ca. 15g)' },

  // Beilagen & Getreide (gekocht)
  { id: 'nudeln_gekocht', name: 'Nudeln / Pasta (gekocht)', category: 'Beilagen & Getreide', carbsPer100g: 28, standardPortionGrams: 180, standardPortionLabel: '1 tiefer Teller (ca. 180g)' },
  { id: 'reis_gekocht', name: 'Reis (Basmati/Langkorn, gekocht)', category: 'Beilagen & Getreide', carbsPer100g: 28, standardPortionGrams: 150, standardPortionLabel: '1 Portion (ca. 150g)' },
  { id: 'kartoffeln_salz', name: 'Salzkartoffeln / Pellkartoffeln', category: 'Beilagen & Getreide', carbsPer100g: 15, standardPortionGrams: 200, standardPortionLabel: '3 mittelgroße (ca. 200g)' },
  { id: 'kartoffelbrei', name: 'Kartoffelpüree', category: 'Beilagen & Getreide', carbsPer100g: 14, standardPortionGrams: 200, standardPortionLabel: '1 Portion (ca. 200g)' },
  { id: 'pommes', name: 'Pommes Frites (gebacken)', category: 'Beilagen & Getreide', carbsPer100g: 36, standardPortionGrams: 150, standardPortionLabel: '1 Portion (ca. 150g)' },
  { id: 'haferflocken', name: 'Haferflocken (roh)', category: 'Beilagen & Getreide', carbsPer100g: 60, standardPortionGrams: 50, standardPortionLabel: '5 EL (ca. 50g)' },
  { id: 'muesli', name: 'Früchtemüsli ungezuckert', category: 'Beilagen & Getreide', carbsPer100g: 62, standardPortionGrams: 60, standardPortionLabel: '1 Schale (ca. 60g)' },

  // Obst & Früchte
  { id: 'apfel', name: 'Apfel', category: 'Obst & Früchte', carbsPer100g: 11.4, standardPortionGrams: 150, standardPortionLabel: '1 mittelgroßer Apfel (ca. 150g)' },
  { id: 'banane', name: 'Banane (geschält)', category: 'Obst & Früchte', carbsPer100g: 20, standardPortionGrams: 110, standardPortionLabel: '1 Banane (ca. 110g)' },
  { id: 'orange', name: 'Orange / Mandarine', category: 'Obst & Früchte', carbsPer100g: 8.3, standardPortionGrams: 130, standardPortionLabel: '1 Stück (ca. 130g)' },
  { id: 'erdbeeren', name: 'Erdbeeren', category: 'Obst & Früchte', carbsPer100g: 5.5, standardPortionGrams: 200, standardPortionLabel: '1 Schälchen (ca. 200g)' },
  { id: 'weintrauben', name: 'Weintrauben', category: 'Obst & Früchte', carbsPer100g: 16, standardPortionGrams: 125, standardPortionLabel: '1 Handvoll (ca. 125g)' },
  { id: 'beeren_mix', name: 'Waldbeeren / Blaubeeren', category: 'Obst & Früchte', carbsPer100g: 7.5, standardPortionGrams: 150, standardPortionLabel: '1 Schälchen (ca. 150g)' },

  // Milchprodukte & Pflanzendrinks
  { id: 'milch_kuh', name: 'Kuhmilch 1,5% / 3,5%', category: 'Milch & Drinks', carbsPer100g: 4.8, standardPortionGrams: 200, standardPortionLabel: '1 Glas (ca. 200ml)' },
  { id: 'hafermilch', name: 'Haferdrink (Natur)', category: 'Milch & Drinks', carbsPer100g: 6.5, standardPortionGrams: 200, standardPortionLabel: '1 Glas (ca. 200ml)' },
  { id: 'joghurt_natur', name: 'Naturjoghurt 3,5%', category: 'Milch & Drinks', carbsPer100g: 4.5, standardPortionGrams: 150, standardPortionLabel: '1 Becher (ca. 150g)' },
  { id: 'fruchtjoghurt', name: 'Fruchtjoghurt gezuckert', category: 'Milch & Drinks', carbsPer100g: 14, standardPortionGrams: 150, standardPortionLabel: '1 Becher (ca. 150g)' },
  { id: 'quark_mager', name: 'Magerquark', category: 'Milch & Drinks', carbsPer100g: 3.5, standardPortionGrams: 150, standardPortionLabel: '1 Schale (ca. 150g)' },

  // Mahlzeiten & Fast Food
  { id: 'pizza_margherita', name: 'Pizza Margherita / Salami', category: 'Mahlzeiten & Fast Food', carbsPer100g: 30, standardPortionGrams: 350, standardPortionLabel: '1 ganze Pizza (ca. 350g)' },
  { id: 'doener', name: 'Döner Kebab im Fladenbrot', category: 'Mahlzeiten & Fast Food', carbsPer100g: 18, standardPortionGrams: 400, standardPortionLabel: '1 Döner (ca. 400g)' },
  { id: 'currywurst_pommes', name: 'Currywurst mit Pommes', category: 'Mahlzeiten & Fast Food', carbsPer100g: 22, standardPortionGrams: 350, standardPortionLabel: '1 Portion (ca. 350g)' },
  { id: 'lasagne', name: 'Lasagne Bolognese', category: 'Mahlzeiten & Fast Food', carbsPer100g: 16, standardPortionGrams: 350, standardPortionLabel: '1 Portion (ca. 350g)' },
  { id: 'burger_cheeseburger', name: 'Cheeseburger', category: 'Mahlzeiten & Fast Food', carbsPer100g: 28, standardPortionGrams: 120, standardPortionLabel: '1 Burger (ca. 120g)' },
  { id: 'sushi_rollen', name: 'Sushi Mix (Maki / Nigiri)', category: 'Mahlzeiten & Fast Food', carbsPer100g: 24, standardPortionGrams: 200, standardPortionLabel: '8 Stück (ca. 200g)' },

  // Schnelle KH & Notfall (Hypo)
  { id: 'traubenzucker', name: 'Traubenzucker Plättchen (Hypo-Helfer)', category: 'Hypo-Helfer & Süßes', carbsPer100g: 90, standardPortionGrams: 12, standardPortionLabel: '2 Täfelchen / 1 Röhrchen (ca. 12g = 1 BE)' },
  { id: 'apfelsaft', name: 'Apfelsaft / Orangensaft', category: 'Hypo-Helfer & Süßes', carbsPer100g: 10.5, standardPortionGrams: 150, standardPortionLabel: '1 kleines Glas (ca. 150ml = 1.3 BE)' },
  { id: 'cola_original', name: 'Coca-Cola (Original gezuckert)', category: 'Hypo-Helfer & Süßes', carbsPer100g: 10.6, standardPortionGrams: 200, standardPortionLabel: '1 Glas (ca. 200ml = 1.7 BE)' },
  { id: 'gummibaerchen', name: 'Gummibärchen', category: 'Hypo-Helfer & Süßes', carbsPer100g: 77, standardPortionGrams: 25, standardPortionLabel: '1 kleine Handvoll (ca. 25g)' },
  { id: 'schokolade_vollmilch', name: 'Vollmilchschokolade', category: 'Hypo-Helfer & Süßes', carbsPer100g: 54, standardPortionGrams: 25, standardPortionLabel: '4 Rippchen (ca. 25g)' },
];
