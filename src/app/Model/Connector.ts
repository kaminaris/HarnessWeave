export interface Pin {
	id: string;
	name: string;
}

export interface Connector {
	id: string;
	title: string;
	x: number;
	y: number;
	pins: Pin[];
}