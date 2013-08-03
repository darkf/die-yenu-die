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