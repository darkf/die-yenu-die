// Player definition and related logic

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