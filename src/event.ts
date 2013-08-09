// Copyright (c) 2013 the Die, Yenu, Die! authors (see AUTHORS.txt for a full list)
// Licensed under the terms of the zlib license. See LICENSE.txt for the full license text.

// A small event system

class EventManager {
	eventQueue : Object[] = [];
	eventHandlers : Object = {}; // map of event kind to a list of callbacks: ((event) => void)[]

	push(event) {
		return this.eventQueue.push(event);
	}

	dequeue() {
		return this.eventQueue.shift();
	}

	empty() {
		return this.eventQueue.length == 0;
	}

	handleAll() {
		while(!this.empty()) {
			this.handle(this.dequeue());
		}
	}

	// handle one event
	handle(evt) {
		var handlers = this.eventHandlers[evt.kind];
		if(handlers != undefined) {
			for(var i = 0; i < handlers.length; i++) {
				handlers[i](evt);
			}
		}
	}

	// register an event handler
	on(kind: string, handler: (Object) => void) {
		if(this.eventHandlers[kind] == undefined)
			this.eventHandlers[kind] = [];

		this.eventHandlers[kind].push(handler);
	}
}