import { describe, it, expect, afterAll } from 'vitest';
import { io as Client, Socket } from 'socket.io-client';

describe('Integration Test: Real-Time WebRTC Signaling Server', () => {
  const SERVER_URL = 'http://localhost:5001';
  let client1: Socket;
  let client2: Socket;

  afterAll(() => {
    if (client1?.connected) client1.disconnect();
    if (client2?.connected) client2.disconnect();
  });

  it('connects two peers, handles room negotiation, and relays live call transcript', async () => {
    const roomId = 'bhashiq-test-room-' + Date.now();

    // 1. Connect Client 1 (English Speaker)
    client1 = Client(SERVER_URL, { 
      timeout: 3000, 
      reconnection: false,
      auth: { token: 'bhashiq-secure-session-token' }
    });
    await new Promise<void>((resolve, reject) => {
      client1.on('connect', () => resolve());
      client1.on('connect_error', (err) => reject(err));
    });
    expect(client1.connected).toBe(true);

    // 2. Connect Client 2 (Hindi Speaker)
    client2 = Client(SERVER_URL, { 
      timeout: 3000, 
      reconnection: false,
      auth: { token: 'bhashiq-secure-session-token' }
    });
    await new Promise<void>((resolve, reject) => {
      client2.on('connect', () => resolve());
      client2.on('connect_error', (err) => reject(err));
    });
    expect(client2.connected).toBe(true);

    // 3. Client 1 Joins Room
    const client1RoomPromise = new Promise<any[]>((resolve) => {
      client1.on('room-users', (users) => {
        if (users.length === 1) resolve(users);
      });
    });
    client1.emit('join-room', { roomId, userName: 'Alice', language: 'en' });
    const usersStep1 = await client1RoomPromise;
    expect(usersStep1).toHaveLength(1);
    expect(usersStep1[0].userName).toBe('Alice');

    // 4. Client 2 Joins Same Room -> Both should be informed
    const client2RoomPromise = new Promise<any[]>((resolve) => {
      client2.on('room-users', (users) => {
        if (users.length === 2) resolve(users);
      });
    });
    client2.emit('join-room', { roomId, userName: 'Rajesh', language: 'hi' });
    const usersStep2 = await client2RoomPromise;
    expect(usersStep2).toHaveLength(2);

    // 5. Client 2 sends live translated transcript message
    const transcriptPayload = {
      id: 'tx-101',
      sender: 'peer' as const,
      senderName: 'Rajesh',
      originalText: 'आप कैसे हैं?',
      translatedText: 'How are you?',
      fromLang: 'hi' as const,
      toLang: 'en' as const,
      timestamp: '11:45 AM'
    };

    const transcriptReceivePromise = new Promise<any>((resolve) => {
      client1.on('receive-call-transcript', (msg) => {
        resolve(msg);
      });
    });

    client2.emit('send-call-transcript', { roomId, message: transcriptPayload });
    const receivedMsg = await transcriptReceivePromise;

    expect(receivedMsg.id).toBe('tx-101');
    expect(receivedMsg.originalText).toBe('आप कैसे हैं?');
    expect(receivedMsg.translatedText).toBe('How are you?');
    expect(receivedMsg.senderName).toBe('Rajesh');

    // 6. WebRTC Signaling relay test
    const signalDataPayload = { type: 'offer', sdp: 'v=0...' };
    const signalReceivePromise = new Promise<any>((resolve) => {
      client1.on('signal', (data) => resolve(data));
    });

    client2.emit('signal', { roomId, targetId: client1.id, signalData: signalDataPayload });
    const receivedSignal = await signalReceivePromise;
    expect(receivedSignal.senderId).toBe(client2.id);
    expect(receivedSignal.signalData.type).toBe('offer');
  });
});
