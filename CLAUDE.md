# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RaceDayPack is a single-page web application that helps athletes prepare for race day by providing personalized recommendations for clothing, gear, and packing based on race type, weather conditions, and experience level.

## Architecture

### Single-Page Application Structure
- **HTML**: All pages contained in `index.html` with show/hide navigation via JavaScript
- **CSS**: Component-based styling in `styles.css` using CSS custom properties (design tokens)
- **JavaScript**: Class-based architecture in `app.js` with `RaceDayPack` main controller

### Key Components
- **Page Navigation**: Pages managed via `showPage()` method with CSS class toggling
- **Data Management**: User preferences and race details stored in `localStorage`
- **Recommendation Engine**: `calculateRecommendations()` generates personalized suggestions based on:
  - Race type (running, cycling, triathlon variants)
  - Weather conditions (temperature, precipitation, wind)
  - User experience level (beginner, intermediate, advanced)
  - Personal preferences from onboarding

### Data Flow
1. User onboarding → `userData.profile`
2. Race details input → `userData.raceDetails` 
3. Weather API simulation → `weatherData`
4. Recommendation generation → `userData.recommendations`
5. UI population → Dynamic DOM manipulation

## Development Commands

```bash
# Start development server with live reload
npm run dev

# Start production server
npm start

# Build for production (placeholder)
npm run build

# Run linting (placeholder)
npm run lint
```

## Key Features Implementation

### Weather Integration
- Simulated weather API in `fetchWeatherData()`
- Real implementation would integrate OpenWeatherMap API
- Weather data influences clothing/gear recommendations

### Recommendation Logic
- `getClothingRecommendations()`: Temperature and condition-based gear selection
- `getPackingRecommendations()`: Race-type and experience-level specific items  
- `getTimelineRecommendations()`: Pre-race preparation scheduling

### Interactive Elements
- Packing list checkboxes with `togglePackingItem()` persistence
- Tab navigation in recommendations via `switchTab()`
- Form validation and progressive disclosure

## Styling System

### Design Tokens
- CSS custom properties in `:root` for consistent theming
- Color palette: Primary blue (#3182ce), accent orange (#ed8936)
- Spacing scale: `--spacing-xs` through `--spacing-2xl`
- Component-based class naming

### Responsive Design
- Mobile-first approach with progressive enhancement
- CSS Grid and Flexbox for layouts
- Breakpoint at 768px for mobile/desktop variants

## Data Persistence

### localStorage Schema
```javascript
{
  name: string,
  experience: 'beginner' | 'intermediate' | 'advanced',
  preferredRaceTypes: string[],
  raceDetails: {
    raceType, raceDate, location, temperature, conditions, etc.
  },
  recommendations: {
    clothing: { essential, weatherSpecific, accessories },
    packing: { preRace, duringRace, postRace },
    timeline: { weekBefore, nightBefore, raceDay }
  }
}
```

## Common Development Patterns

### Adding New Race Types
1. Update race type options in HTML select element
2. Add race type logic in `getClothingRecommendations()`
3. Update `formatRaceType()` for display formatting
4. Add specific gear requirements in recommendation logic

### Weather Condition Handling
- Temperature thresholds: <40°F, 40-60°F, 60-75°F, >75°F
- Condition modifiers: rain, wind, humidity adjustments
- Layering strategies based on temperature ranges

### UI State Management
- Page visibility controlled via `.active` class
- Form validation before page transitions
- Progress indication for multi-step flows