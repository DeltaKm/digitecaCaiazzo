import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkManifestUrl() {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: '698e18d1441b9fa7818ceb9f' },
      select: {
        id: true,
        title: true,
        manifestUrl: true,
        license: true,
        ccType: true
      }
    });
    
    console.log('📄 Documento trovato:');
    console.log(JSON.stringify(doc, null, 2));
    
    if (doc?.manifestUrl) {
      console.log('\n🔗 Il manifest URL è:', doc.manifestUrl);
      
      if (doc.manifestUrl.includes('localhost')) {
        console.log('✅ Punta a LOCALHOST - dovrebbe funzionare');
      } else if (doc.manifestUrl.includes('vercel')) {
        console.log('⚠️  Punta a VERCEL PRODUZIONE - potrebbe non avere i cambiamenti');
      } else {
        console.log('❓ URL non riconosciuto');
      }
    }
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkManifestUrl();
