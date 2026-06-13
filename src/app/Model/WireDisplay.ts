import { WireEnd } from './Wire';

export interface WireDisplay {
	from: WireEnd;
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
}
