// Wire color code to hex color mapping
export const COLOR_CODE_MAP: Record<string, string> = {
	'BK': '#000000',    // Black
	'BN': '#8B4513',    // Brown
	'RD': '#FF0000',    // Red
	'OR': '#FFA500',    // Orange
	'YL': '#FFFF00',    // Yellow
	'GN': '#00AA00',    // Green
	'BL': '#0000FF',    // Blue
	'VI': '#EE82EE',    // Violet
	'GY': '#808080',    // Gray
	'WH': '#FFFFFF',    // White
	'PK': '#FFC0CB',    // Pink
	'PL': '#800080',    // Purple
};

export function parseColorCode(code?: string): [string, string] | null {
	if (!code) return null;

	const trimmed = code.trim().toUpperCase();

	// Handle duo-color like "BNWH", "BKWH", "GNRD"
	if (trimmed.length >= 4) {
		const first = trimmed.substring(0, 2);
		const second = trimmed.substring(2, 4);
		if (COLOR_CODE_MAP[first] && COLOR_CODE_MAP[second]) {
			return [first, second];
		}
	}

	// Handle single color like "BN"
	if (trimmed.length === 2) {
		if (COLOR_CODE_MAP[trimmed]) {
			return [trimmed, trimmed];
		}
	}

	return null;
}

export function getHexColor(colorCode: string): string {
	return COLOR_CODE_MAP[colorCode.toUpperCase()] || '#888888'; // Default gray
}

export function isUnicolorWire(colorCode?: string): boolean {
	if (!colorCode) return true;
	const colors = parseColorCode(colorCode);
	if (!colors) return true;
	return colors[0] === colors[1];
}

export function isDuocolorWire(colorCode?: string): boolean {
	return !isUnicolorWire(colorCode);
}

