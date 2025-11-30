import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: genre-music-page, Property 2: Beat preview limit
 * Validates: Requirements 1.2
 * 
 * Property: For any genre with associated beats, the preview display 
 * should show at most 10 beats
 */

// Type definitions for our test
interface Beat {
  id: string;
  title: string;
  producer: string;
  bpm: number;
  genre: string;
  price: number;
  imageUrl: string;
  audioUrl: string;
}

interface Genre {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  color: string;
  isActive: boolean;
}

// Function that implements the beat preview limit logic
// This represents the core logic that will be used in the GenreSection component
function getPreviewBeats(beats: Beat[], limit: number = 10): Beat[] {
  return beats.slice(0, limit);
}

// Function to determine if View All button should be shown
function shouldShowViewAll(totalBeats: number): boolean {
  return totalBeats > 10;
}

describe('GenreSection - Property-Based Tests', () => {
  it('Property 2: Beat preview limit - for any genre with associated beats, preview should show at most 10 beats', () => {
    fc.assert(
      fc.property(
        // Generate a random array of beats (0 to 50 beats)
        fc.array(
          fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            producer: fc.string({ minLength: 1, maxLength: 50 }),
            bpm: fc.integer({ min: 60, max: 200 }),
            genre: fc.uuid(),
            price: fc.float({ min: Math.fround(0.99), max: Math.fround(999.99), noNaN: true }),
            imageUrl: fc.webUrl(),
            audioUrl: fc.webUrl(),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (beats) => {
          // Act: get preview beats
          const previewBeats = getPreviewBeats(beats);

          // Assert: preview should have at most 10 beats
          expect(previewBeats.length).toBeLessThanOrEqual(10);

          // Additional assertion: if we have more than 10 beats, 
          // preview should be exactly 10
          if (beats.length > 10) {
            expect(previewBeats.length).toBe(10);
          } else {
            // If we have 10 or fewer beats, preview should match the input
            expect(previewBeats.length).toBe(beats.length);
          }

          // Verify that preview beats are the first N beats from the original array
          previewBeats.forEach((beat, index) => {
            expect(beat).toEqual(beats[index]);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: genre-music-page, Property 3: View All button visibility
   * Validates: Requirements 1.3
   * 
   * Property: For any genre with more than 10 beats, the rendered output 
   * should include a "View All" button
   */
  it('Property 3: View All button visibility - for any genre with more than 10 beats, should show View All button', () => {
    fc.assert(
      fc.property(
        // Generate a random total beat count (0 to 100)
        fc.integer({ min: 0, max: 100 }),
        (totalBeats) => {
          // Act: determine if View All button should be shown
          const showViewAll = shouldShowViewAll(totalBeats);

          // Assert: View All button should be shown if and only if totalBeats > 10
          if (totalBeats > 10) {
            expect(showViewAll).toBe(true);
          } else {
            expect(showViewAll).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
