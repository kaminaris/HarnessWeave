import { Injectable } from '@angular/core';
import { Connector } from '../Model/Connector';
import { WireEnd } from '../Model/Wire';
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

	addConnector(): Connector {
		const id = `J${Date.now()}`;
		const offset = this.connectors.length * 40;
		const connector: Connector = {
			id,
			type: 'Connector',
			name: `Connector ${this.connectors.length + 1}`,
			description: '',
			x: 120 + offset,
			y: 120 + offset,
			pins: [
				{
					id: `pin-${id}-01`,
					name: '1',
					description: ''
				}
			]
		};
		this.connectors.push(connector);
		return connector;
	}

	setConnectors(connectors: Connector[]): void {
		this.connectors = connectors;
	}

	findSnapPointNear(
		stageX: number,
		stageY: number,
		threshold = 30,
		exclude?: WireEnd
	): {
		connector: Connector;
		pinId: string;
		side: 'left' | 'right';
		x: number;
		y: number;
	} | null {
		let best: {
			connector: Connector;
			pinId: string;
			side: 'left' | 'right';
			x: number;
			y: number;
		} | null = null;
		let bestDist = threshold;

		for (const connector of this.connectors) {
			for (const pin of connector.pins) {
				for (const side of ['left', 'right'] as const) {
					if (
						exclude &&
						connector.id === exclude.connectorId &&
						pin.id === exclude.pinId &&
						side === exclude.side
					) {
						continue;
					}

					const pos = this.getSnapPointStagePosition(
						connector,
						pin.id,
						side
					);
					if (!pos) {
						continue;
					}
					const dist = Math.hypot(pos.x - stageX, pos.y - stageY);
					if (dist < bestDist) {
						bestDist = dist;
						best = {
							connector,
							pinId: pin.id,
							side,
							x: pos.x,
							y: pos.y
						};
					}
				}
			}
		}

		return best;
	}
}
