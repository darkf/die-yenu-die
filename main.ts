// Base tile interface. All tiles implement this.

interface Tile {
	getImage() : heart.HeartImage;
	isSolid() : bool;
}

class Wall implements Tile {
	getImage() { return tile_top; }
	isSolid() { return true; }
}

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

class UpgradeStation implements Tile {
	getImage() { return tile_idk; }
	isSolid() { return false }
}

class Fireplace implements Tile {
	getImage() { return tile_fireplace; }
	isSolid() { return false }
}

class Door implements Tile {
	getImage() { return tile_door; }
	isSolid() { return false }
}

class Air implements Tile {
	getImage() : heart.HeartImage { return tile_wall; }
	isSolid() { return false }
}

// The game world map
// Tile cells are actually stacks of tiles, so that when another tile moves into it,
// such as an enemy, it doesn't remove it, just sits on top of it.

class Map {
	tiles : Tile[][];
	width : number;
	name : string;

	//isSolidAt(x:number) : bool;
	isSolidAt(x:number) {
		for(var i = 0; i < this.tiles[x].length; i++) {
			if(this.tiles[x][i].isSolid())
				return true;
		}
		return false;
	}

	tileAt(x:number) {
		return this.tiles[x][0];
	}

	pushTile(x:number, t:Tile) {
		this.tiles[x].unshift(t);
	}

	popTile(x:number) {
		return this.tiles[x].shift();
	}

	removeTile(x:number, tile:Tile) {
		var i = this.tiles[x].indexOf(tile);
		if(i == -1) {
			console.log("error: no tile");
			return;
		}
		this.tiles[x].splice(i, 1);
	}
}

// Parses a simple text format into a tilemap

class MapParser extends Map {
	constructor(name, map, level=1) {
		super();
		this.name = name;
		this.tiles = emptyTiles(map.length);
		this.width = map.length;
		for(var i = 0; i < map.length; i++) {
			switch(map[i]) {
				case '$': this.pushTile(i, new Zombie(i, level)); break;
				case 'U': this.pushTile(i, new UpgradeStation()); break;
				case 'F': this.pushTile(i, new Fireplace()); break;
				case 'D': this.pushTile(i, new Door()); break;
			}
		}
	}
}

function emptyTiles(width:number) {
	// Generate a list of `width` empty Air tiles
	var tiles : Tile[][] = [];
	for(var i = 0; i < width; i++)
		tiles[i] = [new Air()];
	return tiles;
}

function getRandomMap() {
	var width = 16 + Math.round(Math.random()*10);
	//if(width % 2 != 0) width++; // make width always even
	//var doorX = width - 1 - Math.floor(Math.random()*(width/4));
	var doorX = width-2;
	var maps = " ";
	var randMap = {" ": 0.875, "$": 0.125};

	function getRandomTile() : string {
		var r = Math.random();
		var sum = 0;
		for(var k in randMap) {
			sum += randMap[k];
			if(r < sum)
				return k;
		}
		console.log("???");
	}

	for(var i = 1; i < width; i++) {
		if(i == doorX) maps += "D";
		else maps += getRandomTile();
	}

	return maps;
}

class Camera {
	x : number = 0;
	get(x : number) {
		return x - this.x;
	}
	center(around_tile:number) {
		// center the camera
		this.x = around_tile*TILE_WIDTH - SCREEN_WIDTH/2;
	}
}

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

class Fireball extends Spell {
	constructor() {
		super("Fireball");
		this.type = "fire";
		this.range = 3;
		this.baseDamage = 50;
	}

	getEffectImage() { return effect_fire }
}

function newSpellList() : Spell[] {
	return [new Slash(), new Fireball()];
}

class Player extends Actor {
	x : number = 0;
	img : heart.HeartImage = null;
	xp : number = 975;
	upgradePoints : number = 1;

	constructor() {
		super(0);
		this.getSpell("Slash").level = 2;
	}

	getImage() { return this.img }

	damage(amount:number) {
		super.damage(amount);
		console.log("You take " + amount + " damage");
		if(!this.alive) {
			console.log("You are dead...");
		}
	}

	gainXP(amount:number) {
		this.xp += amount;
		if(this.xp >= this.getNextUpgradeXP()) {
			this.level++;
			this.upgradePoints++;
			console.log("level up");
		}
	}

	getNextUpgradeXP() {
		return Math.floor(Math.pow(this.level,1.5) * 1000);
	}
}

// Game States are basically scenes. The game uses a game state stack where multiple
// scenes can stack upon eachother. The play state (i.e. the world) is usually the
// bottom-most state. On top of it are usually menu states, like UpgradeState.

interface GameState {
	keydown(c:string);
	draw();
}

function pushState(state) { gameStates.unshift(state); }
function popState() { return gameStates.shift(); }

// The upgrade menu
class UpgradeState implements GameState {
	index : number = 0; // index of the menu item

