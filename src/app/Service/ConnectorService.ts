import { Injectable } from '@angular/core';
import { Connector }  from '../Model/Connector';

@Injectable({ providedIn: 'root' })
export class ConnectorService {
	connectors: Connector[] = [
		{
			id: 'J1',
			type: 'JWPF-3',
			name: 'Main Connector',
			description: 'Some example description',
			x: 100,
			y: 100,
			pins: [
				{ id: 'pin-j1-01', name: 'A1', description: 'TX' },
				{ id: 'pin-j1-02', name: 'B1', description: 'GND' },
				{ id: 'pin-j1-03', name: 'C2', description: 'RX' }
			]
		}
	];
}