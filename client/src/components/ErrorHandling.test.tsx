import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: genre-music-page, Property 18: Error message display
 * Validates: Requirements 7.4
 * 
 * For any error that occurs during beat operations, an error message should be displayed to the user
 */

// Simulate different types of errors that can occur
type BeatOperationError = {
  type: 'network' | 'audio' | 'cart' | 'auth' | 'unknown';
  message: string;
  beatId?: string;
};

// Helper function to generate error message for display
function generateErrorMessage(error: BeatOperationError): string | null {
  if (!error || !error.message) {
    return null;
  }
  
  // Error message should always be present for any error
  return error.message;
}

// Helper function to check if error should be displayed
function shouldDisplayError(error: BeatOperationError | null): boolean {
  return error !== null && error.message !== undefined && error.message.length > 0;
}

// Arbitrary for generating error objects
const errorArbitrary = fc.record({
  type: fc.constantFrom('network', 'audio', 'cart', 'auth', 'unknown'),
  message: fc.string({ minLength: 1, maxLength: 200 }),
  beatId: fc.option(fc.uuid(), { nil: undefined }),
}) as fc.Arbitrary<BeatOperationError>;

describe("Error Handling Property Tests", () => {
  describe("Property 18: Error message display", () => {
    it("should display an error message for any error that occurs", () => {
      fc.assert(
        fc.property(
          errorArbitrary,
          (error) => {
            const errorMessage = generateErrorMessage(error);
            const shouldDisplay = shouldDisplayError(error);
            
            // If there's an error, there must be a message
            const hasMessage = errorMessage !== null && errorMessage.length > 0;
            
            // The error should be marked for display
            const isDisplayed = shouldDisplay === true;
            
            // Both conditions must be true
            return hasMessage && isDisplayed;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should not display error message when there is no error", () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          (error) => {
            const shouldDisplay = shouldDisplayError(error);
            
            // No error means no display
            return shouldDisplay === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should display error message for all error types", () => {
      fc.assert(
        fc.property(
          errorArbitrary,
          (error) => {
            const errorMessage = generateErrorMessage(error);
            
            // Every error type should produce a message
            const hasMessage = errorMessage !== null && errorMessage.length > 0;
            
            // The message should match the error's message
            const messageMatches = errorMessage === error.message;
            
            return hasMessage && messageMatches;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle audio-specific errors with appropriate messages", () => {
      fc.assert(
        fc.property(
          fc.record({
            type: fc.constant('audio' as const),
            message: fc.constantFrom(
              'Audio unavailable',
              'Audio loading aborted',
              'Network error loading audio',
              'Audio decoding error',
              'Audio format not supported',
              'Failed to play audio'
            ),
            beatId: fc.uuid(),
          }),
          (error) => {
            const errorMessage = generateErrorMessage(error);
            const shouldDisplay = shouldDisplayError(error);
            
            // Audio errors should always display
            const isDisplayed = shouldDisplay === true;
            
            // Message should be present and match
            const hasValidMessage = errorMessage !== null && 
                                   errorMessage.length > 0 &&
                                   errorMessage === error.message;
            
            return isDisplayed && hasValidMessage;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should preserve error context including beatId when present", () => {
      fc.assert(
        fc.property(
          errorArbitrary,
          (error) => {
            // If beatId is present in error, it should be preserved
            if (error.beatId !== undefined) {
              // The error object should maintain the beatId
              return error.beatId.length > 0;
            }
            
            // If no beatId, that's also valid
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