	keydown(c:string) {
		switch(c) {
			case "escape":
			case "backspace":
			case "q":
				// back out of the menu
				popState();
				return;

			case "up":
				this.index--;
				if(this.index < 0) this.index = 0;
				break;
			case "down":
				this.index++;
				if(this.index >= player.spells.length) this.index--;
				break;
			case "u":
			case " ":
				// buy an upgade
				// todo: confirmation screen
				if(player.upgradePoints > 0) {
					var spell = player.spells[this.index];
					spell.level++;
					player.upgradePoints--;
					console.log("upgraded spell " + spell.name + " to level " + spell.level);
					popState();
				}
				break;
		}
	}

	draw() {
		var BASE_X = SCREEN_WIDTH/3;
		var BASE_Y = SCREEN_HEIGHT/2;
		heart.graphics.setColor(255, 255, 0);
		heart.graphics.print("What to buy? You have " + player.upgradePoints + " points", BASE_X, BASE_Y - 10);

		for(var i = 0; i < player.spells.length; i++) {
			heart.graphics.rectangle("stroke", BASE_X, BASE_Y+i*25, 150, 20);
			if(i == this.index) {
				heart.graphics.setColor(200, 200, 0);
				heart.graphics.rectangle("fill", BASE_X, BASE_Y+i*25, 150, 20);
				heart.graphics.setColor(255, 255, 0);
			}
			var spell = player.spells[i];
			var txt = spell.name;
			if(spell.level == 0) txt += " (learn)";
			else txt += " ("+spell.level+")";
			heart.graphics.print(txt, BASE_X + 150/2 - spell.name.length*3, BASE_Y+12+i*25);
		}
	}
}

class PlayState implements GameState {
	keydown(c:string) {
		// don't do anything if the player is dead
		if(!player.alive) return;

		// space (attack)
		if(c == " ") {
			for(var i = player.x; i < map.width; i++) {
				if(map.tileAt(i) instanceof Enemy) {
					var e = <Enemy> map.tileAt(i);
					if(!e.alive) continue;

					if(distance(i, player.x) <= player.spell.range) {
						//e.attacked(player);
						player.cast(e);
						break;
					}
				}
			}

			turn();
		}

		// go right
		if(c == "right") {
			turn();
			if(player.x+1 < map.width && !map.isSolidAt(player.x+1)) {
				player.x++;
				camera.center(player.x);
			}
		}
		// go left
		else if(c == "left") {
			turn();
			if(player.x-1 >= 0 && !map.isSolidAt(player.x-1)) {
				player.x--;
				camera.center(player.x);
			}
		}
		// use
		else if(c == "up") {
			if(map.tileAt(player.x) instanceof UpgradeStation) {
				console.log("upgrade...");
				pushState(new UpgradeState());
				return;
			}
			else if(map.tileAt(player.x) instanceof Fireplace) {
				// heal up
				player.heal(player.maxHealth-player.health);
				player.replinishMana(player.maxMana-player.mana);
			}
			else if(map.tileAt(player.x) instanceof Door) {
				if(map.name == "home") {
					// home -> new random dungeon
					dungeonLevel++;
					console.log("dungeon level = " + dungeonLevel);
					loadmap(new MapParser("randumb", getRandomMap(), dungeonLevel));
				}
				else {
					// anywhere -> home
					loadmap(_home);
				}
			}
		}
		// debug key to load a new randomly generated map
		else if(c == "i") {
			// debug - generate new random dungeon
			var rmap = getRandomMap();
			loadmap(new MapParser("randumb", rmap));
		}
	}

	draw() {
		var BASE_Y = SCREEN_HEIGHT / 2 - TILE_HEIGHT;

		for(var i = 0; i < map.width; i++) {
			heart.graphics.draw(tile_top, camera.get(i*TILE_WIDTH), BASE_Y);
			heart.graphics.draw(tile_top, camera.get(i*TILE_WIDTH), BASE_Y + TILE_HEIGHT*2);
		}

		for(var i = 0; i < map.width; i++) {
			var t = map.tileAt(i);
			if(t instanceof Actor)
				drawActor(<Actor>t, BASE_Y);
			else
				heart.graphics.draw(t.getImage(), camera.get(i*TILE_WIDTH), BASE_Y+TILE_HEIGHT);
		}

		// draw the player
		drawActor(player, BASE_Y);

		// draw UI
		heart.graphics.setColor(255, 255, 0);
		heart.graphics.print("level " + dungeonLevel, 10, 90);

		// health and mana bar
		var xp = player.getNextUpgradeXP();
		drawBar(10, 20, "HP: " + player.health + "/" + player.maxHealth, player.health, player.maxHealth);
		drawBar(10, 40, "MP: " + player.mana + "/" + player.maxMana, player.mana, player.maxMana, [0,0,200]);
		drawBar(10, 60, "XP: " + player.xp + "/" + xp, player.xp, xp, [0,200,0]);

		// todo: lighting
		/*
		var g = heart.ctx.createRadialGradient(SCREEN_WIDTH/2, SCREEN_HEIGHT/2, 0, SCREEN_WIDTH/2+16, SCREEN_HEIGHT/2+16, 360);
		g.addColorStop(0.10, "#ffffff");
		g.addColorStop(0.8, "rgba(0, 0, 0, .5)");
		heart.ctx.fillStyle = g;
		heart.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);*/
	}
}

