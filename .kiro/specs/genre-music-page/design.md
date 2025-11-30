# Design Document: Genre-Based Music Discovery Page

## Overview

The Genre-Based Music Discovery Page provides users with an organized, browsable interface for discovering beats by genre. The page displays genre sections with up to 10 beat previews each, allowing users to play audio samples and navigate to genre-specific views for comprehensive browsing.

## Architecture

### Component Structure

```
MusicPage (Main Container)
├── GenreSection (Repeatable)
│   ├── GenreSectionHeader
│   │   ├── Genre Title
│   │   ├── Genre Description
│   │   └── View All Button
│   └── BeatGrid
│       └── BeatCard (up to 10)
│           ├── BeatImage
│           ├── BeatInfo
│           ├── AudioPlayer
│           └── ActionButtons
│
GenreViewPage (Genre-Specific View)
├── GenreHeader
│   ├── Back Button
│   ├── Genre Title
│   └── Genre Description
├── SearchBar
└── BeatGrid
    └── BeatCard (all beats in genre)
        ├── BeatImage
        ├── BeatInfo
        ├── AudioPlayer
        └── ActionButtons
```

### Routing

- `/music` - Main music page with genre sections
- `/music/genre/:genreId` - Genre-specific view showing all beats in that genre

### State Management

- Use React Query for server state (genres, beats)
- Use React Context or local state for audio player state
- Use local state for search/filter functionality

## Components and Interfaces

### MusicPage Component

**Purpose:** Main container that fetches and displays all genres with their beat previews

**Props:** None (route component)

**State:**
- `genres`: Array of genre objects with associated beats
- `isLoading`: Boolean for loading state
- `error`: Error object if fetch fails

**Key Functions:**
- `fetchGenresWithBeats()`: Fetches all active genres and their beats (limited to 10 per genre)
- `handleViewAll(genreId)`: Navigates to genre-specific page

### GenreSection Component

**Purpose:** Displays a single genre with up to 10 beat previews

**Props:**
```typescript
interface GenreSectionProps {
  genre: Genre;
  beats: Beat[];
  onViewAll: (genreId: string) => void;
}
```

**Features:**
- Displays genre name, description, and color theme
- Shows "View All" button if more than 10 beats exist
- Renders beat grid with responsive layout

### BeatCard Component

**Purpose:** Displays individual beat information with playback and action controls

**Props:**
```typescript
interface BeatCardProps {
  beat: Beat;
  isPlaying: boolean;
  onPlay: (beatId: string) => void;
  onPause: () => void;
  onAddToCart: (beatId: string) => void;
  isInCart: boolean;
  isOwned: boolean;
}
```

**Features:**
- Beat cover image with fallback
- Title, producer, BPM, genre display
- Price formatting
- Play/pause button
- Add to cart button (conditional rendering)
- Click to navigate to beat detail page

### AudioPlayer Hook

**Purpose:** Manages audio playback state across the application

**Interface:**
```typescript
interface UseAudioPlayer {
  currentlyPlaying: string | null;
  play: (beatId: string, audioUrl: string) => void;
  pause: () => void;
  isPlaying: (beatId: string) => boolean;
}
```

**Implementation:**
- Single HTMLAudioElement instance
- Stops current audio when playing new track
- Handles audio events (ended, error, etc.)
- Provides playback state to components

### GenreViewPage Component

**Purpose:** Displays all beats within a specific genre with search functionality

**Props:** None (uses route params)

**State:**
- `genre`: Genre object
- `beats`: Array of all beats in genre
- `searchQuery`: String for filtering beats
- `filteredBeats`: Computed array based on search

**Key Functions:**
- `fetchGenreBeats(genreId)`: Fetches all beats for specific genre
- `handleSearch(query)`: Filters beats by title or producer
- `handleBack()`: Navigates back to main music page

## Data Models

