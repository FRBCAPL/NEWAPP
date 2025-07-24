// 🎱 PROFESSIONAL PHYSICS ENGINE
// Tournament-grade physics simulation for realistic pool ball behavior

export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  
  static fromAngle(angle, magnitude = 1) {
    return new Vector2(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
  }
  
  add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
  subtract(v) { return new Vector2(this.x - v.x, this.y - v.y); }
  multiply(scalar) { return new Vector2(this.x * scalar, this.y * scalar); }
  divide(scalar) { return scalar !== 0 ? new Vector2(this.x / scalar, this.y / scalar) : new Vector2(0, 0); }
  dot(v) { return this.x * v.x + this.y * v.y; }
  
  length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  lengthSquared() { return this.x * this.x + this.y * this.y; }
  
  normalize() { 
    const len = this.length();
    return len > 0 ? this.divide(len) : new Vector2(0, 0);
  }
  
  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }
  
  perpendicular() { return new Vector2(-this.y, this.x); }
  
  distanceTo(v) { return this.subtract(v).length(); }
  
  lerp(target, t) {
    return this.add(target.subtract(this).multiply(t));
  }
  
  clone() { return new Vector2(this.x, this.y); }
}

// Professional Physics Constants
export const PHYSICS = {
  // Friction coefficients
  CLOTH_FRICTION: 0.98,           // Rolling friction on felt
  SLIDING_FRICTION: 0.85,         // Sliding friction (with spin)
  RAIL_RESTITUTION: 0.85,         // Energy retained after rail bounce
  BALL_RESTITUTION: 0.95,         // Energy retained after ball collision
  
  // Spin and drag
  SPIN_FRICTION: 0.99,            // Spin decay rate
  AIR_RESISTANCE: 0.999,          // Air drag
  CLOTH_DRAG: 0.002,              // Table cloth drag
  
  // Thresholds
  MIN_VELOCITY: 0.05,             // Stop threshold
  MAX_VELOCITY: 30,               // Speed limit
  MIN_SPIN: 0.01,                 // Spin stop threshold
  
  // Table physics
  GRAVITY: 9.81,                  // Not used but realistic
  BALL_MASS: 0.17,                // kg (real pool ball mass)
  
  // Advanced physics
  MAGNUS_EFFECT: 0.15,            // Spin curve effect
  THROW_EFFECT: 0.1,              // Ball deflection from spin
  SQUIRT_EFFECT: 0.05             // Cue ball deflection
};

export class PhysicsBall {
  constructor(id, x, y, radius = 7) {
    this.id = id;
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
    this.lastPosition = new Vector2(x, y);
    
    // Spin components
    this.topSpin = 0;               // Forward/backward
    this.sideSpin = 0;              // Left/right english
    this.spinAxis = new Vector2(0, 0); // 2D representation of 3D spin
    
    // Physical properties
    this.radius = radius;
    this.mass = PHYSICS.BALL_MASS;
    this.restitution = PHYSICS.BALL_RESTITUTION;
    
    // State
    this.isActive = true;
    this.isPocketed = false;
    this.lastCollisionTime = 0;
    
    // Visual
    this.rotation = 0;              // Visual rotation angle
    this.trail = [];                // Motion trail for effects
  }
  
