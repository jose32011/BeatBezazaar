import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import * as fc from "fast-check";
import BeatCard from "./BeatCard";
import type { Beat } from "@shared/schema";

/**
 * Feature: genre-music-page, Property 15: Cart state display
 * Validates: Requirements 5.3
 * 
 * For any beat already in the cart, the button text should display "In Cart" instead of "Add to Cart"
 */

// Mock wouter
vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
}));

// Mock fetch for ThemeProvider
beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: false,
      status: 401,
    } as Response)
  );
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Arbitrary for generating a beat ID (alphanumeric only, no spaces, unique)
const beatIdArbitrary = fc.uuid();

// Arbitrary for generating a beat
const beatArbitrary = fc.record({
  id: beatIdArbitrary,
  title: fc.string({ minLength: 1, maxLength: 50 }),
  producer: fc.string({ minLength: 1, maxLength: 30 }),
  bpm: fc.integer({ min: 60, max: 200 }),
  genre: fc.string({ minLength: 1, maxLength: 20 }),
  price: fc.double({ min: 0.01, max: 999.99, noNaN: true }),
  imageUrl: fc.webUrl(),
  audioUrl: fc.webUrl(),
  createdAt: fc.date(),
}) as fc.Arbitrary<Beat>;

describe("Property 15: Cart state display", () => {
  it("should display 'In Cart' when beat is in cart", () => {
    fc.assert(
      fc.property(beatArbitrary, (beat) => {
        // Render with isInCart = true
        const { container } = render(
          <ThemeProvider>
            <BeatCard
              beat={beat}
              isInCart={true}
              isOwned={false}
              onPlayPause={vi.fn()}
              onAddToCart={vi.fn()}
            />
          </ThemeProvider>
        );

        // Check that "In Cart" button is present
        const inCartButton = container.querySelector(`[data-testid="button-in-cart-${beat.id}"]`);
        expect(inCartButton).not.toBeNull();
        expect(inCartButton?.textContent).toContain("In Cart");
        
        // Check that the button is disabled
        expect(inCartButton).toHaveAttribute("disabled");
        
        // Verify "Add" button is not present
        const addButton = container.querySelector(`[data-testid="button-add-cart-${beat.id}"]`);
        expect(addButton).toBeNull();
        
        // Cleanup after each property test run
        cleanup();
      }),
      { numRuns: 100 }
    );
  });

  it("should display 'Add' button when beat is not in cart", () => {
    fc.assert(
      fc.property(beatArbitrary, (beat) => {
        // Render with isInCart = false
        const { container } = render(
          <ThemeProvider>
            <BeatCard
              beat={beat}
              isInCart={false}
              isOwned={false}
              onPlayPause={vi.fn()}
              onAddToCart={vi.fn()}
            />
          </ThemeProvider>
        );

        // Check that "Add" button is present
        const addButton = container.querySelector(`[data-testid="button-add-cart-${beat.id}"]`);
        expect(addButton).not.toBeNull();
        expect(addButton?.textContent).toContain("Add");
        
        // Check that the button is not disabled
        expect(addButton).not.toHaveAttribute("disabled");
        
        // Verify "In Cart" button is not present
        const inCartButton = container.querySelector(`[data-testid="button-in-cart-${beat.id}"]`);
        expect(inCartButton).toBeNull();
        
        // Cleanup after each property test run
        cleanup();
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: genre-music-page, Property 16: Ownership state display
 * Validates: Requirements 5.4
 * 
 * For any beat owned by the user, the button should display "Owned" and be disabled
 */
describe("Property 16: Ownership state display", () => {
  it("should display 'Owned' button when beat is owned", () => {
    fc.assert(
      fc.property(beatArbitrary, (beat) => {
        // Render with isOwned = true
        const { container } = render(
          <ThemeProvider>
            <BeatCard
              beat={beat}
              isInCart={false}
              isOwned={true}
              onPlayPause={vi.fn()}
              onAddToCart={vi.fn()}
            />
          </ThemeProvider>
        );

        // Check that "Owned" button is present
        const ownedButton = container.querySelector(`[data-testid="button-owned-${beat.id}"]`);
        expect(ownedButton).not.toBeNull();
        expect(ownedButton?.textContent).toContain("Owned");
        
        // Check that the button is disabled
        expect(ownedButton).toHaveAttribute("disabled");
        
        // Verify "Add" button is not present
        const addButton = container.querySelector(`[data-testid="button-add-cart-${beat.id}"]`);
        expect(addButton).toBeNull();
        
        // Verify "In Cart" button is not present
        const inCartButton = container.querySelector(`[data-testid="button-in-cart-${beat.id}"]`);
        expect(inCartButton).toBeNull();
        
        // Verify price shows "Owned" instead of dollar amount
        const priceElement = container.querySelector(`[data-testid="text-price-${beat.id}"]`);
        expect(priceElement?.textContent).toBe("Owned");
        
        // Cleanup after each property test run
        cleanup();
      }),
      { numRuns: 100 }
    );
  });

  it("should not display 'Owned' when beat is not owned", () => {
    fc.assert(
      fc.property(beatArbitrary, (beat) => {
        // Render with isOwned = false
        const { container } = render(
          <ThemeProvider>
            <BeatCard
              beat={beat}
              isInCart={false}
              isOwned={false}
              onPlayPause={vi.fn()}
              onAddToCart={vi.fn()}
            />
          </ThemeProvider>
        );

        // Verify "Owned" button is not present
        const ownedButton = container.querySelector(`[data-testid="button-owned-${beat.id}"]`);
        expect(ownedButton).toBeNull();
        
        // Verify price shows dollar amount, not "Owned"
        const priceElement = container.querySelector(`[data-testid="text-price-${beat.id}"]`);
        expect(priceElement?.textContent).not.toBe("Owned");
        expect(priceElement?.textContent).toContain(beat.price.toFixed(2));
        
        // Cleanup after each property test run
        cleanup();
      }),
      { numRuns: 100 }
    );
  });
});
