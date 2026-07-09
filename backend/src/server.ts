import http from 'node:http'
import { getEnv } from './config/env'
import { createApp } from './app'
import { getDatabase } from './db/client'
import { attachWebSocketServer } from './realtime/wsServer'
import { startSimulator } from './realtime/simulator'

const env = getEnv()
getDatabase()

const server = http.createServer(createApp())
attachWebSocketServer(server)

if (env.ENABLE_SIMULATOR) {
  startSimulator()
}

server.listen(env.PORT, () => {
  console.info(`Smart Stadium backend listening on http://localhost:${env.PORT}`)
})
