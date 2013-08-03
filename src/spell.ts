// Copyright (c) 2013 the Die, Yenu, Die! authors (see AUTHORS.txt for a full list)
// Licensed under the terms of the zlib license. See LICENSE.txt for the full license text.

// Definitions for Spells and related

// Base Spell class that all spells inherit from

class Spell {
	name : string;
	type : string;
	range : number = 1;
	level : number = 0;
	baseDamage : number;

	constructor(name:string) {
		this.name = name;
	}
	
	getEffectImage() : heart.HeartImage { return null }

	getAttackDamage() {
		return this.baseDamage * this.level
	}

	getManaCost() {
		return this.level/2 * 10
	}
}

// Slash spell used by melee weapons

class Slash extends Spell {
	constructor() {
		super("Slash");
		this.type = "blade";
		this.level = 1; // start with it by default
		this.range = 1;
		this.baseDamage = 25;
	}

	getEffectImage() { return effect_slash }
}

// Basic Fireball

class Fireball extends Spell {
	constructor() {
		super("Fireball");
		this.type = "fire";
		this.range = 3;
		this.baseDamage = 50;
	}

	getEffectImage() { return effect_fire }
}

// This is a list of instances of all spells (TODO: why do we need this?)

function newSpellList() : Spell[] {
	return [new Slash(), new Fireball()];
}