function distance(x1:number, x2:number) {
	return Math.abs(x1-x2);
}

var player = new Player();
var _home = new MapParser("home",     "   F  U  D  ");
var _mapone = new MapParser("mapone", "  U $      $ $ U    D ");
var map = _mapone;
var dungeonLevel = 0;
var camera = new Camera();
var gameStates : GameState[] = [new PlayState()];
// todo: these assets should probably be in a dictionary
var tile_top : heart.HeartImage = null;
var tile_zombie : heart.HeartImage = null;
var tile_wall : heart.HeartImage = null;
var tile_idk : heart.HeartImage = null;
var tile_fireplace : heart.HeartImage = null;
var tile_door : heart.HeartImage = null;
var effect_slash : heart.HeartImage = null;
var effect_fire : heart.HeartImage = null;

var SCREEN_WIDTH, SCREEN_HEIGHT, TILE_WIDTH, TILE_HEIGHT;

heart.preload = function() {
	heart.graphics.newImage("assets/player.png", function(r) { player.img = r; TILE_WIDTH = r.img.width; TILE_HEIGHT = r.img.height; });
	heart.graphics.newImage("assets/top.png", function(r) { tile_top = r; });
	heart.graphics.newImage("assets/wall3.png", function(r) { tile_wall = r; });
	heart.graphics.newImage("assets/ankh1.png", function(r) { tile_idk = r; });
	heart.graphics.newImage("assets/zombie.png", function(r) { tile_zombie = r; });
	heart.graphics.newImage("assets/fire1.png", function(r) { tile_fireplace = r; });
	heart.graphics.newImage("assets/door.png", function(r) { tile_door = r; });
	heart.graphics.newImage("assets/slashdamage.png", function(r) { effect_slash = r; });
	heart.graphics.newImage("assets/firedamage.png", function(r) { effect_fire = r; });
}

heart.load = function() {
	heart.attach("cnv");
	SCREEN_WIDTH = heart.graphics.getWidth();
	SCREEN_HEIGHT = heart.graphics.getHeight();
	heart.timer.setTargetFPS(20);
	camera.center(player.x);
}

function loadmap(mapobj) {
	// load mapobj into the world
	player.x = 0;
	map = mapobj;
	camera.center(player.x);
}

function turn() {
	player.turn();

	for(var i = 0; i < map.width; i++) {
		var t = map.tiles[i][0];

		if(t instanceof Actor) (<Actor>t).turn();
	}
}

heart.keydown = function(c) {
	gameStates[0].keydown(c);
}

heart.update = function(dt) {
	// any animation-related code should go here
}

function drawActor(e:Actor, y:number) {
	if(!e.alive) {
		heart.graphics.push();
		var pos = {x: camera.get(e.x*TILE_WIDTH), y: y+TILE_HEIGHT};
		var hw = e.getImage().getWidth()/2;
		var hh = e.getImage().getHeight()/2;
		heart.graphics.translate(pos.x+hw, pos.y+hh);
		heart.graphics.rotate(90 * Math.PI/180);
		heart.graphics.draw(e.getImage(), -hw, -hh);
		var ef = e.getEffectImage();
		if(ef)
			heart.graphics.draw(ef, -hw, -hh);
		// apply slight red tint
		heart.graphics.setColor(255, 0, 0, 50);
		heart.graphics.rectangle("fill", -hw, -hh, TILE_WIDTH, TILE_HEIGHT);
		heart.graphics.pop();
	}
	else {
		heart.graphics.draw(e.getImage(), camera.get(e.x*TILE_WIDTH), y+TILE_HEIGHT);
		var ef = e.getEffectImage();
		if(ef)
			heart.graphics.draw(ef, camera.get(e.x*TILE_WIDTH), y+TILE_HEIGHT);
	}
}

function drawBar(x, y, text, value, max=100, color=[200,0,0], width=125) {
	var fillWidth = value/max*width;
	heart.graphics.setColor(0, 0, 0);
	heart.graphics.rectangle("stroke", x, y, width+1, 15+1);
	heart.graphics.setColor(color[0], color[1], color[2]);
	heart.graphics.rectangle("fill", x+1, y+1, fillWidth-1, 15-1);
	heart.graphics.setColor(255, 255, 255);
	heart.graphics.print(text, x + width/2 - text.length*3, y+11);
}

heart.draw = function() {
	gameStates[0].draw();

	heart.graphics.setColor(255, 255, 0);
	heart.graphics.print("fps: " + heart.timer.getFPS(), 10, 10);
}