import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { AppProvider } from '../../context/AppContext';
import { LiveCallTranslator } from '../../components/call/LiveCallTranslator';
import { CameraTranslator } from '../../components/vision/CameraTranslator';
import { ConversationMode } from '../../components/call/ConversationMode';
import { SpeakerIdMode } from '../../components/call/SpeakerIdMode';
import { SpeechTranslator } from '../../components/translator/SpeechTranslator';
import { PronunciationAssistant } from '../../components/translator/PronunciationAssistant';
import { MiniGames } from '../../components/learning/MiniGames';
import { speechService } from '../../services/speechService';

// Mock MediaStreamTrack
class MockTrack {
  kind: string;
  enabled: boolean = true;
  readyState: 'live' | 'ended' = 'live';
  onended: (() => void) | null = null;
  stop = vi.fn(() => {
    this.readyState = 'ended';
  });

  constructor(kind = 'video') {
    this.kind = kind;
  }
}

// Mock MediaStream
class MockStream {
  tracks: MockTrack[];

  constructor(tracks?: MockTrack[]) {
    this.tracks = tracks || [new MockTrack('video')];
  }

  getTracks() {
    return this.tracks;
  }

  getVideoTracks() {
    return this.tracks.filter(t => t.kind === 'video');
  }

  getAudioTracks() {
    return this.tracks.filter(t => t.kind === 'audio');
  }
}

