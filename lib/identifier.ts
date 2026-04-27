import { prisma } from "./prisma"

/**
 * Genera un identificativo univoco per un documento
 * Formato: CAT-NNNNNN
 * Esempio: ARC-000123
 */
export async function generateUniqueIdentifier(
  category: string,
  subcategory: string
): Promise<string> {
  // Estrae le prime 3 lettere della categoria
  const catPrefix = category
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, '') // Rimuove caratteri non alfabetici

  // Assicura che abbia almeno 3 caratteri (padding con X se necessario)
  const catCode = catPrefix.padEnd(3, 'X')

  // Cerca l'ultimo documento con lo stesso prefisso
  const lastDocument = await prisma.document.findFirst({
    where: {
      identifier: {
        startsWith: `${catCode}-`
      }
    },
    orderBy: {
      identifier: 'desc'
    }
  })

  let nextNumber = 1

  if (lastDocument) {
    // Estrae il numero dall'identificativo (es: "ARC-000123" -> 123)
    const match = lastDocument.identifier.match(/-(\d+)$/)
    if (match) {
      nextNumber = parseInt(match[1]) + 1
    }
  }

  // Formatta il numero con padding di 6 cifre
  const numberPart = nextNumber.toString().padStart(6, '0')

  return `${catCode}-${numberPart}`
}

/**
 * Valida un identificativo
 */
export function validateIdentifier(identifier: string): boolean {
  // Formato: 3 lettere - 6 numeri
  const pattern = /^[A-Z]{3}-\d{6}$/
  return pattern.test(identifier)
}

/**
 * Estrae informazioni da un identificativo
 */
export function parseIdentifier(identifier: string) {
  const match = identifier.match(/^([A-Z]{3})-(\d{6})$/)
  
  if (!match) {
    return null
  }

  return {
    categoryPrefix: match[1],
    number: parseInt(match[2])
  }
}
