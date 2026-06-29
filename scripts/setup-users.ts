import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const USERS = [
  {
    email: 'admin@digiteca.com',
    name: 'Admin',
    password: 'QhZri2T!X3',
    role: 'admin',
  },
  {
    email: 'delucasergio.poliziamunicipale@comune.caiazzo.ce.it',
    name: 'De Luca Sergio',
    password: 'PMlFRZqLmBm2WOw5',
    role: 'admin',
  },
]

async function main() {
  console.log('🔐 Creazione/aggiornamento utenti con password bcrypt...\n')

  for (const u of USERS) {
    const hashedPassword = await bcrypt.hash(u.password, 12)

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        password: hashedPassword,
        role: u.role,
        name: u.name,
      },
      create: {
        email: u.email,
        name: u.name,
        password: hashedPassword,
        role: u.role,
        emailVerified: new Date(),
      },
    })

    console.log(`✅ ${u.email}`)
    console.log(`   👤 Nome: ${user.name}`)
    console.log(`   🛡️  Ruolo: ${user.role}`)
    console.log(`   🔑 Password hashata con bcrypt (cost 12)\n`)
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Setup completato. Puoi accedere su /auth/signin')
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
