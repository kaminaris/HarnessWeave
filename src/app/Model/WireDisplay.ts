import { WireEnd } from './Wire';

export interface WireDisplay {
	from?: WireEnd;
	to?: WireEnd;
	startX: number;
	startY: number;
	endX: number;
	endY: number;
	controlStartX: number;
	controlStartY: number;
	controlEndX: number;
	controlEndY: number;
	stroke: string;
	strokeWidth: number;
	colorCode?: string; // e.g., "BN", "BNWH", "GN"
	thickness?: string; // e.g., "AWG 22", "0.5mm"
	outlineColor?: string; // secondary/outline color (e.g., for duo-color wires)
	attachment?: {
		// optional metadata for snapped wire ends
		target: WireEnd;
	};
}
