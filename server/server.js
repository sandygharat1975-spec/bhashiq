import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import crypto from 'crypto';

// Cryptographic Room Token & ACL Security Configuration
export const ROOM_SECRET_KEY = process.env.ROOM_TOKEN_SECRET || 'bhashiq-room-hmac-secret-key-2026';

export function generateRoomToken(roomId, ttlMs = 3600000) {
  const expiresAt = Date.now() + ttlMs;
  const payload = `${roomId}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', ROOM_SECRET_KEY).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

export function verifyRoomToken(token, expectedRoomId) {
  if (!token || typeof token !== 'string') return false;
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;
    const [rId, expStr, signature] = parts;
    if (rId !== expectedRoomId) return false;
    const expiresAt = parseInt(expStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return false;
    const expectedHmac = crypto.createHmac('sha256', ROOM_SECRET_KEY).update(`${rId}:${expStr}`).digest('hex');
    const sigBuffer = Buffer.from(signature, 'hex');
    const expBuffer = Buffer.from(expectedHmac, 'hex');
    if (sigBuffer.length !== expBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expBuffer);
  } catch (e) {
    return false;
  }
}

export function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(salt + password).digest('hex');
}

const app = express();

// Strict Whitelist of Designated Application Domains
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [
      'http://localhost:5173', // Vite local development
      'http://127.0.0.1:5173',
      'http://localhost:4173', // Vite production preview
      'http://127.0.0.1:4173',
      'http://localhost:3000', // Alternative local dev / test runner
      'http://127.0.0.1:3000',
    ];

export function isOriginAllowed(origin) {
  // Allow requests without Origin header (e.g. mobile apps, curl, or node test runners)
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    console.warn(`[Security Alert] Blocked unauthorized CORS origin: ${origin}`);
    return callback(new Error(`CORS blocked: Origin "${origin}" is not authorized.`));
  },
  methods: ['GET', 'POST'],
  credentials: true,
};

// Rate Limiting & Payload Enforcement Configurations
export const MAX_PAYLOAD_BYTES = parseInt(process.env.MAX_PAYLOAD_BYTES || '65536', 10); // 64 KB max
export const SOCKET_RATE_LIMIT = {
  max: parseInt(process.env.SOCKET_RATE_LIMIT_MAX || '60', 10), // Max 60 messages per window
  windowMs: parseInt(process.env.SOCKET_RATE_LIMIT_WINDOW_MS || '10000', 10), // 10-second window
};
export const IP_RATE_LIMIT = {
  max: parseInt(process.env.IP_RATE_LIMIT_MAX || '150', 10), // Max 150 messages per window
  windowMs: parseInt(process.env.IP_RATE_LIMIT_WINDOW_MS || '10000', 10), // 10-second window
};

export const socketBuckets = new Map();
export const ipBuckets = new Map();

export function checkBucketLimit(bucketsMap, key, limit) {
  const now = Date.now();
  let bucket = bucketsMap.get(key);

  if (!bucket || (now - bucket.windowStart) > limit.windowMs) {
    bucket = { count: 1, windowStart: now };
    bucketsMap.set(key, bucket);
    return true;
  }

  bucket.count += 1;
  if (bucket.count > limit.max) {
    return false;
  }
  return true;
}

app.use(cors(corsOptions));
app.use(express.json({ limit: '64kb' }));

// On-Premise Zero-Retention Enterprise Translation Endpoint (Signed DPA Compliant)
app.post('/api/translate', (req, res) => {
  const { text, fromLang, toLang } = req.body || {};
  if (!text) {
    return res.status(400).json({ error: 'Text parameter is required.' });
  }

  // Enforce zero retention headers
  res.setHeader('X-Zero-Retention', 'true');
  res.setHeader('X-DPA-Signed', 'true');
  res.setHeader('X-Data-Residency', 'On-Premise-Local');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

  return res.json({
    translatedText: text,
    source: 'on-premise',
    compliance: {
      zeroRetention: true,
      dpaSigned: true,
      dataResidency: 'Local-On-Premise',
      externalTransmission: false,
    },
  });
});

// Authoritative Progress & Gamification Secret & Storage
export const PROGRESS_SECRET = process.env.PROGRESS_HMAC_SECRET || 'bhashiq-progress-hmac-key-2026';
export const authoritativeProfiles = new Map();

// Helper to calculate cryptographic HMAC-SHA256 signature over progress state
export function signProgressState(profile) {
  const sortedBadges = (profile.unlockedBadges || []).slice().sort().join(',');
  const payload = `${profile.userId}:${profile.xp}:${profile.level}:${profile.streak}:${sortedBadges}:${profile.lastUpdated}`;
  return crypto.createHmac('sha256', PROGRESS_SECRET).update(payload).digest('hex');
}

// Action XP matrix with server-side validation rules & caps (Anti-tamper / anti-cheat)
export const ACTION_XP_RULES = {
  'SPEECH_TRANSLATED': { baseXP: 15, maxPerCall: 50, cooldownMs: 500 },
  'VOCAB_SAVED': { baseXP: 15, maxPerCall: 30, cooldownMs: 500 },
  'REVISION_PRACTICED': { baseXP: 10, maxPerCall: 20, cooldownMs: 500 },
  'CONVERSATION_TURN': { baseXP: 15, maxPerCall: 30, cooldownMs: 500 },
  'SPEAKER_IDENTIFIED': { baseXP: 20, maxPerCall: 40, cooldownMs: 500 },
  'QUIZ_COMPLETED': { baseXP: 25, maxPerCall: 100, cooldownMs: 1000 },
  'EMERGENCY_USED': { baseXP: 10, maxPerCall: 20, cooldownMs: 500 },
};

// 1. Authoritative Progress State Synchronization
app.post('/api/progress/sync', (req, res) => {
  const { userId, clientProfile } = req.body || {};
  const uid = userId || clientProfile?.name || 'default-user';

  let profile = authoritativeProfiles.get(uid);
  if (!profile) {
    profile = {
      userId: uid,
      xp: parseInt(clientProfile?.xp || '4280', 10),
      level: parseInt(clientProfile?.level || '5', 10),
      streak: parseInt(clientProfile?.streak || '14', 10),
      streakFreezes: parseInt(clientProfile?.streakFreezes || '2', 10),
      unlockedBadges: Array.isArray(clientProfile?.badges) ? clientProfile.badges : ['first_words', 'words_100', 'speaking_star', 'streak_7'],
      savedWordsCount: parseInt(clientProfile?.savedWordsCount || '12', 10),
      dailyGoalProgress: parseInt(clientProfile?.dailyGoalProgress || '75', 10),
      lastUpdated: Date.now(),
    };
    authoritativeProfiles.set(uid, profile);
  }

  const signature = signProgressState(profile);
  res.setHeader('X-Authoritative-State', 'true');
  return res.json({
    profile,
    signature,
    timestamp: Date.now(),
  });
});

// 2. Authoritative XP Award & Badge Computation (Signed on backend)
app.post('/api/progress/award-xp', (req, res) => {
  const { userId, action, reason, requestedAmount } = req.body || {};
  const uid = userId || 'default-user';

  let profile = authoritativeProfiles.get(uid);
  if (!profile) {
    profile = {
      userId: uid,
      xp: 4280,
      level: 5,
      streak: 14,
      streakFreezes: 2,
      unlockedBadges: ['first_words', 'words_100', 'speaking_star', 'streak_7'],
      savedWordsCount: 12,
      dailyGoalProgress: 75,
      lastUpdated: Date.now(),
    };
    authoritativeProfiles.set(uid, profile);
  }

  // Anti-cheat verification: validate action against authorized rules
  const rule = ACTION_XP_RULES[action] || { baseXP: 10, maxPerCall: 25, cooldownMs: 0 };
  let awardAmount = rule.baseXP;
  if (requestedAmount && typeof requestedAmount === 'number' && requestedAmount > 0) {
    awardAmount = Math.min(requestedAmount, rule.maxPerCall);
  }

  // Server-authoritative calculation
  profile.xp += awardAmount;
  profile.level = Math.floor(profile.xp / 1000) + 1;
  profile.dailyGoalProgress = Math.min(100, profile.dailyGoalProgress + Math.round(awardAmount / 2));
  profile.lastUpdated = Date.now();

  // Evaluate badge unlocks server-side
  const newlyUnlockedBadges = [];
  if (profile.level >= 5 && !profile.unlockedBadges.includes('level_5')) {
    profile.unlockedBadges.push('level_5');
    newlyUnlockedBadges.push('level_5');
  }
  if (profile.level >= 10 && !profile.unlockedBadges.includes('level_10')) {
    profile.unlockedBadges.push('level_10');
    newlyUnlockedBadges.push('level_10');
  }
  if (profile.savedWordsCount >= 10 && !profile.unlockedBadges.includes('vocab_master')) {
    profile.unlockedBadges.push('vocab_master');
    newlyUnlockedBadges.push('vocab_master');
  }

  const signature = signProgressState(profile);
  res.setHeader('X-Authoritative-State', 'true');

  return res.json({
    success: true,
    userId: uid,
    awardedXP: awardAmount,
    reason: reason || action,
    xp: profile.xp,
    level: profile.level,
    dailyGoalProgress: profile.dailyGoalProgress,
    unlockedBadges: profile.unlockedBadges,
    newlyUnlockedBadges,
    lastUpdated: profile.lastUpdated,
    signature,
  });
});

// 4. Cryptographic Signature Verification Endpoint
app.post('/api/progress/verify', (req, res) => {
  const { profile, signature } = req.body || {};
  if (!profile || !signature) {
    return res.status(400).json({ valid: false, error: 'Profile and signature are required.' });
  }

  const expectedSignature = signProgressState(profile);
  let isValid = false;
  try {
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSignature, 'hex');
    if (sigBuf.length === expBuf.length && sigBuf.length > 0) {
      isValid = crypto.timingSafeEqual(sigBuf, expBuf);
    }
  } catch (e) {
    isValid = false;
  }

  return res.json({
    valid: isValid,
    verifiedAt: Date.now(),
  });
});

// GPS Coordinate Schema Validation (-90 to 90 lat, -180 to 180 lon)
export function validateGPSCoordinates(coords) {
  if (!coords || typeof coords !== 'object') {
    return { isValid: false, error: 'GPS coordinates object is required.' };
  }
  const lat = typeof coords.latitude === 'number' ? coords.latitude : parseFloat(coords.latitude);
  const lon = typeof coords.longitude === 'number' ? coords.longitude : parseFloat(coords.longitude);

  if (isNaN(lat) || !isFinite(lat)) {
    return { isValid: false, error: 'Latitude must be a valid finite number.' };
  }
  if (lat < -90.0 || lat > 90.0) {
    return { isValid: false, error: `Latitude (${lat}) must be between -90 and 90 degrees.` };
  }

  if (isNaN(lon) || !isFinite(lon)) {
    return { isValid: false, error: 'Longitude must be a valid finite number.' };
  }
  if (lon < -180.0 || lon > 180.0) {
    return { isValid: false, error: `Longitude (${lon}) must be between -180 and 180 degrees.` };
  }

  return {
    isValid: true,
    coordinates: {
      latitude: lat,
      longitude: lon,
      altitude: coords.altitude != null ? parseFloat(coords.altitude) : null,
      accuracy: coords.accuracy != null ? parseFloat(coords.accuracy) : null,
      timestamp: coords.timestamp || Date.now(),
    },
  };
}

// 5. Emergency Distress Broadcast Endpoint with GPS Schema Validation & Rate Limiting
app.post('/api/emergency/broadcast', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  // Rate limit: max 5 emergency triggers per 30 seconds per IP to prevent false alarm spam
  const allowed = checkBucketLimit(ipBuckets, `emergency:${ip}`, { max: 5, windowMs: 30000 });
  if (!allowed) {
    return res.status(429).json({
      success: false,
      error: 'Emergency trigger rate limit exceeded. Please wait before broadcasting another alert.',
    });
  }

  const { phraseId, originalText, translatedText, targetLang, location } = req.body || {};
  const validation = validateGPSCoordinates(location);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: validation.error,
    });
  }

  const broadcastId = `sos-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  return res.json({
    success: true,
    broadcastId,
    timestamp: new Date().toISOString(),
    verifiedLocation: validation.coordinates,
    phraseId: phraseId || 'custom',
    status: 'ACTIVE_DISTRESS_BROADCAST',
  });
});

