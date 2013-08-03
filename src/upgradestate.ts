// Copyright (c) 2013 the Die, Yenu, Die! authors (see AUTHORS.txt for a full list)
// Licensed under the terms of the zlib license. See LICENSE.txt for the full license text.

// The upgrade (altar) menu state

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