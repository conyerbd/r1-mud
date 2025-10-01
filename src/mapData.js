// Map data for the MUD game
// Each tile has terrain type and story content

export const MAP_SIZE = 15; // 15x15 grid

// Terrain types
export const TERRAIN = {
  F: { name: 'Forest', color: '#2d5016', char: 'F' },
  P: { name: 'Plains', color: '#8b7355', char: 'P' },
  R: { name: 'River', color: '#4682b4', char: 'R' }
};

// Generate the map (15x15)
export const generateMap = () => {
  const map = [];
  for (let y = 0; y < MAP_SIZE; y++) {
    const row = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      // Create some interesting terrain patterns
      let terrain;
      
      // River running through the middle vertically
      if (x === 7 || x === 8) {
        terrain = 'R';
      }
      // Forest patches
      else if ((x < 4 && y < 5) || (x > 10 && y > 10)) {
        terrain = 'F';
      }
      // Default to plains
      else {
        terrain = 'P';
      }
      
      row.push(terrain);
    }
    map.push(row);
  }
  return map;
};

// Get story content for a tile
export const getTileStory = (x, y, terrain) => {
  const stories = {
    F: [
      "You enter a dense forest. Ancient trees tower above you, their branches blocking most of the sunlight. The air is thick with the scent of pine and earth. Birds chirp somewhere in the canopy above. (10 minutes)",
      "The forest grows darker here. Moss covers the tree trunks, and you hear the distant sound of an animal rustling through the underbrush. Your footsteps are muffled by a thick carpet of fallen leaves. (10 minutes)",
      "A small clearing appears in the forest. Wildflowers grow here, and a fallen log provides a perfect resting spot. The peace is interrupted only by the occasional flutter of wings. (10 minutes)"
    ],
    P: [
      "You traverse an open plain. Golden grass sways in the gentle breeze, stretching endlessly toward the horizon. The sun warms your face as you walk. (10 minutes)",
      "The plains continue. In the distance, you spot a lone tree standing as a sentinel over the grassland. A hawk circles overhead, searching for prey. (10 minutes)",
      "Rolling hills of grass surround you. The wind picks up, creating waves across the plain like an ocean of gold. The sky is vast and blue above. (10 minutes)"
    ],
    R: [
      "You reach the riverbank. The water flows swiftly, crystal clear and cold. Smooth stones line the shore, and you can see fish darting beneath the surface. (10 minutes)",
      "The river widens here, its current slowing to a gentle burble. Water striders dance across the surface, and dragonflies hover near the reeds at the water's edge. (10 minutes)",
      "The river runs deep here. The sound of rushing water fills your ears. Across the way, you can see the opposite bank, but the current looks treacherous. (10 minutes)"
    ]
  };
  
  const terrainStories = stories[terrain] || stories.P;
  const index = (x + y * MAP_SIZE) % terrainStories.length;
  
  return {
    title: `${TERRAIN[terrain].name} (${x}, ${y})`,
    content: terrainStories[index],
    terrain: terrain
  };
};

export default {
  MAP_SIZE,
  TERRAIN,
  generateMap,
  getTileStory
};

