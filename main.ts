declare module heart {
	export var ctx : CanvasRenderingContext2D;

	export function attach(canvasID:string) : void;

	// overridable callbacks
	export function preload() : void;
	export function load() : void;
	export function keydown(char:string) : void;
	export function keyup(char:string) : void;
	export function update(dt:number) : void;
	export function draw() : void;

	export class HeartImage {
		img : HTMLImageElement;
		getWidth() : number;
		getHeight() : number;
	}

	// submodules
	export module graphics {
		export function setColor(r:number, g:number, b:number, a?:number) : void;
		export function rectangle(mode:string, x:number, y:number, w:number, h:number) : void;
		export function print(msg:string, x:number, y:number) : void;
		export function draw(drawable:HeartImage, x:number, y:number) : void;
		export function newImage(path:string, callback : (result:HeartImage) => void);
		export function getWidth() : number;
		export function getHeight() : number;
		export function push() : void;
		export function pop() : void;
		export function translate(x:number, y:number) : void;
		export function rotate(angle:number) : void;
	}

	export module timer {
		export function getFPS() : number;
		export function getTargetFPS() : number;
		export function setTargetFPS(fps : number) : void;
		export function getTime() : number;
	}
}

interface Tile {
	getImage() : heart.HeartImage;
	isSolid() : bool;
}

class Wall implements Tile {
	getImage() { return tile_top; }
	isSolid() { return true; }
}

class Actor implements Tile {
	x : number;
	maxHealth : number = 100;
	maxMana : number = 100;
	health : number = 100;
	mana : number = 100;
	alive : bool = true;
	spell : Spell = new Slash();
	spells : Spell[] = [];
	effectImg : heart.HeartImage = null;

