// Shared gameplay/table constants for the ten-ball component

export const TABLE_WIDTH = 600;
export const TABLE_HEIGHT = 300;

export const BALL_SIZE = 15;
export const BALL_RADIUS = BALL_SIZE / 2;

export const PLAYFIELD_OFFSET_X = 0;
export const PLAYFIELD_OFFSET_Y = 0;

// Pocket forgiveness factors
export const CORNER_MARGIN_FACTOR = 3.2; // More forgiving corner pockets for easier aiming
export const SIDE_MARGIN_FACTOR = 2.5;   // More forgiving side pockets - allow balls to go in

// Kitchen area (behind the head string) - for break shots and ball-in-hand
export const KITCHEN_LEFT = 30;  // Start from the felt (not the rail)
export const KITCHEN_RIGHT = 160; // Head string position (middle diamond)
export const KITCHEN_TOP = 24.5;
export const KITCHEN_BOTTOM = 270.18;

// Spots
export const FOOT_SPOT_X = TABLE_WIDTH * 0.75; // Apex (front) spot where the rack's head ball sits
export const FOOT_SPOT_Y = TABLE_HEIGHT / 2;