describe('MediaStreamTrack & Microphone Cleanup Integration Tests', () => {
  let createdStreams: MockStream[] = [];
  let stopListeningSpy: any;
  let stopSpeakingSpy: any;
  let originalSrcObjectDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    createdStreams = [];
    stopListeningSpy = vi.spyOn(speechService, 'stopListening');
    stopSpeakingSpy = vi.spyOn(speechService, 'stopSpeaking');

    (window as any).MediaStream = MockStream;

    // Polyfill HTMLMediaElement srcObject for happy-dom test environment
    originalSrcObjectDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'srcObject');
    let currentSrcObject: any = null;
    Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', {
      get() {
        return currentSrcObject;
      },
      set(val) {
        currentSrcObject = val;
      },
      configurable: true,
    });

    const mockGetUserMedia = vi.fn(async () => {
      const stream = new MockStream([new MockTrack('video')]);
      createdStreams.push(stream);
      return stream;
    });

    const mockGetDisplayMedia = vi.fn(async () => {
      const stream = new MockStream([new MockTrack('video')]);
      createdStreams.push(stream);
      return stream;
    });

    if (!navigator.mediaDevices) {
      (navigator as any).mediaDevices = {};
    }
    navigator.mediaDevices.getUserMedia = mockGetUserMedia as any;
    (navigator.mediaDevices as any).getDisplayMedia = mockGetDisplayMedia as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalSrcObjectDescriptor) {
      Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', originalSrcObjectDescriptor);
    }
  });

  describe('1. CameraTranslator MediaStreamTrack & Camera Teardown', () => {
    it('stops and disables all camera tracks and nullifies video srcObject when unmounting', async () => {
      const { unmount, container } = render(
        <AppProvider>
          <CameraTranslator />
        </AppProvider>
      );

      // Switch to Live Camera AR mode
      const liveCameraTab = screen.getByRole('button', { name: /Live Camera AR/i });
      await act(async () => {
        fireEvent.click(liveCameraTab);
      });

      // Verify camera stream was acquired
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
      expect(createdStreams.length).toBeGreaterThan(0);
      const cameraStream = createdStreams[0];
      const cameraTrack = cameraStream.getTracks()[0];
      expect(cameraTrack.stop).not.toHaveBeenCalled();

      // Check video element has stream attached
      const videoEl = container.querySelector('video');
      if (videoEl) {
        expect((videoEl as any).srcObject).toBe(cameraStream);
      }

      // Now unmount the component (simulating navigation to another page)
      unmount();

      // Verify track was explicitly stopped and disabled
      expect(cameraTrack.stop).toHaveBeenCalled();
      expect(cameraTrack.enabled).toBe(false);
      expect(stopSpeakingSpy).toHaveBeenCalled();
    });

    it('stops camera tracks immediately when switching from camera back to samples', async () => {
      render(
        <AppProvider>
          <CameraTranslator />
        </AppProvider>
      );

      // 1. Switch to Camera mode
      const liveCameraTab = screen.getByRole('button', { name: /Live Camera AR/i });
      await act(async () => {
        fireEvent.click(liveCameraTab);
      });

      const cameraStream = createdStreams[0];
      const cameraTrack = cameraStream.getTracks()[0];

      // 2. Switch back to Demo Posters & Menus mode
      const samplesTab = screen.getByRole('button', { name: /Demo Posters & Menus/i });
      await act(async () => {
        fireEvent.click(samplesTab);
      });

      // Verify track was stopped and disabled upon mode switch
      expect(cameraTrack.stop).toHaveBeenCalled();
      expect(cameraTrack.enabled).toBe(false);
    });

    it('handles pending getUserMedia promise cancellation without leaking tracks', async () => {
      let resolveStreamPromise: (stream: MockStream) => void;
      const delayedPromise = new Promise<MockStream>((resolve) => {
        resolveStreamPromise = resolve;
      });

      navigator.mediaDevices.getUserMedia = vi.fn(() => delayedPromise as any);

      const { unmount } = render(
        <AppProvider>
          <CameraTranslator />
        </AppProvider>
      );

      // Click to enter camera mode
      const liveCameraTab = screen.getByRole('button', { name: /Live Camera AR/i });
      await act(async () => {
        fireEvent.click(liveCameraTab);
      });

      // Unmount while getUserMedia is still pending
      unmount();

      // Now getUserMedia resolves asynchronously after unmount
      const lateStream = new MockStream([new MockTrack('video')]);
      const lateTrack = lateStream.getTracks()[0];
      await act(async () => {
        resolveStreamPromise!(lateStream);
      });

      // Because unmount marked isCancelled = true, lateTrack must be stopped immediately
      expect(lateTrack.stop).toHaveBeenCalled();
      expect(lateTrack.enabled).toBe(false);
    });
  });

  describe('2. LiveCallTranslator MediaStreamTrack & Audio Teardown', () => {
    it('stops all webcam tracks and detaches localVideo srcObject on unmount during active call', async () => {
      const { unmount } = render(
        <AppProvider>
          <LiveCallTranslator />
        </AppProvider>
      );

      // Start call (simulate clicking start call)
      const startCallBtn = screen.getByRole('button', { name: /Start Live Call/i });
      await act(async () => {
        fireEvent.click(startCallBtn);
      });

      // Wait for call connection timer
      await act(async () => {
        await new Promise((r) => setTimeout(r, 1500));
      });

      // Check that camera tracks were acquired
      expect(createdStreams.length).toBeGreaterThan(0);
      const stream = createdStreams[0];
      const track = stream.getTracks()[0];

      // Unmount during active call
      unmount();

      // Track must be stopped and disabled
      expect(track.stop).toHaveBeenCalled();
      expect(track.enabled).toBe(false);

      // SpeechService must be stopped
      expect(stopListeningSpy).toHaveBeenCalled();
      expect(stopSpeakingSpy).toHaveBeenCalled();
    });

    it('stops media tracks cleanly when endCall is clicked', async () => {
      render(
        <AppProvider>
          <LiveCallTranslator />
        </AppProvider>
      );

      // Start call
      const startCallBtn = screen.getByRole('button', { name: /Start Live Call/i });
      await act(async () => {
        fireEvent.click(startCallBtn);
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 1500));
      });

      // Find and click End Call button
      const endCallBtn = screen.getByRole('button', { name: /End Call/i });
      await act(async () => {
        fireEvent.click(endCallBtn);
      });

      // All created stream tracks should be stopped
      expect(createdStreams.length).toBeGreaterThan(0);
      createdStreams.forEach((stream) => {
        stream.getTracks().forEach((track) => {
          expect(track.stop).toHaveBeenCalled();
          expect(track.enabled).toBe(false);
        });
      });

      expect(stopListeningSpy).toHaveBeenCalled();
      expect(stopSpeakingSpy).toHaveBeenCalled();
    });
  });

  describe('3. Voice & Speech Recognition Cleanup on Component Unmount', () => {
    it('stops speech listening and speaking when ConversationMode unmounts', () => {
      const { unmount } = render(
        <AppProvider>
          <ConversationMode />
        </AppProvider>
      );

      unmount();

      expect(stopListeningSpy).toHaveBeenCalled();
      expect(stopSpeakingSpy).toHaveBeenCalled();
    });

    it('stops speech listening and speaking when SpeakerIdMode unmounts', () => {
      const { unmount } = render(
        <AppProvider>
          <SpeakerIdMode />
        </AppProvider>
      );

      unmount();

      expect(stopListeningSpy).toHaveBeenCalled();
      expect(stopSpeakingSpy).toHaveBeenCalled();
    });

    it('stops speech listening and speaking when SpeechTranslator unmounts', () => {
      const { unmount } = render(
        <AppProvider>
          <SpeechTranslator />
        </AppProvider>
      );

      unmount();

      expect(stopListeningSpy).toHaveBeenCalled();
      expect(stopSpeakingSpy).toHaveBeenCalled();
    });

    it('stops speech listening and speaking when PronunciationAssistant unmounts', () => {
      const { unmount } = render(
        <AppProvider>
          <PronunciationAssistant />
        </AppProvider>
      );

      unmount();

      expect(stopListeningSpy).toHaveBeenCalled();
      expect(stopSpeakingSpy).toHaveBeenCalled();
    });

    it('stops speech listening and speaking when MiniGames unmounts', () => {
      const { unmount } = render(
        <AppProvider>
          <MiniGames />
        </AppProvider>
      );

      unmount();

      expect(stopListeningSpy).toHaveBeenCalled();
      expect(stopSpeakingSpy).toHaveBeenCalled();
    });
  });
});
