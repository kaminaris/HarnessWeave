import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CanvasRenderService {
	readonly renderTick = signal(0);
	readonly wireAppearanceTick = signal<unknown>(null);

	requestRender(): void {
		this.renderTick.update((n) => n + 1);
	}

	notifyWireAppearanceChange(wire: unknown): void {
		this.wireAppearanceTick.set(wire);
	}
}
