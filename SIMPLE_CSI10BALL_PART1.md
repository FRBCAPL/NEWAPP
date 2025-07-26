# SIMPLE CSI10Ball.jsx - PART 1

Create: `myapp2/frontend/src/components/CSI10Ball.jsx`

Copy this EXACTLY (Part 1 of 2):

```jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import table2 from "./PoolTableSVG/table2.svg";
import nineBall from "../assets/nineball.svg";
import tenBall from "../assets/tenball.svg";
import eightBall from "../assets/8ball.svg";
import cueBall from "../assets/cueball.svg";
import styles from "./modal/PinLogin.module.css";
import { CueStickOverlay } from "./CueStick";
import { PoolBallRenderer } from "./PoolBalls";

const BALLS = [
  { key: "cue", src: cueBall, alt: "Cue Ball", number: 0, type: "cue" },
  { key: "1", src: null, alt: "1 Ball", number: 1, type: "object" },
  { key: "2", src: null, alt: "2 Ball", number: 2, type: "object" },
  { key: "3", src: null, alt: "3 Ball", number: 3, type: "object" },
  { key: "4", src: null, alt: "4 Ball", number: 4, type: "object" },
  { key: "5", src: null, alt: "5 Ball", number: 5, type: "object" },
  { key: "6", src: null, alt: "6 Ball", number: 6, type: "object" },
  { key: "7", src: null, alt: "7 Ball", number: 7, type: "object" },
  { key: "8", src: eightBall, alt: "8 Ball", number: 8, type: "object" },
  { key: "9", src: nineBall, alt: "9 Ball", number: 9, type: "object" },
  { key: "10", src: tenBall, alt: "10 Ball", number: 10, type: "money" }
];

const TABLE_WIDTH = 600;
const TABLE_HEIGHT = 300;
const BALL_SIZE = 14;
const BALL_RADIUS = BALL_SIZE / 2;
const RAIL_WIDTH = 25;
const POCKET_RADIUS = 18;

const PHYSICS = {
  FRICTION: 0.985,
  ROLLING_FRICTION: 0.998,
  CUSHION_RESTITUTION: 0.85,
  BALL_RESTITUTION: 0.95,
  CLOTH_DRAG: 0.002,
  SPIN_DECAY: 0.99,
  MIN_VELOCITY: 0.05,
  MAX_VELOCITY: 25,
  CUE_TIP_FRICTION: 0.8
};

const CONTROLS = {
  MIN_POWER: 1,
  MAX_POWER: 20,
  ENGLISH_RANGE: 0.8,
  AIM_SENSITIVITY: 0.01,
  POWER_SENSITIVITY: 0.1
};

class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  
  add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
  subtract(v) { return new Vector2(this.x - v.x, this.y - v.y); }
  multiply(scalar) { return new Vector2(this.x * scalar, this.y * scalar); }
  dot(v) { return this.x * v.x + this.y * v.y; }
  length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  normalize() { 
    const len = this.length();
    return len > 0 ? new Vector2(this.x / len, this.y / len) : new Vector2(0, 0);
  }
}

class Ball {
  constructor(key, x, y, number, type) {
    this.key = key;
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
    this.spin = new Vector2(0, 0);
    this.topSpin = 0;
    this.number = number;
    this.type = type;
    this.visible = true;
    this.pocketed = false;
    this.radius = BALL_RADIUS;
    this.mass = 1.0;
  }

  update(deltaTime) {
    if (this.pocketed) return;

    this.velocity = this.velocity.add(this.spin.multiply(0.001));
    
    const speed = this.velocity.length();
    if (speed > PHYSICS.MIN_VELOCITY) {
      const frictionForce = this.spin.length() > 0.1 ? PHYSICS.FRICTION : PHYSICS.ROLLING_FRICTION;
      this.velocity = this.velocity.multiply(frictionForce);
      
      const dragForce = speed * PHYSICS.CLOTH_DRAG;
      const dragDirection = this.velocity.normalize().multiply(-dragForce);
      this.velocity = this.velocity.add(dragDirection);
    } else {
      this.velocity = new Vector2(0, 0);
    }

    this.spin = this.spin.multiply(PHYSICS.SPIN_DECAY);
    this.topSpin *= PHYSICS.SPIN_DECAY;

    this.position = this.position.add(this.velocity.multiply(deltaTime));

    this.handleRailCollisions();
  }

  handleRailCollisions() {
    const minX = RAIL_WIDTH + this.radius;
    const maxX = TABLE_WIDTH - RAIL_WIDTH - this.radius;
    const minY = RAIL_WIDTH + this.radius;
    const maxY = TABLE_HEIGHT - RAIL_WIDTH - this.radius;

    if (this.position.x < minX) {
      this.position.x = minX;
      this.velocity.x = Math.abs(this.velocity.x) * PHYSICS.CUSHION_RESTITUTION;
      this.spin.x *= -0.8;
    } else if (this.position.x > maxX) {
      this.position.x = maxX;
      this.velocity.x = -Math.abs(this.velocity.x) * PHYSICS.CUSHION_RESTITUTION;
      this.spin.x *= -0.8;
    }

    if (this.position.y < minY) {
      this.position.y = minY;
      this.velocity.y = Math.abs(this.velocity.y) * PHYSICS.CUSHION_RESTITUTION;
      this.spin.y *= -0.8;
    } else if (this.position.y > maxY) {
      this.position.y = maxY;
      this.velocity.y = -Math.abs(this.velocity.y) * PHYSICS.CUSHION_RESTITUTION;
      this.spin.y *= -0.8;
    }
  }

  isMoving() {
    return this.velocity.length() > PHYSICS.MIN_VELOCITY;
  }
}
```

**STOP HERE** - Don't copy more yet. Tell me if this part works, then I'll give you Part 2!