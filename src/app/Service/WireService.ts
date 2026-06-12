import { Injectable } from '@angular/core';
import { Wire }       from '../Model/Wire';

@Injectable({ providedIn: 'root' })
export class WireService {
	wires: Wire[] = [];

	addWire(wire: Wire) {
		this.wires.push(wire);
	}
}