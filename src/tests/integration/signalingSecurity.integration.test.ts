import { describe, it, expect } from 'vitest';
import { io as Client } from 'socket.io-client';

describe('Security Test: Strict CORS & Socket-Level Authentication Enforcement', () => {
  const SERVER_URL = 'http://localhost:5001';
  const VALID_TOKEN = 'bhashiq-secure-session-token';

  describe('CORS Origin Whitelisting', () => {
    it('allows connection from authorized application origin (http://localhost:5173) with valid auth token', async () => {
      const authorizedClient = Client(SERVER_URL, {
        extraHeaders: {
          Origin: 'http://localhost:5173'
        },
        auth: {
          token: VALID_TOKEN
        },
        timeout: 3000,
        reconnection: false
      });

      await new Promise<void>((resolve, reject) => {
        authorizedClient.on('connect', () => {
          resolve();
        });
        authorizedClient.on('connect_error', (err) => {
          reject(err);
        });
      });

      expect(authorizedClient.connected).toBe(true);
      authorizedClient.disconnect();
    });

    it('blocks connection attempts from unauthorized / untrusted origins', async () => {
      const untrustedOrigin = 'http://malicious-external-site.com';
      const unauthorizedClient = Client(SERVER_URL, {
        extraHeaders: {
          Origin: untrustedOrigin
        },
        auth: {
          token: VALID_TOKEN
        },
        timeout: 3000,
        reconnection: false
      });

      const connectionError = await new Promise<any>((resolve) => {
        unauthorizedClient.on('connect', () => {
          unauthorizedClient.disconnect();
          resolve(null);
        });
        unauthorizedClient.on('connect_error', (err) => {
          resolve(err);
        });
      });

      expect(connectionError).not.toBeNull();
      expect(unauthorizedClient.connected).toBe(false);
    });
  });

  describe('Socket Handshake Authentication Middleware', () => {
    it('rejects handshake before connection when authentication token is completely missing', async () => {
      const unauthenticatedClient = Client(SERVER_URL, {
        timeout: 3000,
        reconnection: false,
        // No auth token provided
      });

      const err: any = await new Promise((resolve) => {
        unauthenticatedClient.on('connect', () => {
          unauthenticatedClient.disconnect();
          resolve(null);
        });
        unauthenticatedClient.on('connect_error', (error) => {
          resolve(error);
        });
      });

      expect(err).not.toBeNull();
      expect(err.message).toContain('Missing authentication token');
      expect(unauthenticatedClient.connected).toBe(false);
    });

    it('rejects handshake when invalid or forged token is provided', async () => {
      const forgedClient = Client(SERVER_URL, {
        timeout: 3000,
        reconnection: false,
        auth: {
          token: 'attacker-forged-fake-token-12345'
        }
      });

      const err: any = await new Promise((resolve) => {
        forgedClient.on('connect', () => {
          forgedClient.disconnect();
          resolve(null);
        });
        forgedClient.on('connect_error', (error) => {
          resolve(error);
        });
      });

      expect(err).not.toBeNull();
      expect(err.message).toContain('Invalid or expired token');
      expect(forgedClient.connected).toBe(false);
    });

    it('successfully completes handshake and authenticates socket when valid token is supplied', async () => {
      const validClient = Client(SERVER_URL, {
        timeout: 3000,
        reconnection: false,
        auth: {
          token: VALID_TOKEN
        }
      });

      await new Promise<void>((resolve, reject) => {
        validClient.on('connect', () => resolve());
        validClient.on('connect_error', (err) => reject(err));
      });

      expect(validClient.connected).toBe(true);
      validClient.disconnect();
    });
  });

  describe('Payload Size & Rate Throttling Middleware', () => {
    it('blocks and rejects oversized message payloads exceeding 64KB limit', async () => {
      const client = Client(SERVER_URL, {
        timeout: 3000,
        reconnection: false,
        auth: { token: VALID_TOKEN }
      });

      await new Promise<void>((resolve) => {
        client.on('connect', () => resolve());
      });

      const oversizedString = 'A'.repeat(70 * 1024); // 70 KB > 64 KB limit

      const securityErrorPromise = new Promise<any>((resolve) => {
        client.on('security-error', (data) => resolve(data));
      });

      client.emit('send-call-transcript', {
        roomId: 'test-room',
        message: { oversizedData: oversizedString }
      });

      const secError = await securityErrorPromise;
      expect(secError).toBeDefined();
      expect(secError.code).toBe('PAYLOAD_TOO_LARGE');
      expect(secError.message).toContain('limit');

      client.disconnect();
    });

    it('enforces message throttling per socket session when rate limit is exceeded', async () => {
      const client = Client(SERVER_URL, {
        timeout: 3000,
        reconnection: false,
        auth: { token: VALID_TOKEN }
      });

      await new Promise<void>((resolve) => {
        client.on('connect', () => resolve());
      });

      let rateLimitError: any = null;
      client.on('security-error', (data) => {
        if (data.code === 'SOCKET_RATE_LIMIT_EXCEEDED' || data.code === 'IP_RATE_LIMIT_EXCEEDED') {
          rateLimitError = data;
        }
      });

      // Send 65 rapid burst messages to trigger the 60 msg/window limit
      for (let i = 0; i < 65; i++) {
        client.emit('send-call-transcript', {
          roomId: 'spam-room',
          message: { id: `msg-${i}`, text: 'flood' }
        });
      }

      await new Promise((r) => setTimeout(r, 200));

      expect(rateLimitError).not.toBeNull();
      expect(['SOCKET_RATE_LIMIT_EXCEEDED', 'IP_RATE_LIMIT_EXCEEDED']).toContain(rateLimitError.code);
      expect(rateLimitError.message).toContain('slow down');

      client.disconnect();
    });
  });

  describe('Cryptographic Room Tokens, Password Protection & ACL Enforcement', () => {
    it('protects call room with password and rejects unauthorized entry without password or cryptographic token', async () => {
      const roomId = 'secure-call-' + Date.now();
      const password = 'HostSecretPassword123';

      // 1. Host creates password-protected room
      const host = Client(SERVER_URL, { timeout: 3000, reconnection: false, auth: { token: VALID_TOKEN } });
      await new Promise<void>((r) => host.on('connect', () => r()));

      const hostJoinedPromise = new Promise<any>((r) => host.on('room-joined', (data) => r(data)));
      host.emit('join-room', { roomId, userName: 'HostAlice', language: 'en', password });
      const hostData = await hostJoinedPromise;

      expect(hostData.roomId).toBe(roomId);
      expect(hostData.isHost).toBe(true);
      expect(hostData.roomToken).toBeDefined();

      const cryptographicToken = hostData.roomToken;

      // 2. Intruder tries to join without password or token
      const intruder = Client(SERVER_URL, { timeout: 3000, reconnection: false, auth: { token: VALID_TOKEN } });
      await new Promise<void>((r) => intruder.on('connect', () => r()));

      const intruderErrorPromise = new Promise<any>((r) => intruder.on('security-error', (err) => r(err)));
      intruder.emit('join-room', { roomId, userName: 'Intruder', language: 'en' });
      const intruderErr = await intruderErrorPromise;

      expect(intruderErr.code).toBe('ROOM_ACCESS_DENIED');
      expect(intruderErr.message).toContain('password or cryptographic room token');

      // 3. User with wrong password
      const wrongPassErrorPromise = new Promise<any>((r) => intruder.on('security-error', (err) => r(err)));
      intruder.emit('join-room', { roomId, userName: 'Intruder', language: 'en', password: 'WrongPassword' });
      const wrongPassErr = await wrongPassErrorPromise;
      expect(wrongPassErr.code).toBe('ROOM_ACCESS_DENIED');

      intruder.disconnect();

      // 4. Authorized peer joins using correct password
      const peerWithPass = Client(SERVER_URL, { timeout: 3000, reconnection: false, auth: { token: VALID_TOKEN } });
      await new Promise<void>((r) => peerWithPass.on('connect', () => r()));

      const peerPassJoined = new Promise<any>((r) => peerWithPass.on('room-joined', (data) => r(data)));
      peerWithPass.emit('join-room', { roomId, userName: 'BobWithPass', language: 'hi', password });
      const passData = await peerPassJoined;
      expect(passData.roomId).toBe(roomId);

      peerWithPass.disconnect();

      // 5. Authorized peer joins using Cryptographic Room Token (e.g. shared via invite link)
      const peerWithToken = Client(SERVER_URL, { timeout: 3000, reconnection: false, auth: { token: VALID_TOKEN } });
      await new Promise<void>((r) => peerWithToken.on('connect', () => r()));

      const peerTokenJoined = new Promise<any>((r) => peerWithToken.on('room-joined', (data) => r(data)));
      peerWithToken.emit('join-room', { roomId, userName: 'CharlieWithToken', language: 'ja', roomToken: cryptographicToken });
      const tokenData = await peerTokenJoined;
      expect(tokenData.roomId).toBe(roomId);

      peerWithToken.disconnect();
      host.disconnect();
    });

    it('enforces Room Access Control List (ACL) to block unauthorized callers', async () => {
      const roomId = 'acl-room-' + Date.now();

      // Host specifies explicit whitelist of callers
      const host = Client(SERVER_URL, { timeout: 3000, reconnection: false, auth: { token: VALID_TOKEN } });
      await new Promise<void>((r) => host.on('connect', () => r()));

      const hostJoined = new Promise<any>((r) => host.on('room-joined', (data) => r(data)));
      host.emit('join-room', { 
        roomId, 
        userName: 'Professor', 
        language: 'en',
        allowedUsers: ['Professor', 'StudentRahul', 'StudentPriya']
      });
      await hostJoined;

      // Unauthorized participant tries to join
      const unauthorizedPeer = Client(SERVER_URL, { timeout: 3000, reconnection: false, auth: { token: VALID_TOKEN } });
      await new Promise<void>((r) => unauthorizedPeer.on('connect', () => r()));

      const aclErrorPromise = new Promise<any>((r) => unauthorizedPeer.on('security-error', (err) => r(err)));
      unauthorizedPeer.emit('join-room', { roomId, userName: 'UnknownIntruder', language: 'hi' });
      const aclError = await aclErrorPromise;

      expect(aclError.code).toBe('ACL_ACCESS_DENIED');
      expect(aclError.message).toContain('authorized participant list');
      unauthorizedPeer.disconnect();

      // Authorized participant joins
      const authorizedPeer = Client(SERVER_URL, { timeout: 3000, reconnection: false, auth: { token: VALID_TOKEN } });
      await new Promise<void>((r) => authorizedPeer.on('connect', () => r()));

      const authPeerJoined = new Promise<any>((r) => authorizedPeer.on('room-joined', (data) => r(data)));
      authorizedPeer.emit('join-room', { roomId, userName: 'StudentRahul', language: 'mr' });
      const authData = await authPeerJoined;

      expect(authData.roomId).toBe(roomId);

      authorizedPeer.disconnect();
      host.disconnect();
    });

    it('enforces room participant capacity limits (ROOM_FULL)', async () => {
      const roomId = 'capacity-room-' + Date.now();

      // Host sets capacity to 2 (1-on-1 call)
      const host = Client(SERVER_URL, { timeout: 3000, reconnection: false, auth: { token: VALID_TOKEN } });
      await new Promise<void>((r) => host.on('connect', () => r()));
      host.emit('join-room', { roomId, userName: 'User1', language: 'en', maxParticipants: 2 });

      // Participant 2 joins
      const user2 = Client(SERVER_URL, { timeout: 3000, reconnection: false, auth: { token: VALID_TOKEN } });
      await new Promise<void>((r) => user2.on('connect', () => r()));
      const user2Joined = new Promise<any>((r) => user2.on('room-joined', (d) => r(d)));
      user2.emit('join-room', { roomId, userName: 'User2', language: 'hi' });
      await user2Joined;

      // Participant 3 tries to join room with max 2 participants
      const user3 = Client(SERVER_URL, { timeout: 3000, reconnection: false, auth: { token: VALID_TOKEN } });
      await new Promise<void>((r) => user3.on('connect', () => r()));

      const capacityErrPromise = new Promise<any>((r) => user3.on('security-error', (err) => r(err)));
      user3.emit('join-room', { roomId, userName: 'User3', language: 'es' });
      const capacityErr = await capacityErrPromise;

      expect(capacityErr.code).toBe('ROOM_FULL');

      user3.disconnect();
      user2.disconnect();
      host.disconnect();
    });
  });
});
