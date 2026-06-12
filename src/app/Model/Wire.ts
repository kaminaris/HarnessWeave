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
}