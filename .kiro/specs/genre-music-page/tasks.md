# Implementation Plan

- [x] 1. Create API endpoints for genre-based beat fetching
  - [x] 1.1 Add GET /api/genres/:genreId/beats endpoint with optional limit parameter
    - Implement route handler in server/routes.ts
    - Add storage method to fetch beats by genre with limit
    - Return beats with full beat information
    - _Requirements: 1.2, 4.2_
  
  - [x] 1.2 Add GET /api/genres-with-beats endpoint
    - Implement route handler to fetch all active genres with their beats
    - Limit beats per genre to specified amount (default 10)
    - Include total beat count for each genre
    - Filter out genres with no beats
    - _Requirements: 1.1, 1.4_
  
  - [x] 1.3 Modify existing GET /api/beats endpoint to support genre filtering
    - Add optional genre query parameter
    - Update storage method to filter by genre when provided
    - _Requirements: 4.2_

- [x] 2. Create shared audio player hook
  - [x] 2.1 Implement useAudioPlayer hook
    - Create hook in client/src/hooks/useAudioPlayer.ts
    - Manage single HTMLAudioElement instance
    - Track currently playing beat ID
    - Provide play, pause, and isPlaying functions
    - Handle audio events (ended, error)
    - Clean up audio on unmount
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 2.2 Write property test for audio player state management
    - **Property 8: Audio playback initiation**
    - **Validates: Requirements 3.1**
  
  - [x] 2.3 Write property test for single audio instance
    - **Property 9: Audio pause functionality**
    - **Validates: Requirements 3.3**

- [x] 3. Create BeatCard component
  - [x] 3.1 Implement BeatCard component
    - Create component in client/src/components/BeatCard.tsx
    - Display beat image with fallback
    - Show title, producer, BPM, genre, and price
    - Implement play/pause button with audio player integration
    - Add "Add to Cart" button with conditional rendering
    - Handle click to navigate to beat detail page
    - Apply responsive styling
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.3, 5.1, 5.2, 5.3, 5.4_
  
  - [x] 3.2 Write property test for beat information display
    - **Property 6: Beat information completeness**
    - **Validates: Requirements 2.1, 2.2**
  
  - [x] 3.3 Write property test for price formatting
    - **Property 7: Price formatting**
    - **Validates: Requirements 2.4**
  
  - [x] 3.4 Write unit tests for BeatCard component
    - Test rendering with different beat data
    - Test cart state rendering (not in cart, in cart, owned)
    - Test image fallback behavior
    - Test click handlers
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.3, 5.4_

- [x] 4. Create GenreSection component
  - [x] 4.1 Implement GenreSection component
    - Create component in client/src/components/GenreSection.tsx
    - Display genre name, description, and color theme
    - Render beat grid with up to 10 beats
    - Show "View All" button conditionally
    - Apply genre color to section styling
    - Implement responsive grid layout
    - _Requirements: 1.2, 1.3, 6.1, 6.2, 6.3_
  
  - [x] 4.2 Write property test for beat preview limit
    - **Property 2: Beat preview limit**
    - **Validates: Requirements 1.2**
  
  - [x] 4.3 Write property test for View All button visibility
    - **Property 3: View All button visibility**
    - **Validates: Requirements 1.3**

- [x] 5. Create MusicPage component
  - [x] 5.1 Implement MusicPage component
    - Create page component in client/src/pages/MusicPage.tsx
    - Fetch genres with beats using React Query
    - Render GenreSection for each genre
    - Handle loading and error states
    - Integrate audio player hook
    - Implement navigation to genre view
    - _Requirements: 1.1, 1.4, 1.5, 4.1_
  
  - [x] 5.2 Write property test for active genres filtering
    - **Property 1: Active genres only**
    - **Validates: Requirements 1.1**
  
  - [x] 5.3 Write property test for empty genre filtering
    - **Property 4: Empty genre filtering**
    - **Validates: Requirements 1.4**
  
  - [x] 5.4 Write property test for genre ordering consistency
    - **Property 5: Genre ordering consistency**
    - **Validates: Requirements 1.5**

- [x] 6. Create GenreViewPage component
  - [x] 6.1 Implement GenreViewPage component
    - Create page component in client/src/pages/GenreViewPage.tsx
    - Fetch genre details and all beats for genre
    - Display genre header with name and description
    - Implement back button navigation
    - Render all beats in responsive grid
    - Handle loading and error states
    - Integrate audio player hook
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 6.2 Add search functionality to GenreViewPage
    - Implement search input field
    - Add local state for search query
    - Filter beats by title or producer (case-insensitive)
    - Display "no results" message when appropriate
    - Update results in real-time
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 6.3 Write property test for genre page filtering
    - **Property 11: Genre page filtering**
    - **Validates: Requirements 4.2**
  
  - [x] 6.4 Write property test for genre header content
    - **Property 12: Genre header content**
    - **Validates: Requirements 4.3**
  
  - [x] 6.5 Write property test for search filtering
    - **Property 17: Search filtering**
    - **Validates: Requirements 8.2**

