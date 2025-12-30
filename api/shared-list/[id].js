import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { id } = req.query || {}

  if (!id) {
    res.status(400).json({ error: 'id (shareCode) requis' })
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const sharedList = await prisma.sharedList.findUnique({
      where: { shareCode: id },
      include: {
        owner: true,
        members: { include: { user: true } }
      }
    })

    if (!sharedList) {
      res.status(404).json({ error: 'Liste partagée introuvable' })
      return
    }

    res.status(200).json({
      id: sharedList.id,
      title: sharedList.title,
      data: sharedList.data,
      shareCode: sharedList.shareCode,
      owner: {
        email: sharedList.owner.email,
        displayName: sharedList.owner.displayName
      },
      members: sharedList.members.map(m => ({
        email: m.user.email,
        role: m.role
      }))
    })
  } catch (e) {
    console.error('[shared-list] error', e)
    res.status(500).json({ error: 'Internal error', details: e.message })
  }
}
