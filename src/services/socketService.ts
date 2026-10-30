import { io, Socket } from 'socket.io-client';
import { CallMessage } from '../types';
import { privacyTokenizationService } from './privacyTokenizationService';
import { sanitizationService } from './sanitizationService';

const DEFAULT_AUTH_TOKEN = 'bhashiq-secure-session-token';

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;

  public init(serverUrl: string = 'http://localhost:5001', token: string = DEFAULT_AUTH_TOKEN): Socket | null {
    try {
      this.socket = io(serverUrl, {
        autoConnect: false,
        reconnectionAttempts: 3,
        timeout: 3000,
        auth: {
          token,
        },
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('[SocketClient] Connected to signaling server');
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        console.log('[SocketClient] Disconnected');
      });

      this.socket.connect();
      return this.socket;
    } catch (e) {
      console.warn('[SocketClient] Could not connect to real-time server:', e);
      return null;
    }
  }

  public joinRoom(
    roomId: string, 
    userName: string, 
    language: string,
    securityOptions?: {
      password?: string;
      roomToken?: string;
      allowedUsers?: string[];
      maxParticipants?: number;
    }
  ) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join-room', { 
        roomId, 
        userName, 
        language,
        password: securityOptions?.password,
        roomToken: securityOptions?.roomToken,
        allowedUsers: securityOptions?.allowedUsers,
        maxParticipants: securityOptions?.maxParticipants,
      });
    }
  }

  public onRoomJoined(callback: (data: { roomId: string; roomToken: string; isHost: boolean }) => void) {
    if (this.socket) {
      this.socket.on('room-joined', callback);
    }
  }

  public onSecurityError(callback: (err: { code: string; message: string }) => void) {
    if (this.socket) {
      this.socket.on('security-error', callback);
    }
  }

  public sendTranscript(roomId: string, message: CallMessage) {
    if (this.socket && this.socket.connected) {
      // Client-side NER/regex tokenization & redaction prior to external socket transmission
      const origRedaction = privacyTokenizationService.redactSensitiveEntities(message.originalText, { mode: 'mask' });
      const transRedaction = privacyTokenizationService.redactSensitiveEntities(message.translatedText, { mode: 'mask' });

      const sanitizedMessage: CallMessage = sanitizationService.sanitizeCallMessage({
        ...message,
        originalText: origRedaction.redactedText,
        translatedText: transRedaction.redactedText,
        redacted: message.redacted || origRedaction.hasSensitiveData || transRedaction.hasSensitiveData,
        detectedEntities: Array.from(new Set([
          ...(message.detectedEntities || []),
          ...origRedaction.detectedEntities.map(e => e.type),
          ...transRedaction.detectedEntities.map(e => e.type),
        ])),
      });

      this.socket.emit('send-call-transcript', { roomId, message: sanitizedMessage });
    }
  }

  public onReceiveTranscript(callback: (message: CallMessage) => void) {
    if (this.socket) {
      this.socket.on('receive-call-transcript', (rawMsg: CallMessage) => {
        // Enforce strict client-side DOMPurify sanitization and HTML entity safety before UI injection
        const sanitized = sanitizationService.sanitizeCallMessage(rawMsg);
        callback(sanitized);
      });
    }
  }

  public onRoomUsers(callback: (users: { id: string; userName: string; language: string }[]) => void) {
    if (this.socket) {
      this.socket.on('room-users', (rawUsers) => {
        // Enforce strict client-side sanitization of peer usernames and IDs
        const sanitizedUsers = (rawUsers || []).map((u: any) => sanitizationService.sanitizePeerUser(u));
        callback(sanitizedUsers);
      });
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