- [x] 7. Implement cart integration
  - [x] 7.1 Add cart state management
    - Use existing cart API endpoints
    - Fetch user's cart on component mount
    - Track cart items in React Query cache
    - _Requirements: 5.2, 5.3_
  
  - [x] 7.2 Implement add to cart functionality
    - Add mutation for adding beats to cart
    - Show success notification on add
    - Update cart state optimistically
    - Handle authentication requirement
    - _Requirements: 5.2, 5.5, 7.3_
  
  - [x] 7.3 Write property test for cart addition
    - **Property 14: Cart addition**
    - **Validates: Requirements 5.2**
  
  - [x] 7.4 Write property test for cart state display
    - **Property 15: Cart state display**
    - **Validates: Requirements 5.3**
  
  - [x] 7.5 Write property test for ownership state display
    - **Property 16: Ownership state display**
    - **Validates: Requirements 5.4**

- [x] 8. Add routing and navigation
  - [x] 8.1 Add routes to App.tsx
    - Add /music route for MusicPage
    - Add /music/genre/:genreId route for GenreViewPage
    - Update navigation menu to include Music link
    - _Requirements: 4.1_
  
  - [x] 8.2 Implement navigation handlers
    - Add navigation to beat detail page on card click
    - Add navigation to genre view on "View All" click
    - Add back navigation from genre view to music page
    - _Requirements: 4.1, 4.4, 5.1_
  
  - [x] 8.3 Write property test for genre navigation
    - **Property 10: Genre navigation**
    - **Validates: Requirements 4.1**
  
  - [x] 8.4 Write property test for beat detail navigation
    - **Property 13: Beat detail navigation**
    - **Validates: Requirements 5.1**

- [x] 9. Implement error handling and loading states
  - [x] 9.1 Add error boundaries
    - Create error boundary component
    - Wrap music page and genre view with error boundary
    - Display user-friendly error messages
    - _Requirements: 7.4_
  
  - [x] 9.2 Add loading indicators
    - Show skeleton loaders for beat cards
    - Display loading spinner for genre sections
    - Add loading state for audio player
    - _Requirements: 7.2_
  
  - [x] 9.3 Handle audio errors
    - Catch audio loading errors
    - Display error message for failed audio
    - Disable play button on error
    - _Requirements: 3.5_
  
  - [x] 9.4 Write property test for error message display
    - **Property 18: Error message display**
    - **Validates: Requirements 7.4**

- [x] 10. Add responsive design and styling
  - [x] 10.1 Implement responsive grid layouts
    - Mobile: 1 column for beat cards
    - Tablet: 2 columns for beat cards
    - Desktop: 3-4 columns for beat cards
    - Use Tailwind responsive classes
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 10.2 Add hover effects and visual feedback
    - Beat card hover effects
    - Button hover states
    - Play button active state indicator
    - Smooth transitions
    - _Requirements: 7.1, 7.5_
  
  - [x] 10.3 Ensure touch-friendly sizing
    - Minimum 44x44px for all buttons on mobile
    - Adequate spacing between interactive elements
    - Test on mobile devices
    - _Requirements: 6.5_
  
  - [x] 10.4 Write property test for playback state indicator
    - **Property 19: Playback state indicator**
    - **Validates: Requirements 7.5**

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Add accessibility features
  - [x] 12.1 Implement keyboard navigation
    - Tab navigation for all interactive elements
    - Enter/Space to activate buttons
    - Escape to close modals/dialogs
    - Focus visible indicators
  
  - [x] 12.2 Add ARIA labels and roles
    - ARIA labels for play/pause buttons
    - ARIA live regions for audio state changes
    - Alt text for all images
    - Semantic HTML structure
  
  - [x] 12.3 Test with screen readers
    - Verify screen reader announcements
    - Test navigation flow
    - Ensure all content is accessible

- [x] 13. Performance optimization
  - [x] 13.1 Implement lazy loading
    - Lazy load beat images
    - Defer audio loading until play
    - Use React.lazy for route components
  
  - [x] 13.2 Add caching strategy
    - Configure React Query cache times
    - Set appropriate stale times
    - Implement cache invalidation
  
  - [x] 13.3 Optimize audio management
    - Single audio instance
    - Clean up on unmount
    - Preload on hover (optional)

- [x] 14. Final checkpoint - Ensure all tests pass
  - [x] Fixed failing test for image fallback filename (placeholder-beat.svg vs placeholder-beat.png)
  - [x] All 38 tests now pass successfully
