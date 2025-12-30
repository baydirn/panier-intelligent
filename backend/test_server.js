// Serveur Express minimal pour diagnostic
// Objectif: Vérifier si le process Node reste vivant hors logique métier.
// Port dédié pour éviter conflit: 3002

import express from 'express'

const app = express()
const PORT = 3002

app.get('/ping', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

const server = app.listen(PORT, () => {
  console.log('[test_server] Listening on port', PORT)
})

// Keepalive explicite (au cas où scheduler vide)
setInterval(() => {
  process.stdout.write('.')
}, 5000)

// Log événements de cycle
process.on('beforeExit', (code) => {
  console.log('[test_server] beforeExit code=', code)
})
process.on('exit', (code) => {
  console.log('[test_server] exit code=', code)
})
process.on('uncaughtException', (err) => {
  console.error('[test_server] uncaughtException', err)
})
process.on('unhandledRejection', (reason, p) => {
  console.error('[test_server] unhandledRejection', reason)
})
