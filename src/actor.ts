// Copyright (c) 2013 the Die, Yenu, Die! authors (see AUTHORS.txt for a full list)
// Licensed under the terms of the zlib license. See LICENSE.txt for the full license text.

// Base actor class. Players and enemies inherit from this.

class Actor implements Tile {
	x : number;
	maxHealth : number = 100;
	maxMana : number = 100;
	health : number = 100;
	mana : number = 100;
	level : number;
	baseXPDrop : number = 25;
	alive : bool = true;
	spell : Spell = null;
	spells : Spell[] = [];
	effectImg : heart.HeartImage = null;

	constructor(x:number, level:number=1) {
		this.x = x;
		this.spells = newSpellList();
		this.spell = this.spells[0];
		this.level = level;
		this.maxHealth = 100 + 5*this.level
		this.health = this.maxHealth
	}

	isSolid() { return this.alive }
	getImage() : heart.HeartImage { return null }
	getEffectImage() : heart.HeartImage { return this.effectImg }

	move(to:number) {
		map.pushTile(to, this);
		map.removeTile(this.x, this);
		this.x = to;
	}

	turn() {
		this.effectImg = null;
	}

	die() {
		this.alive = false;
		// todo: drops
	}

	damage(amount:number) {
		this.health -= amount;
		if(this.health <= 0) {
			this.health = 0;
			this.die();
		}
	}

	heal(amount:number) {
		this.health += amount;
		if(this.health > this.maxHealth)
			this.health = this.maxHealth;
		//this.effectImg = effect_heal; // todo
	}

	consumeMana(amount : number) {
		this.mana -= Math.min(amount, this.mana);
	}

	replinishMana(amount : number) {
		this.mana += Math.min(this.maxMana-this.mana, amount);
		//this.effectImg = effect_replinish; // todo
	}

	attacked(attacker:Actor) {
		this.damage(attacker.getAttackDamage());
		var ef = attacker.spell.getEffectImage();
		if(ef)
			this.effectImg = ef;
	}

	cast(victim:Actor) {
		if(distance(this.x, victim.x) <= this.spell.range) {
			this.consumeMana(this.spell.getManaCost());
			victim.attacked(this);
			console.log("someone casted " + this.spell.name);
		}
	}

	getSpell(name:string) : Spell {
		for(var i = 0; i < this.spells.length; i++) {
			if(this.spells[i].name == name)
				return this.spells[i]
		}
		return null;
	}

	hasSpell(name:string) {
		var spell = this.getSpell(name);
		return spell != null && spell.level > 0
	}

	getAttackDamage() {
		return this.spell.getAttackDamage() + Math.round(2.5*this.level)
	}
}