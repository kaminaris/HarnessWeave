import { Injectable } from '@angular/core';
import { Connector }  from '../Model/Connector';

@Injectable({ providedIn: 'root' })
export class ConnectorService {
	connectors: Connector[] = [
		{
			id: 'J1',
			title: 'Vesc UART',
			x: 100,
			y: 100,
			pins: [
				{ id: 'p1', name: 'GND' },
				{ id: 'p2', name: 'TX' },
				{ id: 'p3', name: 'RX' }
			]
		}
	];
}