  update(deltaTime) {
    if (!this.isActive || this.isPocketed) return;
    
    this.lastPosition = this.position.clone();
    
    // Apply Magnus effect (spin causes curve)
    if (this.sideSpin !== 0) {
      const magnusForce = new Vector2(-this.velocity.y, this.velocity.x)
        .normalize()
        .multiply(this.sideSpin * PHYSICS.MAGNUS_EFFECT);
      this.velocity = this.velocity.add(magnusForce.multiply(deltaTime));
    }
    
    // Apply friction based on motion type
    const speed = this.velocity.length();
    if (speed > PHYSICS.MIN_VELOCITY) {
      const isSliding = Math.abs(this.topSpin) > 0.1 || Math.abs(this.sideSpin) > 0.1;
      const frictionCoeff = isSliding ? PHYSICS.SLIDING_FRICTION : PHYSICS.CLOTH_FRICTION;
      
      // Apply rolling/sliding friction
      this.velocity = this.velocity.multiply(Math.pow(frictionCoeff, deltaTime));
      
      // Apply cloth drag (speed dependent)
      const dragForce = speed * PHYSICS.CLOTH_DRAG * deltaTime;
      const dragDirection = this.velocity.normalize().multiply(-dragForce);
      this.velocity = this.velocity.add(dragDirection);
      
      // Apply air resistance
      this.velocity = this.velocity.multiply(Math.pow(PHYSICS.AIR_RESISTANCE, deltaTime));
    } else {
      this.velocity = new Vector2(0, 0);
    }
    
    // Update spin (decays over time)
    this.topSpin *= Math.pow(PHYSICS.SPIN_FRICTION, deltaTime);
    this.sideSpin *= Math.pow(PHYSICS.SPIN_FRICTION, deltaTime);
    this.spinAxis = this.spinAxis.multiply(Math.pow(PHYSICS.SPIN_FRICTION, deltaTime));
    
    // Stop tiny spins
    if (Math.abs(this.topSpin) < PHYSICS.MIN_SPIN) this.topSpin = 0;
    if (Math.abs(this.sideSpin) < PHYSICS.MIN_SPIN) this.sideSpin = 0;
    
    // Update position
    this.position = this.position.add(this.velocity.multiply(deltaTime));
    
    // Update visual rotation based on movement
    if (speed > 0) {
      const rollDistance = speed * deltaTime;
      this.rotation += rollDistance / this.radius; // Convert linear to angular
    }
    
    // Limit velocity
    if (this.velocity.length() > PHYSICS.MAX_VELOCITY) {
      this.velocity = this.velocity.normalize().multiply(PHYSICS.MAX_VELOCITY);
    }
    
    // Update trail for visual effects
    this.updateTrail();
  }
  
  updateTrail() {
    this.trail.push({
      position: this.position.clone(),
      time: Date.now(),
      alpha: 1.0
    });
    
    // Keep trail short and fade old points
    const now = Date.now();
    this.trail = this.trail.filter(point => now - point.time < 500);
    this.trail.forEach(point => {
      const age = now - point.time;
      point.alpha = Math.max(0, 1 - age / 500);
    });
  }
  
  applyCueHit(direction, power, english = { x: 0, y: 0 }) {
    // Apply initial velocity
    this.velocity = direction.normalize().multiply(power);
    
    // Apply english (spin)
    this.sideSpin = english.x * 2.0;  // Side spin
    this.topSpin = english.y * 2.0;   // Top/back spin
    
    // Squirt effect - cue ball deflection from english
    if (english.x !== 0) {
      const squirtAngle = english.x * PHYSICS.SQUIRT_EFFECT;
      this.velocity = this.velocity.rotate(squirtAngle);
    }
    
    this.spinAxis = new Vector2(english.x, english.y);
  }
  
  handleRailCollision(railNormal, tableWidth, tableHeight, railWidth) {
    const buffer = this.radius + 2;
    let collision = false;
    
    // Check collisions with each rail
    if (this.position.x < railWidth + buffer) {
      this.position.x = railWidth + buffer;
      this.velocity.x = Math.abs(this.velocity.x) * PHYSICS.RAIL_RESTITUTION;
      this.sideSpin *= -0.7; // Reverse and dampen side spin
      collision = true;
    }
    else if (this.position.x > tableWidth - railWidth - buffer) {
      this.position.x = tableWidth - railWidth - buffer;
      this.velocity.x = -Math.abs(this.velocity.x) * PHYSICS.RAIL_RESTITUTION;
      this.sideSpin *= -0.7;
      collision = true;
    }
    
    if (this.position.y < railWidth + buffer) {
      this.position.y = railWidth + buffer;
      this.velocity.y = Math.abs(this.velocity.y) * PHYSICS.RAIL_RESTITUTION;
      this.topSpin *= -0.7; // Reverse and dampen top spin
      collision = true;
    }
    else if (this.position.y > tableHeight - railWidth - buffer) {
      this.position.y = tableHeight - railWidth - buffer;
      this.velocity.y = -Math.abs(this.velocity.y) * PHYSICS.RAIL_RESTITUTION;
      this.topSpin *= -0.7;
      collision = true;
    }
    
    return collision;
  }
  
