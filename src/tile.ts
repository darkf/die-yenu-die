// Copyright (c) 2013 the Die, Yenu, Die! authors (see AUTHORS.txt for a full list)
// Licensed under the terms of the zlib license. See LICENSE.txt for the full license text.

// Contains code for tiles
// The tile_* assets are unfortunately defined in `main.ts` for now.

// Base tile interface. All tiles implement this.
interface Tile {
	getImage() : heart.HeartImage;
	isSolid() : bool;
}

// "Nothingness" tile
class Air implements Tile {
	getImage() : heart.HeartImage { return tile_wall; }
	isSolid() { return false }
}

// Top ceiling wals
class Wall implements Tile {
	getImage() { return tile_top; }
	isSolid() { return true; }
}

// Upgrade stations (altars)
class UpgradeStation implements Tile {
	getImage() { return tile_idk; }
	isSolid() { return false }
}

// Fireplaces (healing stations)
class Fireplace implements Tile {
	getImage() { return tile_fireplace; }
	isSolid() { return false }
}

// Doors (to the hub or another dungeon)
class Door implements Tile {
	getImage() { return tile_door; }
	isSolid() { return false }
}
