import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Trova l'utente nel database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user) {
          return null
        }

        // Verifica credenziali admin (per demo)
        // In produzione, usa bcrypt per hashare le password!
        if (credentials.email === 'admin@digiteca.com' && credentials.password === 'admin123') {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        }

        return null
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 giorni
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.userRole = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId as string
        (session.user as any).role = token.userRole
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Accetta URL relativi (es: "/")
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Accetta qualsiasi URL dello stesso host - non forzare mai localhost
      try {
        const urlHost = new URL(url).host
        const baseHost = new URL(baseUrl).host
        if (urlHost === baseHost) return url
      } catch {}
      // Fallback: vai alla root del sito corrente
      return baseUrl
    }
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/",
    error: "/auth/signin",
  },
})