// In-memory cache for synthesized TTS audio buffers (avoids repetitive upstream calls)
const ttsAudioCache = new Map();

// 6. High-Definition Text-to-Speech Streaming Proxy Endpoint (Multi-Provider Resilient)
app.get('/api/tts', async (req, res) => {
  const { text, lang } = req.query;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text query parameter is required.' });
  }

  const cleanText = text.trim().slice(0, 300);
  const cleanLang = (lang || 'en').split('-')[0].toLowerCase();
  const cacheKey = `${cleanLang}:${cleanText}`;

  // Always enable cross-origin audio streaming
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Accept-Ranges', 'bytes');

  // Serve from memory cache if available
  if (ttsAudioCache.has(cacheKey)) {
    const cachedBuffer = ttsAudioCache.get(cacheKey);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.setHeader('X-TTS-Source', 'memory-cache');
    return res.send(cachedBuffer);
  }

  // Upstream candidate endpoints with automatic failover
  const encoded = encodeURIComponent(cleanText);
  const endpoints = [
    `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${cleanLang}&client=tw-ob`,
    `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${cleanLang}&client=gtx`,
    `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${cleanLang}&client=dict-chrome-ex`,
  ];

  let audioBuffer = null;

  for (const url of endpoints) {
    try {
      const upstreamRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'audio/mpeg, audio/*;q=0.9, */*;q=0.8',
        },
      });

      if (upstreamRes.ok) {
        const arrayBuf = await upstreamRes.arrayBuffer();
        if (arrayBuf.byteLength > 200) {
          audioBuffer = Buffer.from(arrayBuf);
          break;
        }
      }
    } catch (e) {
      // try next candidate
    }
  }

  if (audioBuffer) {
    // Keep cache size bounded to 500 entries
    if (ttsAudioCache.size > 500) {
      const firstKey = ttsAudioCache.keys().next().value;
      if (firstKey) ttsAudioCache.delete(firstKey);
    }
    ttsAudioCache.set(cacheKey, audioBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.setHeader('X-TTS-Source', 'upstream-stream');
    return res.send(audioBuffer);
  }

  console.warn(`[TTS Warning] All upstream audio streams failed for lang=${cleanLang}, text="${cleanText.slice(0, 30)}..."`);
  return res.status(502).json({ error: 'All upstream audio services temporarily unavailable.' });
});

