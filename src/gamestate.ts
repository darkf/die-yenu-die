// Game States are basically scenes. The game uses a game state stack where multiple
// scenes can stack upon eachother. The play state (i.e. the world) is usually the
// bottom-most state. On top of it are usually menu states, like UpgradeState.

interface GameState {
	keydown(c:string);
	draw();
}

function pushState(state) { gameStates.unshift(state); }
function popState() { return gameStates.shift(); }