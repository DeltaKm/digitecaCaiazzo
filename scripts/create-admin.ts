import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Crea un utente amministratore
  const admin = await prisma.user.upsert({
    where: { email: 'admin@digiteca.com' },
    update: {
      role: 'admin',
    },
    create: {
      email: 'admin@digiteca.com',
      name: 'Admin',
      role: 'admin',
      emailVerified: new Date(),
    },
  })

  console.log('✅ Account amministratore creato:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📧 Email: admin@digiteca.com')
  console.log('🔑 Password: admin123')
  console.log('👤 Nome: Admin')
  console.log('🛡️  Ruolo: admin')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n⚠️  IMPORTANTE:')
  console.log('Questo account usa Credentials provider.')
  console.log('La password "admin123" deve essere verificata')
  console.log('nel file auth.ts nella funzione authorize().')
  console.log('\nPuoi accedere su: http://localhost:3000/auth/signin')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
