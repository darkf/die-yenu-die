// Copyright (c) 2013 the Die, Yenu, Die! authors (see AUTHORS.txt for a full list)
// Licensed under the terms of the zlib license. See LICENSE.txt for the full license text.

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
