// src/categoryService.ts
/**
 * Shared Category Service for Product Categories and Item Categories.
 * Provides custom category creation, persistence in localStorage, and category deletion.
 */

export const DEFAULT_PRODUCT_CATEGORIES = [
  'Hardware & Sliders',
  'Raw Fabric Tape',
  'Coil / Teeth',
  'Threads & Needles',
  'Machine Spare Parts',
  'Lubricants & Chemical',
  'Packaging Cartons & Poly',
  'Stationery & Labels',
  'Zippers & Fasteners',
  'Metal Goods & Buttons',
  'Elastic & Ribbons',
  'Accessories & Trims',
  'Finished Goods',
  'Fabric & Textiles',
  'Dyes & Pigments',
  'General Factory Store',
  'Other'
];

const CATEGORIES_KEY = 'caf_custom_product_categories';

export const getStoredCategories = (): string[] => {
  try {
    const saved = localStorage.getItem(CATEGORIES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return Array.from(new Set([...DEFAULT_PRODUCT_CATEGORIES, ...parsed]));
      }
    }
  } catch {}
  return [...DEFAULT_PRODUCT_CATEGORIES];
};

export const saveCustomCategory = (newCat: string): string[] => {
  const trimmed = newCat.trim();
  if (!trimmed) return getStoredCategories();
  const current = getStoredCategories();
  if (!current.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
    const updated = [...current, trimmed];
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
    } catch {}
    return updated;
  }
  return current;
};

export const deleteCustomCategory = (catToDelete: string): string[] => {
  const current = getStoredCategories();
  const updated = current.filter(c => c.toLowerCase() !== catToDelete.toLowerCase());
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
};
