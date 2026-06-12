import { Injectable, signal } from '@angular/core';

export interface SelectionData {
	type: 'connector' | 'pin' | 'wire';
	data: any;
	metadata?: any;
}

@Injectable({
	providedIn: 'root'
})
export class SelectionService {
	selectedObject = signal<SelectionData | null>(null);

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

