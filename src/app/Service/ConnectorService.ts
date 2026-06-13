import { Injectable } from '@angular/core';
import { Connector } from '../Model/Connector';
import {
	getConnectorHeight,
	getConnectorWidth,
	getPinRowY,
	getSnapPointLocalPosition,
	getSnapPointStagePosition,
	DEFAULT_CONNECTOR_WIDTH,
	CONNECTOR_LAYOUT
} from '../Util/ConnectorLayout';

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

	getConnectorWidth(connector: Connector): number {
		return getConnectorWidth(connector);
	}

	getConnectorHeight(connector: Connector): number {
		return getConnectorHeight(connector);
	}

	getPinRowY(pinIndex: number): number {
		return getPinRowY(pinIndex);
	}

	getSnapPointLocalPosition(
		connector: Connector,
		pinIndex: number,
		side: 'left' | 'right'
	): { x: number; y: number } {
		return getSnapPointLocalPosition(connector, pinIndex, side);
	}

	getSnapPointStagePosition(
		connector: Connector,
		pinId: string,
		side: 'left' | 'right'
	): { x: number; y: number } | null {
		return getSnapPointStagePosition(connector, pinId, side);
	}

	getLayoutConstants() {
		return CONNECTOR_LAYOUT;
	}

	getDefaultWidth(): number {
		return DEFAULT_CONNECTOR_WIDTH;
	}
}
