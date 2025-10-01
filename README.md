# R1 MUD Game

A text-based MUD (Multi-User Dungeon) adventure game designed for the Rabbit R1 device.

## Features

- **Old-school Terminal UI**: Brown background with light tan text for that classic computer terminal feel
- **ASCII Map**: Explore a 15x15 grid world with different terrain types:
  - `F` = Forest
  - `P` = Plains  
  - `R` = River
  - `@` = Your position
- **Story Log**: Each tile has unique descriptions that unfold as you explore
- **Dual Section Interface**: Toggle between map view and story log

## How to Play

### Navigation
- **Scroll Wheel**: Toggle between MAP and STORY sections
- **Side Button**: 
  - When MAP is selected: Opens the movement menu
  - When STORY is selected: Allows scrolling through the story log

### Movement
1. Use the wheel to select the MAP section (it will be highlighted)
2. Press the side button to open the radial direction menu
3. Use the wheel to select a direction (N, NE, E, SE, S, SW, W, NW)
4. Press the side button again to move in that direction

### Game Mechanics
- Each tile represents 10 minutes of walking time
- Movement between tiles adds new story entries to your log
- The map shows a 5x5 grid centered on your current position

## Installation

```bash
npm install
npm start
```

## Development

Built with React for the Rabbit R1's 240x320 pixel display.

## Deployment

This project is configured to automatically deploy to GitHub Pages when you push to the `main` branch. The GitHub Actions workflow will:

1. Build the React app
2. Deploy to GitHub Pages

To enable GitHub Pages for your repository:
1. Go to your repository settings
2. Navigate to Pages
3. Under "Build and deployment", select "GitHub Actions" as the source

The app will be available at: `https://[your-username].github.io/r1-mud/`