  isMoving() {
    return this.velocity.length() > PHYSICS.MIN_VELOCITY || 
           Math.abs(this.topSpin) > PHYSICS.MIN_SPIN || 
           Math.abs(this.sideSpin) > PHYSICS.MIN_SPIN;
  }
  
  getKineticEnergy() {
    return 0.5 * this.mass * this.velocity.lengthSquared();
  }
}

export class CollisionDetector {
  static checkBallCollision(ball1, ball2) {
    const distance = ball1.position.distanceTo(ball2.position);
    const minDistance = ball1.radius + ball2.radius;
    
    if (distance < minDistance && distance > 0) {
      return {
        occurred: true,
        overlap: minDistance - distance,
        normal: ball2.position.subtract(ball1.position).normalize(),
        distance: distance
      };
    }
    
    return { occurred: false };
  }
  
  static resolveBallCollision(ball1, ball2, collision) {
    const { overlap, normal } = collision;
    
    // Separate balls
    const separation = normal.multiply(overlap * 0.5);
    ball1.position = ball1.position.subtract(separation);
    ball2.position = ball2.position.add(separation);
    
    // Calculate relative velocity
    const relativeVelocity = ball1.velocity.subtract(ball2.velocity);
    const velocityAlongNormal = relativeVelocity.dot(normal);
    
    // Don't resolve if balls are separating
    if (velocityAlongNormal > 0) return;
    
    // Calculate collision response
    const totalMass = ball1.mass + ball2.mass;
    const restitution = Math.min(ball1.restitution, ball2.restitution);
    
    const impulse = -(1 + restitution) * velocityAlongNormal / totalMass;
    const impulseVector = normal.multiply(impulse);
    
    // Apply impulse to velocities
    ball1.velocity = ball1.velocity.add(impulseVector.multiply(ball2.mass));
    ball2.velocity = ball2.velocity.subtract(impulseVector.multiply(ball1.mass));
    
    // Advanced: Transfer spin based on collision
    this.transferSpin(ball1, ball2, normal, velocityAlongNormal);
    
    // Mark collision time
    const now = Date.now();
    ball1.lastCollisionTime = now;
    ball2.lastCollisionTime = now;
  }
  
  static transferSpin(ball1, ball2, normal, relativeSpeed) {
    // Simplified spin transfer - in reality this is very complex
    const spinTransferRate = 0.3;
    const tangent = normal.perpendicular();
    
    // Calculate tangential velocities
    const tangent1 = ball1.velocity.dot(tangent);
    const tangent2 = ball2.velocity.dot(tangent);
    
    // Transfer some spin based on relative tangential motion
    const spinTransfer = (tangent1 - tangent2) * spinTransferRate;
    
    ball1.sideSpin += spinTransfer * 0.1;
    ball2.sideSpin -= spinTransfer * 0.1;
    
    // Throw effect - balls curve slightly after collision due to spin
    if (Math.abs(ball1.sideSpin) > 0.1) {
      const throwDirection = tangent.multiply(ball1.sideSpin * PHYSICS.THROW_EFFECT);
      ball2.velocity = ball2.velocity.add(throwDirection);
    }
  }
}

export default { Vector2, PHYSICS, PhysicsBall, CollisionDetector };