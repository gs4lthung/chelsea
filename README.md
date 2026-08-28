# Chelsea FC Player Showcase

An interactive single-page application showcasing Chelsea FC players with smooth animations, keyboard navigation, and responsive design.

## Features

- **Interactive Player Cards**: Browse through Chelsea FC squad with smooth transitions
- **Keyboard Navigation**: Use arrow keys (←/→/↑/↓) to navigate between players
- **Special Player Indicators**:
  - **Captain Glow**: Visual indication for team captain (Reece James)
  - **Suspension Indicator**: Red glow for suspended players
- **Image Optimization**: Lazy loading, retry logic, and fallback images
- **Responsive Design**: Mobile-friendly interface
- **Accessibility**: ARIA labels and semantic HTML

## Tech Stack

- **Framework**: SvelteKit 2.16.0
- **Language**: TypeScript 5.0
- **Styling**: TailwindCSS 4.0.0
- **Build Tool**: Vite 6.2.6
- **Testing**: Vitest

## Project Structure

```
src/
├── lib/
│   ├── players.ts          # Player data validation and utilities
│   ├── config.ts           # Application configuration
│   ├── image-utils.ts      # Image loading with error handling
│   └── navigation.ts       # Navigation utilities
├── routes/
│   ├── +layout.svelte      # Root layout
│   └── +page.svelte        # Main page component
├── test/
│   ├── setup.ts            # Test configuration
│   └── *.test.ts           # Test files
├── app.css                 # Global styles and animations
└── chelsea.json            # Player data
```

## Data Structure

Each player in `chelsea.json` follows this structure:

```typescript
interface Player {
  id: number | string;      // Player jersey number
  firstName: string;        // First name
  lastName: string;         // Last name
  position: string;         // Playing position
  image: string;            // Path to player image
  countryImage: string;     // Path to country flag
  isCaptain?: boolean;      // Optional: Team captain
  isSuspended?: boolean;    // Optional: Suspension status
}
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chelsea
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Building for Production

```bash
npm run build
```

The built files will be in the `.svelte-kit` directory.

### Preview Production Build

```bash
npm run preview
```

## Configuration

Environment variables can be set in a `.env` file (see `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_BG_IMAGE_URL` | Background image URL | Unsplash stadium image |
| `VITE_FALLBACK_IMAGE_URL` | Fallback player image | Silhouette image |
| `VITE_TRANSITION_DURATION` | Animation duration (ms) | 500 |
| `VITE_KEYBOARD_NAVIGATION_ENABLED` | Enable keyboard nav | true |
| `VITE_PRELOAD_ALL_IMAGES` | Preload all images | true |
| `VITE_MAX_IMAGE_RETRIES` | Max retry attempts | 3 |
| `VITE_IMAGE_RETRY_DELAY` | Retry delay (ms) | 1000 |

## Testing

### Run Tests

```bash
npm run test          # Watch mode
npm run test:run      # Single run
npm run test:ui       # UI mode
npm run test:coverage # With coverage
```

### Test Structure

- **Unit Tests**: Located in `src/lib/*.test.ts`
- **Setup**: `src/test/setup.ts`
- **Coverage**: Reports in `coverage/` directory

## Development

### Type Checking

```bash
npm run check         # One-time check
npm run check:watch   # Watch mode
```

### Code Organization

- **Data Layer**: `src/lib/players.ts` - Type-safe player data with validation
- **Config**: `src/lib/config.ts` - Environment-based configuration
- **Utilities**: `src/lib/image-utils.ts`, `src/lib/navigation.ts` - Reusable functions
- **Components**: `src/routes/+page.svelte` - Main UI component

## Key Features Implementation

### Image Loading
- Retry logic with configurable attempts and delay
- Fallback images for failed loads
- Optional preloading of all images on mount
- Lazy loading for country flags

### Navigation
- Unified `navigate(direction)` function eliminates code duplication
- Debouncing prevents rapid-fire clicks
- Keyboard support with configurable enable/disable
- Proper state management to prevent navigation during transitions

### Error Handling
- Graceful fallback when images fail to load
- Visual error indicator on player cards
- Console warnings for debugging

### Accessibility
- ARIA labels on player cards
- Semantic HTML (`nav`, button with `aria-label`)
- Keyboard navigation support
- Disabled state indicators

## Deployment

### Static Site Hosting

For static hosting (Netlify, Vercel, GitHub Pages), the `adapter-auto` will automatically detect the platform:

```bash
npm run build
```

Deploy the contents of `.svelte-kit/output` to your hosting provider.

### Custom Adapter

For specific deployment targets, install the appropriate adapter:

```bash
# For Node.js
npm install -D @sveltejs/adapter-node

# For Vercel
npm install -D @sveltejs/adapter-vercel

# For Netlify
npm install -D @sveltejs/adapter-netlify
```

Then update `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-node'; // or your chosen adapter

export default {
  kit: {
    adapter: adapter()
  }
};
```

## Performance Optimizations

- **Image Preloading**: Optional preloading of all player images
- **Lazy Loading**: Country flags load lazily
- **Retry Logic**: Configurable retry attempts for failed loads
- **Optimal Bundle Size**: Tree-shaking and code splitting via Vite

## Browser Support

- Modern browsers with ES6+ support
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## License

This project is for educational purposes. Player images and data are used for demonstration.

## Credits

- Design & Development: [Lâm Tiên Hưng](https://www.facebook.com/hung.041203)
- Built with [SvelteKit](https://kit.svelte.dev/)
- Player data: Chelsea FC Squad (2024/2025 season)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test:run`
5. Submit a pull request

## Troubleshooting

### Images not loading
- Check if player images exist in `static/` directory
- Verify image paths in `chelsea.json`
- Check browser console for errors

### Keyboard navigation not working
- Ensure `VITE_KEYBOARD_NAVIGATION_ENABLED` is not set to `false`
- Click on the page to ensure it has focus

### Build errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript version: `npm ls typescript`
