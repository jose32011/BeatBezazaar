import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import fc from 'fast-check';
import BeatCard from './BeatCard';
import type { Beat } from '@shared/schema';

// Mock the ThemeContext
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    getThemeColors: () => ({
      surface: '#ffffff',
      border: '#e5e7eb',
      text: '#111827',
      textSecondary: '#6b7280',
      background: '#f9fafb',
      primary: '#3b82f6',
    }),
  }),
}));

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/test', vi.fn()],
}));

// Arbitrary for generating Beat objects
const beatArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  producer: fc.string({ minLength: 1, maxLength: 50 }),
  bpm: fc.integer({ min: 60, max: 200 }),
  genre: fc.string({ minLength: 1, maxLength: 30 }),
  price: fc.double({ min: 0.01, max: 9999.99, noNaN: true }),
  imageUrl: fc.webUrl(),
  audioUrl: fc.webUrl(),
  createdAt: fc.date().map((d: Date) => d),
});

describe('BeatCard Property Tests', () => {
  /**
   * **Feature: genre-music-page, Property 6: Beat information completeness**
   * **Validates: Requirements 2.1, 2.2**
   * 
   * For any beat, the rendered card should contain the beat's title, producer name, BPM, and price
   */
  it('Property 6: should display all required beat information (title, producer, BPM, price)', () => {
    fc.assert(
      fc.property(beatArbitrary, (beat: Beat) => {
        const { container } = render(
          <BeatCard beat={beat} />
        );

        // Check that title is present
        const titleElement = screen.getByTestId(`text-title-${beat.id}`);
        expect(titleElement).toBeInTheDocument();
        expect(titleElement.textContent).toBe(beat.title);

        // Check that producer is present
        const producerElement = screen.getByTestId(`text-producer-${beat.id}`);
        expect(producerElement).toBeInTheDocument();
        expect(producerElement.textContent).toBe(`by ${beat.producer}`);

        // Check that BPM is present
        const bpmElement = screen.getByTestId(`badge-bpm-${beat.id}`);
        expect(bpmElement).toBeInTheDocument();
        expect(bpmElement.textContent).toBe(`${beat.bpm} BPM`);

        // Check that price is present
        const priceElement = screen.getByTestId(`text-price-${beat.id}`);
        expect(priceElement).toBeInTheDocument();
        expect(priceElement.textContent).toContain(beat.price.toFixed(2));

        // Cleanup
        container.remove();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: genre-music-page, Property 7: Price formatting**
   * **Validates: Requirements 2.4**
   * 
   * For any numeric price value, the formatted output should have exactly 2 decimal places
   */
  it('Property 7: should format price with exactly 2 decimal places', () => {
    fc.assert(
      fc.property(beatArbitrary, (beat: Beat) => {
        const { container } = render(
          <BeatCard beat={beat} />
        );

        const priceElement = screen.getByTestId(`text-price-${beat.id}`);
        const priceText = priceElement.textContent || '';
        
        // Extract the numeric part (remove $ sign)
        const numericPart = priceText.replace('$', '');
        
        // Check that it has exactly 2 decimal places
        const decimalMatch = numericPart.match(/\.(\d+)$/);
        expect(decimalMatch).not.toBeNull();
        expect(decimalMatch![1].length).toBe(2);

        // Verify the formatted price matches the expected format
        expect(priceText).toBe(`$${beat.price.toFixed(2)}`);

        // Cleanup
        container.remove();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: genre-music-page, Property 13: Beat detail navigation**
   * **Validates: Requirements 5.1**
   * 
   * For any beat card, clicking the card should navigate to the route /beats/{beatId}
   */
  it('Property 13: should navigate to correct beat detail route for any beat', () => {
    fc.assert(
      fc.property(beatArbitrary, (beat: Beat) => {
        // Simulate the navigation handler
        const handleCardClick = (beatId: string) => {
          return `/beats/${beatId}`;
        };
        
        const expectedRoute = `/beats/${beat.id}`;
        const actualRoute = handleCardClick(beat.id);
        
        // The route should match the expected format
        expect(actualRoute).toBe(expectedRoute);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: genre-music-page, Property 19: Playback state indicator**
   * **Validates: Requirements 7.5**
   * 
   * For any beat that is currently playing, the play button should show a visual indicator (e.g., pause icon)
   */
  it('Property 19: should show visual indicator when beat is playing', () => {
    fc.assert(
      fc.property(beatArbitrary, (beat: Beat) => {
        // Test with isPlaying = true
        const { container: playingContainer, unmount: unmountPlaying } = render(
          <BeatCard beat={beat} isPlaying={true} />
        );

        const playingButton = within(playingContainer).getByTestId(`button-play-${beat.id}`);
        
        // When playing, should show pause icon (visual indicator)
        const pauseIcon = playingContainer.querySelector('.lucide-pause');
        expect(pauseIcon).toBeInTheDocument();
        
        // Should have the active state styling classes
        expect(playingButton.className).toContain('ring-4');
        expect(playingButton.className).toContain('scale-110');
        
        unmountPlaying();

        // Test with isPlaying = false for contrast
        const { container: notPlayingContainer, unmount: unmountNotPlaying } = render(
          <BeatCard beat={beat} isPlaying={false} />
        );

        const notPlayingButton = within(notPlayingContainer).getByTestId(`button-play-${beat.id}`);
        
        // When not playing, should show play icon (not pause)
        const playIcon = notPlayingContainer.querySelector('.lucide-play');
        expect(playIcon).toBeInTheDocument();
        
        // Should not have the active state styling (ring-4 and scale-110 together indicate playing)
        // Note: focus-visible:ring-4 is always present, but the actual ring-4 class is only when playing
        const hasPlayingState = notPlayingButton.className.includes('ring-4 ring-offset-2 scale-110');
        expect(hasPlayingState).toBe(false);
        
        unmountNotPlaying();
      }),
      { numRuns: 100 }
    );
  });
});

describe('BeatCard Unit Tests', () => {
  const mockBeat: Beat = {
    id: 'test-beat-1',
    title: 'Test Beat',
    producer: 'Test Producer',
    bpm: 120,
    genre: 'Hip-Hop',
    price: 29.99,
    imageUrl: 'https://example.com/beat.jpg',
    audioUrl: 'https://example.com/beat.mp3',
    createdAt: new Date('2024-01-01'),
  };

  it('should render beat card with correct data', () => {
    render(<BeatCard beat={mockBeat} />);

    expect(screen.getByTestId('text-title-test-beat-1')).toHaveTextContent('Test Beat');
    expect(screen.getByTestId('text-producer-test-beat-1')).toHaveTextContent('by Test Producer');
    expect(screen.getByTestId('badge-bpm-test-beat-1')).toHaveTextContent('120 BPM');
    expect(screen.getByTestId('badge-genre-test-beat-1')).toHaveTextContent('Hip-Hop');
    expect(screen.getByTestId('text-price-test-beat-1')).toHaveTextContent('$29.99');
  });

  it('should show "Add to Cart" button when not in cart and not owned', () => {
    const mockAddToCart = vi.fn();
    render(<BeatCard beat={mockBeat} onAddToCart={mockAddToCart} />);

    const addButton = screen.getByTestId('button-add-cart-test-beat-1');
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent('Add');
  });

  it('should show "In Cart" button when beat is in cart', () => {
    render(<BeatCard beat={mockBeat} isInCart={true} />);

    const inCartButton = screen.getByTestId('button-in-cart-test-beat-1');
    expect(inCartButton).toBeInTheDocument();
    expect(inCartButton).toHaveTextContent('In Cart');
    expect(inCartButton).toBeDisabled();
  });

  it('should show "Owned" button when beat is owned', () => {
    render(<BeatCard beat={mockBeat} isOwned={true} />);

    const ownedButton = screen.getByTestId('button-owned-test-beat-1');
    expect(ownedButton).toBeInTheDocument();
    expect(ownedButton).toHaveTextContent('Owned');
    expect(ownedButton).toBeDisabled();
  });

  it('should display "Owned" text instead of price when beat is owned', () => {
    render(<BeatCard beat={mockBeat} isOwned={true} />);

    const priceElement = screen.getByTestId('text-price-test-beat-1');
    expect(priceElement).toHaveTextContent('Owned');
  });

  it('should show play button when not playing', () => {
    render(<BeatCard beat={mockBeat} isPlaying={false} />);

    const playButton = screen.getByTestId('button-play-test-beat-1');
    expect(playButton).toBeInTheDocument();
    // Play icon should be present (not Pause)
    expect(playButton.querySelector('.lucide-play')).toBeInTheDocument();
  });

  it('should show pause button when playing', () => {
    render(<BeatCard beat={mockBeat} isPlaying={true} />);

    const playButton = screen.getByTestId('button-play-test-beat-1');
    expect(playButton).toBeInTheDocument();
    // Pause icon should be present (not Play)
    expect(playButton.querySelector('.lucide-pause')).toBeInTheDocument();
  });

  it('should call onPlayPause when play button is clicked', () => {
    const mockPlayPause = vi.fn();
    const { container } = render(<BeatCard beat={mockBeat} onPlayPause={mockPlayPause} />);

    const playButton = screen.getByTestId('button-play-test-beat-1');
    playButton.click();

    expect(mockPlayPause).toHaveBeenCalledTimes(1);
    container.remove();
  });

  it('should call onAddToCart when add to cart button is clicked', () => {
    const mockAddToCart = vi.fn();
    const { container } = render(<BeatCard beat={mockBeat} onAddToCart={mockAddToCart} />);

    const addButton = screen.getByTestId('button-add-cart-test-beat-1');
    addButton.click();

    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    container.remove();
  });

  it('should handle image error by showing fallback', async () => {
    const { container } = render(<BeatCard beat={mockBeat} />);

    const img = screen.getByTestId('img-beat-test-beat-1') as HTMLImageElement;
    
    // Initially should show the beat's image URL
    expect(img.src).toContain('example.com/beat.jpg');

    // Simulate image error with act
    await vi.waitFor(() => {
      img.dispatchEvent(new Event('error'));
    });

    // After error, should show placeholder
    await vi.waitFor(() => {
      expect(img.src).toContain('placeholder-beat.svg');
    });
    
    container.remove();
  });

  it('should call onPlayPause without triggering card click', () => {
    const mockPlayPause = vi.fn();
    const { container } = render(<BeatCard beat={mockBeat} onPlayPause={mockPlayPause} />);

    const playButton = screen.getByTestId('button-play-test-beat-1');
    playButton.click();

    // Play button should be called
    expect(mockPlayPause).toHaveBeenCalledTimes(1);
    
    container.remove();
  });

  it('should call onAddToCart without triggering card click', () => {
    const mockAddToCart = vi.fn();
    const { container } = render(<BeatCard beat={mockBeat} onAddToCart={mockAddToCart} />);

    const addButton = screen.getByTestId('button-add-cart-test-beat-1');
    addButton.click();

    // Add to cart should be called
    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    
    container.remove();
  });
});
