import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { generateMap, getTileStory, TERRAIN, MAP_SIZE } from './mapData';

function App() {
  // Game state
  const [map] = useState(generateMap());
  const [playerX, setPlayerX] = useState(7); // Start in the Middle
  const [playerY, setPlayerY] = useState(7);
  const [selectedPanel, setSelectedPanel] = useState(0); // 0=map, 1=stats, 2=story
  const [showMovementMenu, setShowMovementMenu] = useState(false);
  const [selectedDirection, setSelectedDirection] = useState(0); // 0-8 (8 directions + cancel)
  const [isStoryScrollMode, setIsStoryScrollMode] = useState(false); // true when scrolling story
  const [storyHistory, setStoryHistory] = useState([]);
  const [moveCount, setMoveCount] = useState(0);
  
  // Refs for scrolling
  const storyContainerRef = useRef(null);
  const scrollVelocityRef = useRef(0);
  const scrollDirectionRef = useRef(0);
  const lastTickTimeRef = useRef(Date.now());
  const animationFrameRef = useRef(null);
  const scrollBufferRef = useRef([]);

  // Initialize with starting location story
  useEffect(() => {
    const initialStory = getTileStory(playerX, playerY, map[playerY][playerX]);
    setStoryHistory([{
      ...initialStory,
      timestamp: new Date().toLocaleTimeString()
    }]);
  }, []);

  // Directions: N, NE, E, SE, S, SW, W, NW, Cancel
  const directions = [
    { name: 'N', dx: 0, dy: -1 },
    { name: 'NE', dx: 1, dy: -1 },
    { name: 'E', dx: 1, dy: 0 },
    { name: 'SE', dx: 1, dy: 1 },
    { name: 'S', dx: 0, dy: 1 },
    { name: 'SW', dx: -1, dy: 1 },
    { name: 'W', dx: -1, dy: 0 },
    { name: 'NW', dx: -1, dy: -1 },
    { name: 'X', dx: null, dy: null } // Cancel option
  ];

  // Count terrain types in visible area
  const getTerrainStats = () => {
    const stats = { F: 0, P: 0, R: 0, M: 0 };
    const viewRadius = 2;
    
    for (let y = playerY - viewRadius; y <= playerY + viewRadius; y++) {
      for (let x = playerX - viewRadius; x <= playerX + viewRadius; x++) {
        if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) {
          const terrain = map[y][x];
          if (stats[terrain] !== undefined) stats[terrain]++;
        }
      }
    }
    return stats;
  };

  // Render the ASCII map
  const renderMap = () => {
    const lines = [];
    const viewRadius = 2; // Show 5x5 grid around player
    
    for (let y = playerY - viewRadius; y <= playerY + viewRadius; y++) {
      let line = '';
      for (let x = playerX - viewRadius; x <= playerX + viewRadius; x++) {
        if (x === playerX && y === playerY) {
          line += '@'; // Player position
        } else if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) {
          line += ' '; // Out of bounds
        } else {
          line += map[y][x];
        }
        line += ' '; // Space between characters
      }
      lines.push(line);
    }
    
    return lines;
  };

  // Handle movement
  const movePlayer = (direction) => {
    // Check if cancel was selected
    if (direction.dx === null) {
      setShowMovementMenu(false);
      return;
    }
    
    const newX = playerX + direction.dx;
    const newY = playerY + direction.dy;
    
    // Check bounds
    if (newX >= 0 && newX < MAP_SIZE && newY >= 0 && newY < MAP_SIZE) {
      setPlayerX(newX);
      setPlayerY(newY);
      setMoveCount(prev => prev + 1);
      
      // Add new story entry
      const newStory = getTileStory(newX, newY, map[newY][newX]);
      setStoryHistory(prev => [...prev, {
        ...newStory,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        if (storyContainerRef.current) {
          storyContainerRef.current.scrollTop = storyContainerRef.current.scrollHeight;
        }
      }, 100);
    }
    
    setShowMovementMenu(false);
  };

  // Smooth scrolling for story section (when in scroll mode)
  useEffect(() => {
    if (!isStoryScrollMode) return;

    const BASE_VELOCITY = 2;
    const MAX_VELOCITY = 15;
    const ACCELERATION = 0.8;
    const DECELERATION = 0.92;
    const VELOCITY_THRESHOLD = 0.1;
    const TICK_TIMEOUT = 150;
    
    const animateScroll = () => {
      if (!storyContainerRef.current) return;
      
      const container = storyContainerRef.current;
      const now = Date.now();
      const timeSinceLastTick = now - lastTickTimeRef.current;
      
      if (scrollBufferRef.current.length > 0 && timeSinceLastTick < TICK_TIMEOUT) {
        const direction = scrollDirectionRef.current;
        scrollVelocityRef.current = Math.min(
          scrollVelocityRef.current + ACCELERATION,
          MAX_VELOCITY
        );
        
        if (Math.abs(scrollVelocityRef.current) > VELOCITY_THRESHOLD) {
          container.scrollTop += direction * scrollVelocityRef.current;
        }
        
        animationFrameRef.current = requestAnimationFrame(animateScroll);
      } else if (Math.abs(scrollVelocityRef.current) > VELOCITY_THRESHOLD) {
        scrollVelocityRef.current *= DECELERATION;
        const direction = scrollDirectionRef.current;
        container.scrollTop += direction * scrollVelocityRef.current;
        animationFrameRef.current = requestAnimationFrame(animateScroll);
      } else {
        scrollVelocityRef.current = 0;
        scrollDirectionRef.current = 0;
        scrollBufferRef.current = [];
        animationFrameRef.current = null;
      }
    };
    
    const handleScrollTick = (direction) => {
      const now = Date.now();
      scrollBufferRef.current.push({ time: now, direction });
      scrollBufferRef.current = scrollBufferRef.current.filter(
        tick => now - tick.time < 200
      );
      scrollDirectionRef.current = direction;
      lastTickTimeRef.current = now;
      
      if (scrollVelocityRef.current < BASE_VELOCITY) {
        scrollVelocityRef.current = BASE_VELOCITY;
      }
      
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(animateScroll);
      }
    };

    const handleScrollDown = (event) => {
      event.preventDefault();
      handleScrollTick(-1);
    };

    const handleScrollUp = (event) => {
      event.preventDefault();
      handleScrollTick(1);
    };

    window.addEventListener('scrollDown', handleScrollDown, { passive: false, capture: true });
    window.addEventListener('scrollUp', handleScrollUp, { passive: false, capture: true });
    document.addEventListener('scrollDown', handleScrollDown, { passive: false, capture: true });
    document.addEventListener('scrollUp', handleScrollUp, { passive: false, capture: true });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('scrollDown', handleScrollDown, { capture: true });
      window.removeEventListener('scrollUp', handleScrollUp, { capture: true });
      document.removeEventListener('scrollDown', handleScrollDown, { capture: true });
      document.removeEventListener('scrollUp', handleScrollUp, { capture: true });
    };
  }, [isStoryScrollMode]);

  // Handle wheel for panel navigation and movement menu
  useEffect(() => {
    const handleScroll = (isUp) => {
      if (showMovementMenu) {
        // Navigate the movement menu (9 options: 8 directions + cancel)
        setSelectedDirection(prev => {
          if (isUp) {
            return (prev + 1) % 9;
          } else {
            return (prev - 1 + 9) % 9;
          }
        });
      } else if (!isStoryScrollMode) {
        // Cycle through panels: 0=map, 1=stats, 2=story
        setSelectedPanel(prev => {
          if (isUp) {
            return (prev + 1) % 3;
          } else {
            return (prev - 1 + 3) % 3;
          }
        });
      }
      // If in story scroll mode, scrolling is handled by the story scroll effect
    };

    const handleScrollDown = (event) => {
      // Only prevent default if we're not in story scroll mode
      if (!isStoryScrollMode || showMovementMenu) {
        event.preventDefault();
        handleScroll(false);
      }
    };

    const handleScrollUp = (event) => {
      // Only prevent default if we're not in story scroll mode
      if (!isStoryScrollMode || showMovementMenu) {
        event.preventDefault();
        handleScroll(true);
      }
    };

    // Keyboard simulation: Arrow keys trigger scroll events
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        // Dispatch custom scrollUp event
        const scrollEvent = new Event('scrollUp', { bubbles: true, cancelable: true });
        window.dispatchEvent(scrollEvent);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        // Dispatch custom scrollDown event
        const scrollEvent = new Event('scrollDown', { bubbles: true, cancelable: true });
        window.dispatchEvent(scrollEvent);
      }
    };

    window.addEventListener('scrollDown', handleScrollDown, { passive: false, capture: true });
    window.addEventListener('scrollUp', handleScrollUp, { passive: false, capture: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scrollDown', handleScrollDown, { capture: true });
      window.removeEventListener('scrollUp', handleScrollUp, { capture: true });
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPanel, isStoryScrollMode, showMovementMenu]);

  // Handle button press (R1 side button)
  useEffect(() => {
    const handleButtonPress = (event) => {
      event.preventDefault();
      
      if (showMovementMenu) {
        // Confirm direction selection in movement menu (or cancel)
        movePlayer(directions[selectedDirection]);
      } else if (selectedPanel === 0) {
        // Map panel: open movement menu
        setShowMovementMenu(true);
        setSelectedDirection(0); // Reset to North
      } else if (selectedPanel === 2) {
        // Story panel: toggle scroll mode
        setIsStoryScrollMode(prev => !prev);
      }
      // Stats panel (selectedPanel === 1): do nothing for now
    };

    // Keyboard simulation: Space bar triggers button press
    const handleKeyDown = (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        // Dispatch custom buttonPress event
        const buttonEvent = new Event('buttonPress', { bubbles: true, cancelable: true });
        window.dispatchEvent(buttonEvent);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // R1 button event (if it exists)
    window.addEventListener('buttonPress', handleButtonPress, { passive: false, capture: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('buttonPress', handleButtonPress, { capture: true });
    };
  }, [selectedPanel, showMovementMenu, selectedDirection, directions, movePlayer]);

  const mapLines = renderMap();
  const currentTerrain = map[playerY][playerX];
  const terrainStats = getTerrainStats();
  const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });

  // Get terrain name
  const getTerrainName = (char) => {
    const names = { F: 'FOREST', P: 'PLAINS', R: 'RIVER', M: 'MOUNTAIN' };
    return names[char] || 'UNKNOWN';
  };

  return (
    <div className="viewport">
      <div className="App">
        {/* Header */}
        <div className="header">
          <div className="header-left">MUD-R1 v1.0</div>
          <div className="header-center">TERMINAL MONITOR</div>
          <div className="header-right">{currentTime}</div>
        </div>

        {/* Top Row - Map and Stats */}
        <div className="top-row">
          {/* Map Section */}
          <div className={`panel map-panel ${selectedPanel === 0 && !showMovementMenu ? 'selected' : ''}`}>
            <span className="panel-label">World Map</span>
            <div className="ascii-map">
              {mapLines.map((line, i) => (
                <div key={i} className="map-line">{line}</div>
              ))}
            </div>
            <div className="map-footer">
              Position: ({playerX},{playerY})
            </div>
          </div>

          {/* Stats Panel */}
          <div className={`panel stats-panel ${selectedPanel === 1 && !showMovementMenu ? 'selected' : ''}`}>
            <span className="panel-label">Status ({moveCount})</span>
            <div className="stats-content">
              <div className="stat-row">
                <span className="stat-label">TERRAIN:</span>
                <span className="stat-value">{getTerrainName(currentTerrain)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">MOVES:</span>
                <span className="stat-value">{moveCount}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-section-title">Visible Area:</div>
              <div className="terrain-bars">
                <div className="terrain-bar">
                  <span className="terrain-label">F</span>
                  <div className="bar-container">
                    <div className="bar-fill" style={{ width: `${(terrainStats.F / 25) * 100}%` }}></div>
                  </div>
                  <span className="terrain-count">{terrainStats.F}</span>
                </div>
                <div className="terrain-bar">
                  <span className="terrain-label">P</span>
                  <div className="bar-container">
                    <div className="bar-fill" style={{ width: `${(terrainStats.P / 25) * 100}%` }}></div>
                  </div>
                  <span className="terrain-count">{terrainStats.P}</span>
                </div>
                <div className="terrain-bar">
                  <span className="terrain-label">R</span>
                  <div className="bar-container">
                    <div className="bar-fill" style={{ width: `${(terrainStats.R / 25) * 100}%` }}></div>
                  </div>
                  <span className="terrain-count">{terrainStats.R}</span>
                </div>
                <div className="terrain-bar">
                  <span className="terrain-label">M</span>
                  <div className="bar-container">
                    <div className="bar-fill" style={{ width: `${(terrainStats.M / 25) * 100}%` }}></div>
                  </div>
                  <span className="terrain-count">{terrainStats.M}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Story Log */}
        <div className={`panel story-panel ${selectedPanel === 2 && !showMovementMenu && !isStoryScrollMode ? 'selected' : ''} ${isStoryScrollMode ? 'scroll-mode' : ''}`}>
          <span className="panel-label">Event Log ({storyHistory.length}){isStoryScrollMode ? ' [SCROLL]' : ''}</span>
          <div className="story-container" ref={storyContainerRef}>
            {storyHistory.map((entry, i) => (
              <div key={i} className="story-entry">
                <div className="story-header">
                  [{i + 1}] {entry.timestamp} - {entry.title}
                </div>
                <div className="story-content">{entry.content}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend Bar */}
        <div className="legend-bar">
          F=Forest | P=Plains | R=River | M=Mountain | @=You
        </div>

        {/* Movement Menu Popup */}
        {showMovementMenu && (
          <div className="movement-menu-overlay">
            <div className="movement-menu">
              <span className="panel-label">Movement Direction</span>
              <div className="direction-grid">
                {directions.map((dir, i) => (
                  <div
                    key={i}
                    className={`direction-option ${i === selectedDirection ? 'selected' : ''}`}
                  >
                    {dir.name}
                  </div>
                ))}
              </div>
              <div className="menu-footer">
                Select direction and press button to move
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
