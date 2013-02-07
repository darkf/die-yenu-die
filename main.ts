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
	}

	// submodules
	export module graphics {
		export function setColor(r:number, g:number, b:number) : void;
		export function rectangle(mode:string, x:number, y:number, w:number, h:number) : void;
		export function print(msg:string, x:number, y:number) : void;
		export function draw(drawable:HeartImage, x:number, y:number) : void;
		export function newImage(path:string, callback : (result:HeartImage) => void);
		export function getWidth() : number;
		export function getHeight() : number;
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
}

class Wall implements Tile {
	getImage() {
		return tile_top;
	}
}

class Zombie implements Tile {
	getImage() {
		return tile_zombie;
	}
}

class Idk implements Tile {
	getImage() {
		return tile_idk;
	}
}

class Map {
	tiles : Tile[];
	width : number;

	constructor() {
		this.tiles = [];

		var map = "   $  %   $  %   $  ";
		for(var i = 0; i < map.length; i++) {
			if(map[i] == '$') this.tiles.push(new Zombie());
			else if(map[i] == '%') this.tiles.push(new Idk());
			else this.tiles.push(null);
		}
		this.width = this.tiles.length;
	}
}

class Camera {
	x : number = 0;
	get(x : number) {
		return x - this.x;
	}
}

class Player {
	x : number = 0;
	img : heart.HeartImage = null;
}

var player = new Player();
var map = new Map();
var camera = new Camera();
var tile_top : heart.HeartImage = null;
var tile_zombie : heart.HeartImage = null;
var tile_wall : heart.HeartImage = null;
var tile_idk : heart.HeartImage = null;

var SCREEN_WIDTH, SCREEN_HEIGHT, TILE_WIDTH, TILE_HEIGHT;

heart.preload = function() {
	heart.graphics.newImage("assets/player.png", function(r) { player.img = r; TILE_WIDTH = r.img.width; TILE_HEIGHT = r.img.height; });
	heart.graphics.newImage("assets/top.png", function(r) { tile_top = r; });
	heart.graphics.newImage("assets/wall3.png", function(r) { tile_wall = r; });
	heart.graphics.newImage("assets/idk.png", function(r) { tile_idk = r; });
	heart.graphics.newImage("assets/zombie.png", function(r) { tile_zombie = r; });
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

heart.keydown = function(c) {
	if(c == "right") {
		player.x++;
		center();
	}
	else if(c == "left") {
		player.x--;
		center();
	}
	else if(c == " ") {
		for(var i = player.x; i < map.width; i++) {
			if(map.tiles[i] instanceof Zombie) {
				map.tiles[i] = null; // obliterated!
				break;
			}
		}
	}

	for(var i = 0; i < map.width; i++) {
		if(map.tiles[i] instanceof Zombie && i > 0 && map.tiles[i-1] == null && player.x != i-1) {
			var t = map.tiles[i-1];
			map.tiles[i-1] = map.tiles[i];
			map.tiles[i] = t;
		}
	}
}

heart.update = function(dt) {
	//player.x += player.speed * dt;
}

heart.draw = function() {
	//heart.graphics.setColor(255, 255, 255)
	//heart.graphics.rectangle("fill", player.x, player.y, 100, 100);
	var BASE_Y = SCREEN_HEIGHT / 2 - TILE_HEIGHT;

	for(var i = 0; i < map.width; i++) {
		heart.graphics.draw(tile_top, camera.get(i*TILE_WIDTH), BASE_Y);
		heart.graphics.draw(tile_top, camera.get(i*TILE_WIDTH), BASE_Y + TILE_HEIGHT*2);
	}

	for(var i = 0; i < map.width; i++) {
		if(map.tiles[i] != null)
			heart.graphics.draw(map.tiles[i].getImage(), camera.get(i*TILE_WIDTH), BASE_Y+TILE_HEIGHT);
		else
			heart.graphics.draw(tile_wall, camera.get(i*TILE_WIDTH), BASE_Y+TILE_HEIGHT);
	}

	heart.graphics.draw(player.img, camera.get(player.x*TILE_WIDTH), BASE_Y + TILE_HEIGHT);

	// todo: lighting
	/*
	var g = heart.ctx.createRadialGradient(SCREEN_WIDTH/2, SCREEN_HEIGHT/2, 0, SCREEN_WIDTH/2+16, SCREEN_HEIGHT/2+16, 360);
	g.addColorStop(0.10, "#ffffff");
	g.addColorStop(0.8, "rgba(0, 0, 0, .5)");
	heart.ctx.fillStyle = g;
	heart.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);*/

	heart.graphics.setColor(255, 255, 0);
	heart.graphics.print("fps: " + heart.timer.getFPS(), 10, 10);
}