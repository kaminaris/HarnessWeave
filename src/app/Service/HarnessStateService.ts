import { Injectable } from '@angular/core';
import { ConnectorService } from './ConnectorService';
import { WireService } from './WireService';
import { SelectionService } from './SelectionService';
import { HarnessProjectState } from '../Model/HarnessProjectState';

@Injectable({ providedIn: 'root' })
export class HarnessStateService {
	private readonly STORAGE_KEY = 'harness-weave-project';

	constructor(
		private connectors: ConnectorService,
		private wires: WireService,
		private selection: SelectionService
	) {}

	exportState(): HarnessProjectState {
		// Filter out Konva objects (line, anchors) from wires before serializing
		const cleanWires = this.wires.displayWires.map(wire => ({
			from: wire.from,
			to: wire.to,
			startX: wire.startX,
			startY: wire.startY,
			endX: wire.endX,
			endY: wire.endY,
			controlStartX: wire.controlStartX,
			controlStartY: wire.controlStartY,
			controlEndX: wire.controlEndX,
			controlEndY: wire.controlEndY,
			stroke: wire.stroke,
			strokeWidth: wire.strokeWidth,
			colorCode: wire.colorCode,
			thickness: wire.thickness,
			outlineColor: wire.outlineColor
		}));

		// Filter out Konva group objects from connectors before serializing
		const cleanConnectors = this.connectors.connectors.map(connector => ({
			id: connector.id,
			type: connector.type,
			name: connector.name,
			description: connector.description,
			x: connector.x,
			y: connector.y,
			pins: connector.pins
		}));

		return {
			version: 1,
			connectors: cleanConnectors,
			wires: cleanWires
		};
	}

	importState(state: HarnessProjectState): void {
		if (!state?.connectors || !state?.wires) {
			throw new Error('Invalid project file');
		}
		this.connectors.setConnectors(state.connectors);
		this.wires.setDisplayWires(state.wires);
		this.selection.deselect();
	}

	saveToLocalStorage(): void {
		localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.exportState()));
	}

	loadFromLocalStorage(): boolean {
		const raw = localStorage.getItem(this.STORAGE_KEY);
		if (!raw) {
			return false;
		}
		try {
			this.importState(JSON.parse(raw) as HarnessProjectState);
			return true;
		} catch {
			return false;
		}
	}

	exportToFile(): void {
		const json = JSON.stringify(this.exportState(), null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `harness-${new Date().toISOString().slice(0, 10)}.json`;
		anchor.click();
		URL.revokeObjectURL(url);
	}

	async importFromFile(file: File): Promise<void> {
		const text = await file.text();
		const state = JSON.parse(text) as HarnessProjectState;
		this.importState(state);
	}
}
