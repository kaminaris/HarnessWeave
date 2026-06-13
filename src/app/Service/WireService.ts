import { Injectable } from '@angular/core';
import { Wire } from '../Model/Wire';
import { WireDisplay } from '../Model/WireDisplay';
import { WireEnd } from '../Model/Wire';
import { CONNECTOR_LAYOUT } from '../Util/ConnectorLayout';
import { ConnectorService } from './ConnectorService';
import {
	autoPathWireBundle,
	computeAutoPath,
	findWireBundle
} from '../Util/WireRouting';

@Injectable({ providedIn: 'root' })
export class WireService {
	wires: Wire[] = [];
	displayWires: WireDisplay[] = [];
	activeWire: WireDisplay | null = null;

	constructor(private connectors: ConnectorService) {}

	createActiveWire(from: WireEnd, startX: number, startY: number): WireDisplay {
		const offset = CONNECTOR_LAYOUT.CONTROL_OFFSET;
		const controlStartX =
			from.side === 'left' ? startX - offset : startX + offset;

		return {
			from,
			startX,
			startY,
			endX: startX,
			endY: startY,
			controlStartX,
			controlStartY: startY,
			controlEndX: controlStartX,
			controlEndY: startY,
			stroke: '#00ff00',
			strokeWidth: 6
		};
	}

	updateActiveWireEnd(wire: WireDisplay, endX: number, endY: number): void {
		wire.endX = endX;
		wire.endY = endY;

		const dx = endX - wire.startX;
		const offset = Math.max(Math.abs(dx) * 0.3, 30);

		if (wire.from.side === 'left') {
			wire.controlStartX = wire.startX - offset;
		} else {
			wire.controlStartX = wire.startX + offset;
		}
		wire.controlStartY = wire.startY;

		wire.controlEndX = endX - dx * 0.3;
		wire.controlEndY = endY;
	}

	commitActiveWire(): WireDisplay | null {
		if (!this.activeWire) {
			return null;
		}
		const finished = this.activeWire;
		this.displayWires.push(finished);
		this.activeWire = null;
		return finished;
	}

	updateWiresForConnector(connectorId: string): void {
		for (const wire of this.displayWires) {
			if (wire.from.connectorId !== connectorId) {
				continue;
			}
			const connector = this.connectors.connectors.find((c) => c.id === connectorId);
			if (!connector) {
				continue;
			}
			const pos = this.connectors.getSnapPointStagePosition(
				connector,
				wire.from.pinId,
				wire.from.side
			);
			if (!pos) {
				continue;
			}
			wire.startX = pos.x;
			wire.startY = pos.y;

			const offset = Math.max(
				Math.abs(wire.controlStartX - wire.startX),
				CONNECTOR_LAYOUT.CONTROL_OFFSET
			);
			if (wire.from.side === 'left') {
				wire.controlStartX = wire.startX - offset;
			} else {
				wire.controlStartX = wire.startX + offset;
			}
			wire.controlStartY = wire.startY;
		}
	}

	generateBezierCurvePoints(
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		cx1: number,
		cy1: number,
		cx2: number,
		cy2: number,
		resolution = 50
	): number[] {
		const points: number[] = [];

		for (let i = 0; i <= resolution; i++) {
			const t = i / resolution;
			const mt = 1 - t;
			const mt2 = mt * mt;
			const mt3 = mt2 * mt;
			const t2 = t * t;
			const t3 = t2 * t;

			const x =
				mt3 * x1 + 3 * mt2 * t * cx1 + 3 * mt * t2 * cx2 + t3 * x2;
			const y =
				mt3 * y1 + 3 * mt2 * t * cy1 + 3 * mt * t2 * cy2 + t3 * y2;

			points.push(x, y);
		}

		return points;
	}

	getBezierPoints(wire: WireDisplay): number[] {
		return this.generateBezierCurvePoints(
			wire.startX,
			wire.startY,
			wire.endX,
			wire.endY,
			wire.controlStartX,
			wire.controlStartY,
			wire.controlEndX,
			wire.controlEndY
		);
	}

	addWire(wire: Wire): void {
		this.wires.push(wire);
	}

	setDisplayWires(wires: WireDisplay[]): void {
		this.displayWires = wires;
		this.activeWire = null;
	}

	autoPathSingleWire(wire: WireDisplay): void {
		const endSnap = this.connectors.findSnapPointNear(wire.endX, wire.endY, 40);
		computeAutoPath(wire, 0, endSnap);
	}

	autoPathWire(wire: WireDisplay): void {
		const bundle = findWireBundle(
			wire,
			this.displayWires,
			this.connectors.connectors,
			(c, pinId, side) =>
				this.connectors.getSnapPointStagePosition(c, pinId, side)
		);
		autoPathWireBundle(
			this.displayWires,
			bundle,
			this.connectors.connectors,
			(c, pinId, side) =>
				this.connectors.getSnapPointStagePosition(c, pinId, side)
		);
	}

	autoPathAllWires(): void {
		const bundles: WireDisplay[][] = [];
		const assigned = new Set<WireDisplay>();

		for (const wire of this.displayWires) {
			if (assigned.has(wire)) {
				continue;
			}
			const bundle = findWireBundle(
				wire,
				this.displayWires,
				this.connectors.connectors,
				(c, pinId, side) =>
					this.connectors.getSnapPointStagePosition(c, pinId, side)
			);
			bundle.forEach((w) => assigned.add(w));
			bundles.push(bundle);
		}

		for (const bundle of bundles) {
			autoPathWireBundle(
				this.displayWires,
				bundle,
				this.connectors.connectors,
				(c, pinId, side) =>
					this.connectors.getSnapPointStagePosition(c, pinId, side)
			);
		}
	}
}
