// Sistema di categorie per Digiteca
// Questo file contiene le definizioni delle categorie e sottocategorie

export interface Category {
  id: string
  name: string
  subcategories: string[]
}

export const CATEGORIES: Category[] = [
  {
    id: 'archivi',
    name: 'Archivi',
    subcategories: [
      'amministrativi',
      'carteggi',
      'mappe',
      'notarili',
      'pergamene',
      'registri'
    ]
  },
  {
    id: 'audio',
    name: 'Audio',
    subcategories: [
      'interviste',
      'memorie',
      'musiche',
      'storiche',
      'suoni'
    ]
  },
  {
    id: 'biblioteca',
    name: 'Biblioteca',
    subcategories: [
      'cartografia',
      'cataloghi',
      'ebook',
      'libri',
      'manoscritti',
      'multimediali',
      'opuscoli',
      'periodici'
    ]
  },
  {
    id: 'immagini',
    name: 'Immagini',
    subcategories: [
      'cartoline',
      'diapositive',
      'grafica',
      'gruppi',
      'illustrazioni',
      'recenti',
      'ritratti',
      'storiche'
    ]
  },
  {
    id: 'kere',
    name: 'Kere',
    subcategories: [
      'arredi',
      'attrezzi',
      'multimediali',
      'pratiche',
      'religione',
      'tradizioni',
      'utensili'
    ]
  },
  {
    id: 'materiali',
    name: 'Materiali',
    subcategories: [
      'animazioni',
      'didattici',
      'media',
      'mostre',
      'pannelli',
      'supporti'
    ]
  },
  {
    id: 'radici',
    name: 'Radici',
    subcategories: [
      'biografie',
      'documenti',
      'famiglie',
      'fotografie',
      'genealogie',
      'memorie',
      'persone',
      'storie'
    ]
  },
  {
    id: 'regesti',
    name: 'Regesti',
    subcategories: [
      'abstract',
      'corredi',
      'edizioni',
      'regesti',
      'traduzioni',
      'trascrizioni'
    ]
  },
  {
    id: 'video',
    name: 'Video',
    subcategories: [
      'documentari',
      'eventi',
      'interviste',
      'manifestazioni',
      'reportage',
      'spettacoli'
    ]
  }
]

// Helper functions

/**
 * Ottiene una categoria dal suo ID
 */
export function getCategoryById(categoryId: string): Category | undefined {
  return CATEGORIES.find(cat => cat.id === categoryId)
}

/**
 * Ottiene il nome visualizzato di una categoria
 */
export function getCategoryName(categoryId: string): string {
  const category = getCategoryById(categoryId)
  return category?.name || categoryId
}

/**
 * Valida se una combinazione categoria/sottocategoria è valida
 */
export function validateCategorySubcategory(
  categoryId: string,
  subcategory: string
): boolean {
  const category = getCategoryById(categoryId)
  if (!category) return false
  return category.subcategories.includes(subcategory)
}

/**
 * Ottiene tutte le sottocategorie di una categoria
 */
export function getSubcategories(categoryId: string): string[] {
  const category = getCategoryById(categoryId)
  return category?.subcategories || []
}
