// Copyright (c) 2013 the Die, Yenu, Die! authors (see AUTHORS.txt for a full list)
// Licensed under the terms of the zlib license. See LICENSE.txt for the full license text.

// Contains definitions and logic for enemies

// Base enemy class

class Enemy extends Actor {
	constructor(x:number, level:number=1) {
		super(x, level);
	}

	getXPDropped() {
		return this.level * this.baseXPDrop
	}

	die() {
		super.die();
		player.gainXP(this.getXPDropped());
	}

	turn() {
		super.turn();
		if(!this.alive) return;

		// see if we can attack the player
		if(distance(this.x, player.x) <= this.spell.range) {
				//player.attacked(this);
				this.cast(player);
		}
		else {
			// move enemies left towards player
			if(this.x > 0 && !map.tiles[this.x-1][0].isSolid() && player.x != this.x-1) {
				this.move(this.x-1);
			}
		}
	}
}

// Enemies in the game

class Zombie extends Enemy {
	getImage() { return tile_zombie; }
}