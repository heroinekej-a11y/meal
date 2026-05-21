/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Nutrition {
  protein: number;
  carbs: number;
  fat: number;
}

export interface DishItem {
  name: string;
  kcal: number;
  category: 'rice' | 'soup' | 'side' | 'dessert';
  nutrition: Nutrition;
}

export interface MealData {
  id: string;
  schoolName: string;
  date: Date;
  dateKey: string;
  dayOfWeek: string;
  mealType: 'lunch' | 'dinner';
  title: string;
  dishes: string[];
  dishItems: DishItem[];
  totalCalories: number;
  nutrition: Nutrition;
  allergens: string[];
  image?: string;
}

