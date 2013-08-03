// Copyright (c) 2013 the Die, Yenu, Die! authors (see AUTHORS.txt for a full list)
// Licensed under the terms of the zlib license. See LICENSE.txt for the full license text.

// The main game play state

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