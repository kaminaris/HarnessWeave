export interface Pin {
	id: string;
	name: string;
	description?: string;
}

export interface Connector {
	id: string;
	type: string;
	name: string;
	description?: string;
	x: number;
	y: number;
	width?: number;
	height?: number;
	pins: Pin[];
}