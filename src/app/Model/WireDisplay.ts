import { WireEnd } from './Wire';

export interface WireDisplay {
	from: WireEnd;
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
	attachment?: {
		// optional metadata for snapped wire ends
		target: WireEnd;
	};
}