	constructor(x:number) {
		this.x = x;
		this.spells = [this.spell];
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

	damage(amount:number) {
		this.health -= amount;
		if(this.health <= 0) {
			this.alive = false;
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
		this.damage(attacker.spell.getAttackDamage());
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
}

class Enemy extends Actor {
	constructor(x:number) {
		super(x);
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

class MapParser extends Map {
	constructor(name, map) {
		super();
		this.name = name;
		this.tiles = emptyTiles(map.length);
		this.width = map.length;
		for(var i = 0; i < map.length; i++) {
			switch(map[i]) {
				case '$': this.pushTile(i, new Zombie(i)); break;
				case 'U': this.pushTile(i, new UpgradeStation()); break;
				case 'F': this.pushTile(i, new Fireplace()); break;
				case 'D': this.pushTile(i, new Door()); break;
			}
		}
	}
}

function emptyTiles(width:number) {
	var tiles : Tile[][] = [];
	for(var i = 0; i < width; i++)
		tiles[i] = [new Air()];
	return tiles;
}

class Camera {
	x : number = 0;
	get(x : number) {
		return x - this.x;
	}
}

class Spell {
	name : string;
	type : string;
	range : number = 1;
	level : number = 1;
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

class Player extends Actor {
	x : number = 0;
	img : heart.HeartImage = null;

	constructor() {
		super(0);
		//this.spell = new Fireball();
		this.spell.level = 2;
		this.spells.push(new Fireball());
	}

	getImage() { return this.img }

	damage(amount:number) {
		super.damage(amount);
		console.log("You take " + amount + " damage");
		if(!this.alive) {
			console.log("You are dead...");
		}
	}
}

function pushState(state) { gameStates.unshift(state); }
function popState() { return gameStates.shift(); }

interface GameState {
	keydown(c:string);
	draw();
}

class UpgradeState implements GameState {
	index : number = 0;

	keydown(c:string) {
		switch(c) {
			case "escape":
			case "backspace":
			case "q":
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
				// todo: confirmation screen
				player.spells[this.index].level++;
				console.log("upgraded spell " + player.spells[this.index].name + " to level " + player.spells[this.index].level);
				popState();
				break;
		}
	}

	draw() {
		//heart.graphics.print("todo: upgrade menu", SCREEN_WIDTH/2, SCREEN_HEIGHT/2);
		var BASE_X = SCREEN_WIDTH/3;
		var BASE_Y = SCREEN_HEIGHT/2;
		heart.graphics.setColor(255, 255, 0);
		heart.graphics.print("What to upgrade?", BASE_X, BASE_Y - 10);

		for(var i = 0; i < player.spells.length; i++) {
			heart.graphics.rectangle("stroke", BASE_X, BASE_Y+i*25, 150, 20);
			if(i == this.index) {
				heart.graphics.setColor(200, 200, 0);
				heart.graphics.rectangle("fill", BASE_X, BASE_Y+i*25, 150, 20);
				heart.graphics.setColor(255, 255, 0);
			}
			heart.graphics.print(player.spells[i].name, BASE_X + 150/2 - player.spells[i].name.length*3, BASE_Y+12+i*25);
		}
	}
}

class PlayState implements GameState {
	keydown(c:string) {
		if(!player.alive) return;
		turn();

		if(c == "right") {
			if(player.x+1 < map.width && !map.isSolidAt(player.x+1)) {
				player.x++;
				center();
			}
		}
		else if(c == "left") {
			if(player.x-1 >= 0 && !map.isSolidAt(player.x-1)) {
				player.x--;
				center();
			}
		}
		else if(c == " ") {
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
		}
		else if(c == "up") {
			if(map.tileAt(player.x) instanceof UpgradeStation) {
				console.log("upgrade...");
				pushState(new UpgradeState());
				return;
			}
			else if(map.tileAt(player.x) instanceof Door) {
				if(map.name == "home") {
					loadmap(_mapone);
				}
				else {
					loadmap(_home);
				}
			}
		}
	}

	draw() {
		//heart.graphics.setColor(255, 255, 255)
		//heart.graphics.rectangle("fill", player.x, player.y, 100, 100);
		var BASE_Y = SCREEN_HEIGHT / 2 - TILE_HEIGHT;

		for(var i = 0; i < map.width; i++) {
			heart.graphics.draw(tile_top, camera.get(i*TILE_WIDTH), BASE_Y);
			heart.graphics.draw(tile_top, camera.get(i*TILE_WIDTH), BASE_Y + TILE_HEIGHT*2);
		}

		for(var i = 0; i < map.width; i++) {
			/*if(map.tiles[i].getImage() != null)
				heart.graphics.draw(map.tiles[i].getImage(), camera.get(i*TILE_WIDTH), BASE_Y+TILE_HEIGHT);
			else
				heart.graphics.draw(tile_wall, camera.get(i*TILE_WIDTH), BASE_Y+TILE_HEIGHT);*/
			var t = map.tileAt(i);
			if(t instanceof Actor)
				drawActor(<Actor>t, BASE_Y);
			else
				heart.graphics.draw(t.getImage(), camera.get(i*TILE_WIDTH), BASE_Y+TILE_HEIGHT);
		}

		drawActor(player, BASE_Y);

		// draw UI

		// health and mana bar
		drawBar(10, 20, "HP: " + player.health + "/" + player.maxHealth, player.health, player.maxHealth);
		drawBar(10, 40, "MP: " + player.mana + "/" + player.maxMana, player.mana, player.maxMana, [0,0,200]);

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
var _mapone = new MapParser("mapone", "   $  U   $ $ U    D ");
var map = _mapone;
var camera = new Camera();
var gameStates : GameState[] = [new PlayState()];
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
	center();
}

function center() {
	camera.x = player.x*TILE_WIDTH - SCREEN_WIDTH/2;
}

function loadmap(mapobj) {
	player.x = 0;
	map = mapobj;
	center();
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
	//player.x += player.speed * dt;
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
	heart.graphics.rectangle("fill", x+1, y+1, fillWidth, 15);
	heart.graphics.setColor(255, 255, 255);
	heart.graphics.print(text, x + width/2 - text.length*3, y+11);
}

heart.draw = function() {
	gameStates[0].draw();

	heart.graphics.setColor(255, 255, 0);
	heart.graphics.print("fps: " + heart.timer.getFPS(), 10, 10);
}