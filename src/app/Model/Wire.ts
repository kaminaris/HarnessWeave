export interface WireEnd {
	connectorId: string;
	pinId: string;
	side: 'left' | 'right';
}

export interface Wire {
	id: string;
	from: WireEnd;
	to: WireEnd;
	color: string;
	colorCode?: string; // e.g., "BN", "BNWH", "GN"
	thickness?: string; // e.g., "AWG 22", "0.5mm"
}