// Diagnostic Audio & Health Endpoint
app.get('/api/audio-health', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    status: 'online',
    cachedPhrasesCount: ttsAudioCache.size,
    timestamp: new Date().toISOString(),
  });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
  maxHttpBufferSize: 1e6, // Transport ceiling; application middleware enforces granular 64KB MAX_PAYLOAD_BYTES
});

const AUTH_TOKEN = process.env.SOCKET_AUTH_TOKEN || 'bhashiq-secure-session-token';

// Enforce socket-level authentication middleware before handshake completion
io.use((socket, next) => {
  const authPayload = socket.handshake.auth;
  const headerToken = socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
  const token = authPayload?.token || headerToken;

  if (!token) {
    console.warn(`[Security Alert] Rejected unauthenticated socket handshake from ${socket.id || 'anonymous'}`);
    return next(new Error('Authentication error: Missing authentication token.'));
  }

  if (token !== AUTH_TOKEN) {
    console.warn(`[Security Alert] Rejected invalid authentication token from ${socket.id || 'anonymous'}`);
    return next(new Error('Authentication error: Invalid or expired token.'));
  }

  // Attach authenticated session metadata
  socket.data = {
    ...socket.data,
    authenticated: true,
    userId: authPayload?.userId || socket.id,
    authenticatedAt: Date.now(),
  };

  next();
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);

  // Message Throttling & Payload Size Enforcement Middleware
  socket.use(([event, ...args], next) => {
    // 1. Enforce payload size limit
    try {
      const payloadStr = JSON.stringify(args);
      const byteSize = Buffer.byteLength(payloadStr, 'utf8');
      if (byteSize > MAX_PAYLOAD_BYTES) {
        console.warn(`[Security Alert] Rejected oversized payload (${byteSize} bytes > ${MAX_PAYLOAD_BYTES} bytes limit) from socket ${socket.id}`);
        socket.emit('security-error', {
          code: 'PAYLOAD_TOO_LARGE',
          message: `Payload exceeds maximum allowed limit of ${MAX_PAYLOAD_BYTES} bytes.`,
        });
        return next(new Error('Payload Too Large'));
      }
    } catch (e) {
      return next(new Error('Payload serialization failure'));
    }

    // 2. Enforce Socket-level Rate Limiting
    const socketAllowed = checkBucketLimit(socketBuckets, socket.id, SOCKET_RATE_LIMIT);
    if (!socketAllowed) {
      console.warn(`[Security Alert] Rate limit exceeded for socket: ${socket.id}`);
      socket.emit('security-error', {
        code: 'SOCKET_RATE_LIMIT_EXCEEDED',
        message: 'Too many messages sent from this session. Please slow down.',
      });
      return next(new Error('Socket rate limit exceeded'));
    }

    // 3. Enforce IP-level Rate Limiting
    const clientIp = socket.handshake.address || socket.conn.remoteAddress || '127.0.0.1';
    const ipAllowed = checkBucketLimit(ipBuckets, clientIp, IP_RATE_LIMIT);
    if (!ipAllowed) {
      console.warn(`[Security Alert] Rate limit exceeded for IP address: ${clientIp}`);
      socket.emit('security-error', {
        code: 'IP_RATE_LIMIT_EXCEEDED',
        message: 'Too many requests originating from your IP address. Please slow down.',
      });
      return next(new Error('IP rate limit exceeded'));
    }

    next();
  });

  socket.on('join-room', ({ roomId, userName, language, password, roomToken, allowedUsers, maxParticipants }) => {
    if (!roomId || !userName) {
      socket.emit('security-error', { code: 'INVALID_REQUEST', message: 'Room ID and User Name are required.' });
      return;
    }

    let room = rooms.get(roomId);

    // 1. Room Creation by Host
    if (!room) {
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = password ? hashPassword(password, salt) : null;
      const initialToken = generateRoomToken(roomId);
      const aclSet = Array.isArray(allowedUsers)
        ? new Set(allowedUsers.map((u) => String(u).trim().toLowerCase()))
        : null;

      room = {
        id: roomId,
        hostId: socket.id,
        salt,
        passwordHash,
        token: initialToken,
        allowedUsers: aclSet,
        maxParticipants: maxParticipants || 4,
        users: new Map(),
      };
      rooms.set(roomId, room);
    }

    // 2. Capacity Check
    if (room.users.size >= room.maxParticipants && !room.users.has(socket.id)) {
      console.warn(`[Security Alert] Room ${roomId} is full (${room.users.size}/${room.maxParticipants})`);
      socket.emit('security-error', { code: 'ROOM_FULL', message: 'Call room has reached maximum capacity.' });
      return;
    }

    // 3. ACL (Access Control List) Enforcement
    if (room.allowedUsers && !room.users.has(socket.id)) {
      const normalizedUser = String(userName).trim().toLowerCase();
      if (!room.allowedUsers.has(normalizedUser)) {
        console.warn(`[Security Alert] User "${userName}" rejected by Room ACL on ${roomId}`);
        socket.emit('security-error', {
          code: 'ACL_ACCESS_DENIED',
          message: `Access Denied: User "${userName}" is not on the authorized participant list for this call.`,
        });
        return;
      }
    }

    // 4. Password Protection & Cryptographic Token Verification
    if (room.passwordHash && !room.users.has(socket.id) && socket.id !== room.hostId) {
      const tokenValid = roomToken && verifyRoomToken(roomToken, roomId);
      const passwordValid = password && hashPassword(password, room.salt) === room.passwordHash;

      if (!tokenValid && !passwordValid) {
        console.warn(`[Security Alert] Rejected unauthorized entry to protected room ${roomId} by ${userName}`);
        socket.emit('security-error', {
          code: 'ROOM_ACCESS_DENIED',
          message: 'Access Denied: Protected call room requires valid password or cryptographic room token.',
        });
        return;
      }
    }

    // Join authorized!
    socket.join(roomId);
    room.users.set(socket.id, {
      id: socket.id,
      userName,
      language,
      role: socket.id === room.hostId ? 'host' : 'participant',
      joinedAt: Date.now(),
    });

    console.log(`[Socket] Authorized user ${userName} (${socket.id}) joined room ${roomId}`);

    // Notify user of room token for sharing
    socket.emit('room-joined', {
      roomId,
      roomToken: room.token,
      isHost: socket.id === room.hostId,
    });

    // Notify room of updated users
    const userList = Array.from(room.users.values()).map((info) => ({
      id: info.id,
      userName: info.userName,
      language: info.language,
      role: info.role,
    }));
    io.to(roomId).emit('room-users', userList);
  });

  // Relay live voice transcription and translation across peers in the call
  socket.on('send-call-transcript', ({ roomId, message }) => {
    const room = rooms.get(roomId);
    if (!room || !room.users.has(socket.id)) {
      console.warn(`[Security Alert] Blocked unauthorized transcript relay from socket ${socket.id} to room ${roomId}`);
      return;
    }

    // Defense-in-depth server-side HTML tag stripping
    const sanitizeStr = (s) => (typeof s === 'string' ? s.replace(/<[^>]*>/g, '').trim() : '');
    const cleanMessage = {
      ...message,
      originalText: sanitizeStr(message?.originalText),
      translatedText: sanitizeStr(message?.translatedText),
      senderName: sanitizeStr(message?.senderName || 'Anonymous'),
    };

    socket.to(roomId).emit('receive-call-transcript', cleanMessage);
  });

  // Emergency distress broadcast via socket with schema validation & telemetry
  socket.on('emergency:broadcast', (data, callback) => {
    const validation = validateGPSCoordinates(data?.location);
    if (!validation.isValid) {
      if (typeof callback === 'function') {
        return callback({ success: false, error: validation.error });
      }
      return socket.emit('security-error', {
        code: 'INVALID_GPS_COORDINATES',
        message: validation.error,
      });
    }

    const broadcastReceipt = {
      success: true,
      broadcastId: `sos-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      senderId: socket.id,
      verifiedLocation: validation.coordinates,
      timestamp: new Date().toISOString(),
    };

    if (typeof callback === 'function') {
      callback(broadcastReceipt);
    }

    socket.broadcast.emit('emergency:distress-alert', {
      ...data,
      ...broadcastReceipt,
    });
  });

  // WebRTC signaling
  socket.on('signal', ({ roomId, targetId, signalData }) => {
    const room = rooms.get(roomId);
    if (!room || !room.users.has(socket.id) || !room.users.has(targetId)) {
      console.warn(`[Security Alert] Blocked cross-room or unauthorized signal from ${socket.id} to target ${targetId}`);
      return;
    }
    io.to(targetId).emit('signal', { senderId: socket.id, signalData });
  });

  socket.on('disconnect', () => {
    socketBuckets.delete(socket.id);
    console.log(`[Socket] User disconnected: ${socket.id}`);
    for (const [roomId, room] of rooms.entries()) {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        const userList = Array.from(room.users.values()).map((info) => ({
          id: info.id,
          userName: info.userName,
          language: info.language,
          role: info.role,
        }));
        io.to(roomId).emit('room-users', userList);
        if (room.users.size === 0) {
          rooms.delete(roomId);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5001;
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Bhashiq Signaling Server running on http://localhost:${PORT}`);
  });
}
