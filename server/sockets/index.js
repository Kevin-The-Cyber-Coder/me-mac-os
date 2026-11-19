import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

let io = null

export function initSockets(httpServer) {
  const allowed = [env.clientUrl, ...env.allowedOrigins].filter(Boolean)
  io = new Server(httpServer, {
    cors: { origin: allowed.length ? allowed : true, credentials: true },
    path: '/socket.io',
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next()
    try {
      const payload = jwt.verify(token, env.accessSecret)
      if (payload.type === 'access') {
        socket.data.admin = { id: payload.sub, role: payload.role, name: payload.name }
      }
    } catch {
      // Visitors may stay connected without privileged channels.
    }
    next()
  })

  io.on('connection', (socket) => {
    socket.join('public')
    if (socket.data.admin) socket.join('admin')
    socket.emit('socket:ready', { privileged: Boolean(socket.data.admin) })
  })

  return io
}

export function getIO() {
  return io
}

export function emitToAdmins(event, payload) {
  if (!io) return
  io.to('admin').emit(event, payload)
}

export function emitPublic(event, payload) {
  if (!io) return
  io.to('public').emit(event, payload)
}
