import { WireDisplay } from '../Model/WireDisplay';
import { Connector } from '../Model/Connector';
import { CONNECTOR_LAYOUT } from './ConnectorLayout';

export interface SnapPointMatch {
	connector: Connector;
	pinId: string;
	side: 'left' | 'right';
	x: number;
	y: number;
}

export function findSnapPointNear(
	connectors: Connector[],
	stageX: number,
	stageY: number,
	getSnapPosition: (
		connector: Connector,
		pinId: string,
		side: 'left' | 'right'
	) => { x: number; y: number } | null,
	threshold = 30
): SnapPointMatch | null {
	let best: SnapPointMatch | null = null;
	let bestDist = threshold;

	for (const connector of connectors) {
		for (const pin of connector.pins) {
			for (const side of ['left', 'right'] as const) {
				const pos = getSnapPosition(connector, pin.id, side);
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

export function findWireBundle(
	wire: WireDisplay,
	allWires: WireDisplay[],
	connectors: Connector[],
	getSnapPosition: (
		connector: Connector,
		pinId: string,
		side: 'left' | 'right'
	) => { x: number; y: number } | null
): WireDisplay[] {
	const endSnap = findSnapPointNear(
		connectors,
		wire.endX,
		wire.endY,
		getSnapPosition,
		40
	);

	const sameSource = allWires.filter(
		(w) => w.from.connectorId === wire.from.connectorId
	);

	if (!endSnap) {
		return [wire];
	}

	const targetId = endSnap.connector.id;
	return sameSource.filter((w) => {
		const snap = findSnapPointNear(
			connectors,
			w.endX,
			w.endY,
			getSnapPosition,
			40
		);
		return snap?.connector.id === targetId;
	});
}

export function computeAutoPath(
	wire: WireDisplay,
	bendOffset = 0,
	endSnap?: SnapPointMatch | null
): void {
	const dx = wire.endX - wire.startX;
	const dy = wire.endY - wire.startY;
	const distance = Math.hypot(dx, dy);
	const tangent = Math.max(
		distance * 0.45,
		CONNECTOR_LAYOUT.CONTROL_OFFSET
	);

	const startSign = wire.from.side === 'left' ? -1 : 1;

	if (endSnap) {
		wire.endX = endSnap.x;
		wire.endY = endSnap.y;
	}

	const endSign = endSnap
		? endSnap.side === 'left'
			? -1
			: 1
		: Math.abs(dx) >= Math.abs(dy)
			? dx >= 0
				? -1
				: 1
			: dy >= 0
				? -1
				: 1;

	wire.controlStartX = wire.startX + startSign * tangent;
	wire.controlStartY = wire.startY + bendOffset * 0.4;
	wire.controlEndX = wire.endX + endSign * tangent;
	wire.controlEndY = wire.endY + bendOffset * 0.4;
}

export function autoPathWireBundle(
	wires: WireDisplay[],
	bundle: WireDisplay[],
	connectors: Connector[],
	getSnapPosition: (
		connector: Connector,
		pinId: string,
		side: 'left' | 'right'
	) => { x: number; y: number } | null
): void {
	const sorted = [...bundle].sort((a, b) => a.startY - b.startY);
	const spacing = 14;

	sorted.forEach((wire, index) => {
		const bendOffset = (index - (sorted.length - 1) / 2) * spacing;
		const endSnap = findSnapPointNear(
			connectors,
			wire.endX,
			wire.endY,
			getSnapPosition,
			40
		);
		computeAutoPath(wire, bendOffset, endSnap);
	});
}
