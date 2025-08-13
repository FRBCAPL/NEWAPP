// Shared gameplay/table constants for the ten-ball component

export const TABLE_WIDTH = 600;
export const TABLE_HEIGHT = 300;

export const BALL_SIZE = 15;
export const BALL_RADIUS = BALL_SIZE / 2;

export const PLAYFIELD_OFFSET_X = 0;
export const PLAYFIELD_OFFSET_Y = 0;

// Pocket forgiveness factors (reduced for more realistic pocket size)
export const CORNER_MARGIN_FACTOR = 1.3; // slightly tight corners
export const SIDE_MARGIN_FACTOR = 0.9;   // tighter side pockets to prevent rail dribbles

// Kitchen area (behind the head string) - for break shots and ball-in-hand
export const KITCHEN_LEFT = 30;  // Start from the felt (not the rail)
export const KITCHEN_RIGHT = 160; // Head string position (middle diamond)
export const KITCHEN_TOP = 24.5;
export const KITCHEN_BOTTOM = 270.18;

// Spots
export const FOOT_SPOT_X = TABLE_WIDTH * 0.75; // Apex (front) spot where the rack's head ball sits
export const FOOT_SPOT_Y = TABLE_HEIGHT / 2;

// Pocket drop fudge factor (extra distance beyond pocket margin for a ball to be considered dropped)
// Smaller fudge = less forgiving pockets
export const POCKET_DROP_FUDGE = BALL_RADIUS * 0.1; // smaller allowance

// Approach constraints to prevent unrealistic rail-dribble drops
// Require the ball to be moving generally toward the pocket to be accepted
export const SIDE_POCKET_APPROACH_DOT = 0.7;   // cosine threshold (~45° cone)
export const CORNER_POCKET_APPROACH_DOT = 0.45; // slightly more permissive for corners
export const MIN_RADIAL_SPEED_TO_DROP = 0.05;   // minimum velocity component toward pocket

// Physics constants for ball movement and collisions
export const FRICTION = 0.99;           // Ball friction on felt
export const RAIL_FRICTION = 0.75;      // Friction when ball hits rails
export const CUSHION_BOUNCE = 0.75;     // Bounce factor when ball hits cushions
export const SPIN_DECAY = 0.95;         // How quickly spin decays
export const MAX_SPIN = 0.3;            // Maximum spin effect on ball movement
export const SPIN_TRANSFER = 0.8;       // How much spin transfers in collisions


