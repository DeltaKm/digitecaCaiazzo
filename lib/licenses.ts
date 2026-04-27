/**
 * Definizioni delle licenze disponibili per i documenti
 */

export const LICENSE_TYPES = {
  'tutti-i-diritti-riservati': {
    id: 'tutti-i-diritti-riservati',
    name: 'Tutti i diritti riservati',
    description: ''
  },
  'creative-commons': {
    id: 'creative-commons',
    name: 'Creative Commons (CC)',
    description: ''
  },
  'dominio-pubblico': {
    id: 'dominio-pubblico',
    name: 'Dominio pubblico',
    description: ''
  }
} as const

export type LicenseType = keyof typeof LICENSE_TYPES

export const LICENSE_OPTIONS = Object.values(LICENSE_TYPES)

/**
 * Tipi specifici di Creative Commons
 */
export const CC_TYPES = {
  'cc-by': {
    id: 'cc-by',
    name: 'CC BY - Attribuzione',
    description: 'Permette qualsiasi utilizzo, anche commerciale, purché si citi l\'autore',
    url: 'https://creativecommons.org/licenses/by/4.0/'
  },
  'cc-by-sa': {
    id: 'cc-by-sa',
    name: 'CC BY-SA - Attribuzione + Condividi allo stesso modo',
    description: 'Come CC BY, ma le opere derivate devono usare la stessa licenza',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/'
  },
  'cc-by-nc': {
    id: 'cc-by-nc',
    name: 'CC BY-NC - Attribuzione + Non commerciale',
    description: 'Permette l\'uso con attribuzione, ma non per scopi commerciali',
    url: 'https://creativecommons.org/licenses/by-nc/4.0/'
  }
} as const

export type CCType = keyof typeof CC_TYPES

export const CC_OPTIONS = Object.values(CC_TYPES)

/**
 * Ottiene il testo completo della licenza per il manifest IIIF
 */
export function getLicenseText(licenseId: string, ccType?: string): string {
  const license = LICENSE_TYPES[licenseId as LicenseType]
  if (!license) {
    return LICENSE_TYPES['tutti-i-diritti-riservati'].description
  }
  
  let text = `${license.name}\n\n${license.description}`
  
  // Se è Creative Commons e c'è un tipo specifico, aggiungi i dettagli
  if (licenseId === 'creative-commons' && ccType) {
    const cc = CC_TYPES[ccType as CCType]
    if (cc) {
      text = `${cc.name}\n\n${cc.description}\n\nMaggiori informazioni: ${cc.url}`
    }
  }
  
  return text
}

/**
 * Ottiene il nome breve della licenza
 */
export function getLicenseName(licenseId: string, ccType?: string): string {
  const license = LICENSE_TYPES[licenseId as LicenseType]
  if (!license) {
    return 'Tutti i diritti riservati'
  }
  
  // Se è Creative Commons e c'è un tipo specifico
  if (licenseId === 'creative-commons' && ccType) {
    const cc = CC_TYPES[ccType as CCType]
    if (cc) {
      return cc.name
    }
  }
  
  return license.name
}

/**
 * Ottiene l'URL della licenza per il campo rights di IIIF
 */
export function getLicenseUrl(licenseId: string, ccType?: string): string | undefined {
  // Se è Creative Commons e c'è un tipo specifico, ritorna l'URL
  if (licenseId === 'creative-commons' && ccType) {
    const cc = CC_TYPES[ccType as CCType]
    if (cc) {
      return cc.url
    }
  }
  
  // Per dominio pubblico, usa CC0
  if (licenseId === 'dominio-pubblico') {
    return 'https://creativecommons.org/publicdomain/zero/1.0/'
  }
  
  // Per tutti i diritti riservati, nessun URL standard
  return undefined
}