### Genre Model (Existing)
```typescript
interface Genre {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Beat Model (Existing)
```typescript
interface Beat {
  id: string;
  title: string;
  producer: string;
  bpm: number;
  genre: string;
  price: number;
  imageUrl: string;
  audioUrl: string;
  createdAt: Date;
}
```

### GenreWithBeats Model (New)
```typescript
interface GenreWithBeats {
  genre: Genre;
  beats: Beat[];
  totalBeats: number; // Total count for "View All" logic
}
```

## API Endpoints

### Existing Endpoints to Use

- `GET /api/genres` - Fetch all active genres
- `GET /api/beats` - Fetch all beats
- `GET /api/beats?genre={genreId}` - Fetch beats by genre (needs implementation)
- `POST /api/cart` - Add beat to cart
- `GET /api/cart` - Get user's cart

### New Endpoints Needed

- `GET /api/genres/:genreId/beats?limit={n}` - Fetch beats for a genre with optional limit
- `GET /api/genres-with-beats?limit={n}` - Fetch all genres with their beats (limited per genre)

## Error Handling

### Error Scenarios

1. **Network Errors**
   - Display retry button
   - Show user-friendly error message
   - Log error details for debugging

2. **Audio Loading Errors**
   - Disable play button
   - Show "Audio unavailable" message
   - Allow user to continue browsing

3. **Empty States**
   - No genres: "No genres available"
   - No beats in genre: "No beats available in this genre"
   - Search no results: "No beats match your search"

4. **Authentication Errors**
   - Redirect to login when adding to cart
   - Show authentication required message

## Testing Strategy

### Unit Tests

- BeatCard component rendering with different props
- AudioPlayer hook state management
- Search/filter logic in GenreViewPage
- Price formatting utility
- Genre color theme application

### Property-Based Tests

Property-based tests will be written using the fast-check library for JavaScript/TypeScript, configured to run a minimum of 100 iterations per test.

Each property-based test will be tagged with a comment in this format: `**Feature: genre-music-page, Property {number}: {property_text}**`

### Integration Tests

- Full music page rendering with multiple genres
- Navigation between music page and genre view
- Audio playback across different beat cards
- Cart functionality integration
- Responsive layout behavior

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**
   - Load beat images lazily as they enter viewport
   - Defer audio loading until play button is clicked

2. **Pagination**
   - Implement virtual scrolling for genre view with many beats
   - Load beats in batches on genre-specific pages

3. **Caching**
   - Cache genre and beat data with React Query
   - Set appropriate stale times for data freshness

4. **Audio Management**
   - Preload audio on hover (optional)
   - Clean up audio resources when component unmounts
   - Single audio instance to prevent memory leaks

## Accessibility

- Keyboard navigation for all interactive elements
- ARIA labels for play/pause buttons
- Alt text for beat images
- Focus indicators for interactive elements
- Screen reader announcements for audio state changes
- Semantic HTML structure

## Responsive Design

### Breakpoints

- Mobile: < 640px (1 column)
- Tablet: 640px - 1024px (2 columns)
- Desktop: > 1024px (3-4 columns)

### Mobile Considerations

- Touch-friendly button sizes (min 44x44px)
- Simplified layout for smaller screens
- Optimized image sizes for mobile bandwidth
- Swipe gestures for navigation (optional enhancement)


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Active genres only

*For any* set of genres (some active, some inactive), the music page display function should only return genres where `isActive === true`

**Validates: Requirements 1.1**

### Property 2: Beat preview limit

*For any* genre with associated beats, the preview display should show at most 10 beats

**Validates: Requirements 1.2**

### Property 3: View All button visibility

*For any* genre with more than 10 beats, the rendered output should include a "View All" button

**Validates: Requirements 1.3**

### Property 4: Empty genre filtering

*For any* set of genres, those with zero beats should not appear in the music page display

**Validates: Requirements 1.4**

### Property 5: Genre ordering consistency

*For any* set of genres, fetching and displaying them multiple times should produce the same order

**Validates: Requirements 1.5**

### Property 6: Beat information completeness

*For any* beat, the rendered card should contain the beat's title, producer name, BPM, and price

**Validates: Requirements 2.1, 2.2**

### Property 7: Price formatting

*For any* numeric price value, the formatted output should have exactly 2 decimal places

**Validates: Requirements 2.4**

### Property 8: Audio playback initiation

*For any* beat with valid audio URL, triggering the play action should result in audio playback starting

**Validates: Requirements 3.1**

### Property 9: Audio pause functionality

*For any* currently playing beat, triggering the pause action should stop audio playback

**Validates: Requirements 3.3**

### Property 10: Genre navigation

*For any* genre, clicking the "View All" action should navigate to the route `/music/genre/{genreId}`

**Validates: Requirements 4.1**

### Property 11: Genre page filtering

*For any* genre, the genre-specific page should display exactly the beats where `beat.genre === genre.id`

**Validates: Requirements 4.2**

### Property 12: Genre header content

*For any* genre on the genre-specific page, the header should contain both the genre name and description

**Validates: Requirements 4.3**

### Property 13: Beat detail navigation

*For any* beat card, clicking the card should navigate to the route `/beats/{beatId}`

**Validates: Requirements 5.1**

### Property 14: Cart addition

*For any* beat not currently in the cart, adding it should result in the beat appearing in the user's cart

**Validates: Requirements 5.2**

### Property 15: Cart state display

*For any* beat already in the cart, the button text should display "In Cart" instead of "Add to Cart"

**Validates: Requirements 5.3**

### Property 16: Ownership state display

*For any* beat owned by the user, the button should display "Owned" and be disabled

**Validates: Requirements 5.4**

### Property 17: Search filtering

*For any* search query on the genre page, the filtered results should only include beats where the title or producer name contains the query string (case-insensitive)

**Validates: Requirements 8.2**

### Property 18: Error message display

*For any* error that occurs during beat operations, an error message should be displayed to the user

**Validates: Requirements 7.4**

### Property 19: Playback state indicator

*For any* beat that is currently playing, the play button should show a visual indicator (e.g., pause icon)

**Validates: Requirements 7.5**
