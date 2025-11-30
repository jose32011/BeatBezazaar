import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioPlayer } from './useAudioPlayer';
import * as fc from 'fast-check';

/**
 * Feature: genre-music-page, Property 8: Audio playback initiation
 * Validates: Requirements 3.1
 * 
 * Property: For any beat with valid audio URL, triggering the play action 
 * should result in audio playback starting
 */

describe('useAudioPlayer - Property-Based Tests', () => {
  // Mock HTMLAudioElement
  let mockAudio: any;
  let playMock: any;
  let pauseMock: any;

  beforeEach(() => {
    playMock = vi.fn().mockResolvedValue(undefined);
    pauseMock = vi.fn();

    mockAudio = {
      play: playMock,
      pause: pauseMock,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      src: '',
      currentTime: 0,
    };

    // Mock Audio constructor - must be a proper constructor function
    global.Audio = function() {
      return mockAudio;
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Property 8: Audio playback initiation - for any beat with valid audio URL, play should initiate playback', () => {
    fc.assert(
      fc.property(
        // Generate random beat IDs and audio URLs
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.webUrl(),
        (beatId, audioUrl) => {
          // Reset mocks for each iteration
          playMock.mockClear();
          pauseMock.mockClear();
          mockAudio.src = '';

          const { result } = renderHook(() => useAudioPlayer());

          // Act: trigger play action
          act(() => {
            result.current.play(beatId, audioUrl);
          });

          // Assert: audio playback should be initiated
          expect(playMock).toHaveBeenCalled();
          expect(mockAudio.src).toBe(audioUrl);
          expect(result.current.currentlyPlaying).toBe(beatId);
          expect(result.current.isPlaying(beatId)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 9: Audio pause functionality - for any currently playing beat, pause should stop playback', () => {
    fc.assert(
      fc.property(
        // Generate random beat IDs and audio URLs
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.webUrl(),
        (beatId, audioUrl) => {
          // Reset mocks for each iteration
          playMock.mockClear();
          pauseMock.mockClear();

          const { result } = renderHook(() => useAudioPlayer());

          // Arrange: start playing a beat
          act(() => {
            result.current.play(beatId, audioUrl);
          });

          expect(result.current.isPlaying(beatId)).toBe(true);

          // Act: trigger pause action
          act(() => {
            result.current.pause();
          });

          // Assert: audio playback should be stopped
          expect(pauseMock).toHaveBeenCalled();
          expect(result.current.currentlyPlaying).toBe(null);
          expect(result.current.isPlaying(beatId)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Single audio instance - when playing a new beat, the previous beat should stop', () => {
    fc.assert(
      fc.property(
        // Generate two different beat IDs and URLs
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.webUrl(),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.webUrl(),
        (beatId1, audioUrl1, beatId2, audioUrl2) => {
          // Ensure beat IDs are different
          fc.pre(beatId1 !== beatId2);

          // Reset mocks for each iteration
          playMock.mockClear();
          pauseMock.mockClear();
          mockAudio.currentTime = 0;

          const { result } = renderHook(() => useAudioPlayer());

          // Arrange: start playing first beat
          act(() => {
            result.current.play(beatId1, audioUrl1);
          });

          expect(result.current.isPlaying(beatId1)).toBe(true);

          // Act: play second beat
          act(() => {
            result.current.play(beatId2, audioUrl2);
          });

          // Assert: first beat should be stopped, second should be playing
          expect(pauseMock).toHaveBeenCalled();
          expect(mockAudio.currentTime).toBe(0); // Reset to beginning
          expect(result.current.isPlaying(beatId1)).toBe(false);
          expect(result.current.isPlaying(beatId2)).toBe(true);
          expect(result.current.currentlyPlaying).toBe(beatId2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
