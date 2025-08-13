# 10-Ball Tutorial Game

A comprehensive interactive tutorial game that teaches users the official CSI (Cuesports International) 10-Ball rules through multiple gameplay modes and interactive learning features.

## Features

### 🎓 Interactive Tutorial Mode
- **Step-by-step learning**: 8 comprehensive tutorial steps covering all aspects of 10-ball
- **Visual highlights**: Interactive table highlighting key concepts
- **Pro tips**: Contextual advice and strategy tips
- **Progress tracking**: Visual progress bar showing tutorial completion

### 🎮 Multiple Game Modes

1. **Practice Mode**
   - Solo practice with helpful hints
   - No pressure learning environment
   - Perfect for beginners

2. **vs Computer**
   - AI opponent with adjustable difficulty levels
   - Beginner, Intermediate, and Advanced settings
   - Realistic AI behavior and shot selection

3. **Local Multiplayer**
   - Two players on the same device
   - Perfect for learning together
   - Turn-based gameplay

4. **Online Multiplayer** (Future Feature)
   - Connect with players worldwide
   - Real-time competitive play
   - Global leaderboards

### 🎯 Official CSI Rules Implementation

- **Call Pocket**: Must specify ball and pocket before shooting
- **Push Out**: Available after legal break shot
- **Three Foul Rule**: Three consecutive fouls result in loss
- **Legal Shots**: Must hit lowest numbered ball first
- **Break Shot**: Must hit 1-ball first and drive 4+ balls to rail or pocket
- **10-Ball Money Ball**: Only legal 10-ball pocket wins the game

### 💡 Smart Hints & Tips System

- **Contextual hints**: Tips change based on game situation
- **Foul explanations**: Clear explanations of rule violations
- **Strategy advice**: Pro-level strategic tips
- **Difficulty-based guidance**: Hints adapt to player skill level

### 🎨 Modern UI/UX

- **Responsive design**: Works perfectly on desktop, tablet, and mobile
- **Beautiful animations**: Smooth transitions and visual feedback
- **Accessibility**: Clear visual indicators and easy navigation
- **Dark theme**: Easy on the eyes for extended play sessions

## How to Play

### Getting Started
1. Click the "🎱 Learn 10-Ball Rules & Play Tutorial Game" button on the main dashboard
2. Choose your preferred game mode
3. Select difficulty level (Beginner, Intermediate, Advanced)
4. Start with the Interactive Tutorial for best learning experience

### Tutorial Steps
1. **Welcome to 10-Ball**: Introduction to the game
2. **The Break Shot**: Learn proper break technique
3. **Legal Shots**: Understanding rotation rules
4. **Call Pocket**: Shot calling requirements
5. **Push Out**: Strategic push out opportunities
6. **Fouls**: Common fouls and penalties
7. **Three Foul Rule**: Consecutive foul consequences
8. **Winning the Game**: How to legally win

### Game Controls
- **Aiming**: Click and drag from cue ball to aim
- **Shot Power**: Distance of drag determines power
- **Call Shot**: Click ball, then click pocket (in call pocket mode)
- **Push Out**: Use push out button when available

## Technical Implementation

### Components Structure
```
src/components/tenball/
├── TenBallTutorial.jsx          # Main tutorial container
├── GameModeSelector.jsx         # Mode selection interface
├── TutorialRules.jsx            # Step-by-step tutorial display
├── TenBallTable.jsx             # Interactive pool table
├── TenBallGame.jsx              # Main game logic
└── *.module.css                 # Styling files
```

### Key Features
- **Canvas-based rendering**: Smooth 2D graphics for pool table
- **Physics simulation**: Realistic ball movement and collisions
- **State management**: Comprehensive game state tracking
- **Responsive design**: Mobile-first approach
- **Accessibility**: Screen reader friendly

### AI Implementation
- **Difficulty levels**: Adjustable AI skill and reaction time
- **Strategic decision making**: AI considers position and rules
- **Realistic behavior**: Mimics human player patterns

## Future Enhancements

### Planned Features
- **Online multiplayer**: Real-time competitive play
- **Tournament mode**: Bracket-style competitions
- **Statistics tracking**: Detailed player analytics
- **Customizable rules**: Adjustable rule sets
- **3D graphics**: Enhanced visual experience
- **Voice guidance**: Audio tutorial narration

### Technical Improvements
- **WebGL rendering**: Enhanced graphics performance
- **WebRTC integration**: Real-time multiplayer
- **Progressive Web App**: Offline capability
- **Analytics integration**: Player behavior tracking

## Contributing

This tutorial game is designed to be educational and accessible. Contributions are welcome for:
- Additional tutorial content
- UI/UX improvements
- Bug fixes and performance optimizations
- New game modes and features

## License

This project is part of the Front Range Pool League application and follows the same licensing terms.

---

**Enjoy learning 10-Ball!** 🎱✨ 