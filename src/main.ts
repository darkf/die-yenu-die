// Copyright (c) 2013 the Die, Yenu, Die! authors (see AUTHORS.txt for a full list)
// Licensed under the terms of the zlib license. See LICENSE.txt for the full license text.

// This is the main file. It handles setting up the game and loading assets.

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
// TODO: we should probably have an asset pipeline (like a dictionary with getAsset() or something)
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
	heart.timer.setTargetFPS(20); // set a fixed 20 FPS
	camera.center(player.x);
}

function loadmap(mapobj) {
	// load a new map (mapobj) into the world
	player.x = 0;
	map = mapobj;
	camera.center(player.x);
}

// advance one turn
function turn() {
	player.turn(); // player goes first

	for(var i = 0; i < map.width; i++) {
		var t = map.tiles[i][0];

		if(t instanceof Actor) (<Actor>t).turn();
	}
}

// drawn an actor to the screen
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

// draw a progress bar to the screen
function drawBar(x, y, text, value, max=100, color=[200,0,0], width=125) {
	var fillWidth = value/max*width;
	heart.graphics.setColor(0, 0, 0);
	heart.graphics.rectangle("stroke", x, y, width+1, 15+1);
	heart.graphics.setColor(color[0], color[1], color[2]);
	heart.graphics.rectangle("fill", x+1, y+1, fillWidth-1, 15-1);
	heart.graphics.setColor(255, 255, 255);
	heart.graphics.print(text, x + width/2 - text.length*3, y+11);
}

// heart.js callbacks to implement game logic and drawing

heart.keydown = function(c) {
	gameStates[0].keydown(c);
}

heart.update = function(dt) {
	// any animation-related code should go here
}

heart.draw = function() {
	gameStates[0].draw();

	heart.graphics.setColor(255, 255, 0);
	heart.graphics.print("fps: " + heart.timer.getFPS(), 10, 10);
}