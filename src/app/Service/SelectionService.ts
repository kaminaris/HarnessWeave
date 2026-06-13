import { Injectable, computed, signal } from '@angular/core';

export interface SelectionData {
	type: 'connector' | 'pin' | 'wire';
	data: any;
	metadata?: any;
}

export type OverlayState =
	| { type: 'connector-resize'; data: any }
	| { type: 'wire-anchors'; data: any }
	| null;

@Injectable({
	providedIn: 'root'
})
export class SelectionService {
	selectedObject = signal<SelectionData | null>(null);

	overlay = computed<OverlayState>(() => {
		const selected = this.selectedObject();
		if (!selected) {
			return null;
		}
		if (selected.type === 'connector') {
			return { type: 'connector-resize', data: selected.data };
		}
		if (selected.type === 'wire') {
			return { type: 'wire-anchors', data: selected.data };
		}
		return null;
	});

	select(data: SelectionData) {
		this.selectedObject.set(data);
	}

	deselect() {
		this.selectedObject.set(null);
	}

	getSelected() {
		return this.selectedObject();
	}

	isSelected(data: any): boolean {
		const selected = this.selectedObject();
		return selected !== null && selected.data === data;
	}
}
