import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { generateMap, getTileStory, TERRAIN, MAP_SIZE } from './mapData';

function App() {
  // Game state
  const [map] = useState(generateMap());
  const [playerX, setPlayerX] = useState(7); // Start in the middle
  const [playerY, setPlayerY] = useState(7);
  const [selectedSection, setSelectedSection] = useState('map'); // 'map' or 'story'
  const [showMovementMenu, setShowMovementMenu] = useState(false);
  const [selectedDirection, setSelectedDirection] = useState(0); // 0-7 for 8 directions
  const [storyHistory, setStoryHistory] = useState([]);
  
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

  // Directions: N, NE, E, SE, S, SW, W, NW
  const directions = [
    { name: 'N', dx: 0, dy: -1 },
    { name: 'NE', dx: 1, dy: -1 },
    { name: 'E', dx: 1, dy: 0 },
    { name: 'SE', dx: 1, dy: 1 },
    { name: 'S', dx: 0, dy: 1 },
    { name: 'SW', dx: -1, dy: 1 },
    { name: 'W', dx: -1, dy: 0 },
    { name: 'NW', dx: -1, dy: -1 }
  ];

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
    const newX = playerX + direction.dx;
    const newY = playerY + direction.dy;
    
    // Check bounds
    if (newX >= 0 && newX < MAP_SIZE && newY >= 0 && newY < MAP_SIZE) {
      setPlayerX(newX);
      setPlayerY(newY);
      
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

  // Smooth scrolling for story section (when selected)
  useEffect(() => {
    if (selectedSection !== 'story') return;

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
  }, [selectedSection]);

  // Handle wheel for section selection and movement menu
  useEffect(() => {
    const handleScroll = (isUp) => {
      if (showMovementMenu) {
        // Navigate the radial menu
        setSelectedDirection(prev => {
          if (isUp) {
            return (prev + 1) % 8;
          } else {
            return (prev - 1 + 8) % 8;
          }
        });
      } else if (selectedSection !== 'story') {
        // Toggle between map and story sections
        setSelectedSection(prev => prev === 'map' ? 'story' : 'map');
      }
      // If story is selected and menu not open, scrolling is handled by the story scroll effect
    };

    const handleScrollDown = (event) => {
      if (selectedSection !== 'story' || showMovementMenu) {
        event.preventDefault();
        handleScroll(false);
      }
    };

    const handleScrollUp = (event) => {
      if (selectedSection !== 'story' || showMovementMenu) {
        event.preventDefault();
        handleScroll(true);
      }
    };

    window.addEventListener('scrollDown', handleScrollDown, { passive: false, capture: true });
    window.addEventListener('scrollUp', handleScrollUp, { passive: false, capture: true });

    return () => {
      window.removeEventListener('scrollDown', handleScrollDown, { capture: true });
      window.removeEventListener('scrollUp', handleScrollUp, { capture: true });
    };
  }, [selectedSection, showMovementMenu]);

  // Handle button press (R1 side button)
  useEffect(() => {
    const handleButtonPress = (event) => {
      event.preventDefault();
      
      if (showMovementMenu) {
        // Confirm direction selection
        movePlayer(directions[selectedDirection]);
      } else if (selectedSection === 'map') {
        // Open movement menu
        setShowMovementMenu(true);
        setSelectedDirection(0); // Reset to North
      }
      // If story section is selected and no menu, do nothing (allow scrolling only)
    };

    // Listen for Enter key, Space, and click as button press
    const handleKeyDown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        handleButtonPress(event);
      }
    };

    const handleClick = (event) => {
      handleButtonPress(event);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick);
    
    // R1 button event (if it exists)
    window.addEventListener('buttonPress', handleButtonPress, { passive: false, capture: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClick);
      window.removeEventListener('buttonPress', handleButtonPress, { capture: true });
    };
  }, [selectedSection, showMovementMenu, selectedDirection, directions, movePlayer]);

  const mapLines = renderMap();
  const currentTerrain = map[playerY][playerX];

  return (
    <div className="viewport">
      <div className="App">
        <div className="version">v1.0</div>
        
        {/* Map Section */}
        <div className={`map-section ${selectedSection === 'map' ? 'selected' : ''}`}>
          <div className="section-title">MAP [{playerX},{playerY}]</div>
          <div className="ascii-map">
            {mapLines.map((line, i) => (
              <div key={i} className="map-line">{line}</div>
            ))}
          </div>
          <div className="map-legend">
            F=Forest  P=Plains  R=River  @=You
          </div>
        </div>

        {/* Story Section */}
        <div className={`story-section ${selectedSection === 'story' ? 'selected' : ''}`}>
          <div className="section-title">STORY LOG</div>
          <div className="story-container" ref={storyContainerRef}>
            {storyHistory.map((entry, i) => (
              <div key={i} className="story-entry">
                <div className="story-header">
                  [{entry.timestamp}] {entry.title}
                </div>
                <div className="story-content">{entry.content}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Movement Menu Popup */}
        {showMovementMenu && (
          <div className="movement-menu-overlay">
            <div className="movement-menu">
              <div className="menu-title">SELECT DIRECTION</div>
              <div className="radial-menu">
                {directions.map((dir, i) => (
                  <div
                    key={i}
                    className={`direction-option ${i === selectedDirection ? 'selected' : ''}`}
                  >
                    {dir.name}
                  </div>
                ))}
              </div>
              <div className="menu-hint">Press button to move</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

