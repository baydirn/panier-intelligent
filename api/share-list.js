import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { title = 'Ma liste', data = {}, ownerEmail } = req.body || {}
    if (!ownerEmail) {
      res.status(400).json({ error: 'ownerEmail requis' })
      return
    }

    // Ensure owner user exists
    const owner = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {},
      create: {
        email: ownerEmail,
        displayName: ownerEmail.split('@')[0],
        tier: 'free'
      }
    })

    const shareCode = nanoid(10)

    const sharedList = await prisma.sharedList.create({
      data: {
        ownerId: owner.id,
        title,
        data,
        shareCode,
        members: {
          create: [{ userId: owner.id, role: 'admin' }]
        }
      },
      include: { owner: true }
    })

    res.status(200).json({
      id: sharedList.id,
      shareCode: sharedList.shareCode,
      url: `/shared/${sharedList.shareCode}`,
      owner: { email: owner.email }
    })
  } catch (e) {
    console.error('[share-list] error', e)
    res.status(500).json({ error: 'Internal error', details: e.message })
  }
}
