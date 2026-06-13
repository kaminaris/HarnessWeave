import { Connector } from '../Model/Connector';

export const CONNECTOR_LAYOUT = {
	FONT_SIZE: 12,
	ROW_HEIGHT: 22,
	PADDING: 8,
	COL1_WIDTH: 80,
	COL2_WIDTH: 120,
	HANDLE_SIZE: 10,
	CONTROL_OFFSET: 50
} as const;

export const DEFAULT_CONNECTOR_WIDTH =
	CONNECTOR_LAYOUT.COL1_WIDTH +
	CONNECTOR_LAYOUT.COL2_WIDTH +
	CONNECTOR_LAYOUT.PADDING * 2;

export function getHeaderHeight(): number {
	return CONNECTOR_LAYOUT.ROW_HEIGHT + CONNECTOR_LAYOUT.PADDING;
}

export function calculateDescriptionHeight(description: string, width: number): number {
	if (!description || description.trim().length === 0) {
		return 0;
	}

	// Estimate line count based on text width and average character width
	const availableWidth = width - CONNECTOR_LAYOUT.PADDING * 2;
	const avgCharWidth = 7; // Approximate character width at FONT_SIZE 10
	const charsPerLine = Math.floor(availableWidth / avgCharWidth);
	const lines = Math.ceil(description.length / charsPerLine);

	// Return height needed (minimum 1 line, each line is ROW_HEIGHT)
	return Math.max(lines * CONNECTOR_LAYOUT.ROW_HEIGHT, CONNECTOR_LAYOUT.ROW_HEIGHT);
}

export function getConnectorWidth(connector: Connector): number {
	return connector.width ?? DEFAULT_CONNECTOR_WIDTH;
}

export function getConnectorHeight(connector: Connector): number {
	const headerHeight = getHeaderHeight();
	const rowsHeight = connector.pins.length * CONNECTOR_LAYOUT.ROW_HEIGHT;
	const width = getConnectorWidth(connector);
	const hasDescription =
		connector.description && connector.description.trim().length > 0;
	const descriptionHeight = hasDescription ? calculateDescriptionHeight(connector.description || '', width) : 0;
	return headerHeight + rowsHeight + descriptionHeight + CONNECTOR_LAYOUT.PADDING;
}

export function getPinRowY(pinIndex: number): number {
	return getHeaderHeight() + pinIndex * CONNECTOR_LAYOUT.ROW_HEIGHT;
}

export function getSnapPointLocalPosition(
	connector: Connector,
	pinIndex: number,
	side: 'left' | 'right'
): { x: number; y: number } {
	const width = getConnectorWidth(connector);
	const rowY = getPinRowY(pinIndex);
	const y = rowY + CONNECTOR_LAYOUT.ROW_HEIGHT / 2;
	const x = side === 'left' ? 0 : width;
	return { x, y };
}

export function getSnapPointStagePosition(
	connector: Connector,
	pinId: string,
	side: 'left' | 'right'
): { x: number; y: number } | null {
	const pinIndex = connector.pins.findIndex((p) => p.id === pinId);
	if (pinIndex === -1) {
		return null;
	}
	const local = getSnapPointLocalPosition(connector, pinIndex, side);
	return {
		x: connector.x + local.x,
		y: connector.y + local.y
	};
}

export interface ResizeState {
	startX: number;
	startY: number;
	initialWidth: number;
	initialHeight: number;
}

export function applyConnectorResize(
	connector: Connector,
	cornerIndex: number,
	handleX: number,
	handleY: number,
	resizeState: ResizeState
): void {
	const MIN_WIDTH = DEFAULT_CONNECTOR_WIDTH;
	const MIN_HEIGHT = CONNECTOR_LAYOUT.ROW_HEIGHT + CONNECTOR_LAYOUT.PADDING;

	let newWidth = resizeState.initialWidth;
	let newHeight = resizeState.initialHeight;
	let newX = resizeState.startX;
	let newY = resizeState.startY;

	switch (cornerIndex) {
		case 0:
			newWidth = Math.max(
				MIN_WIDTH,
				resizeState.initialWidth - (handleX - resizeState.startX)
			);
			newHeight = Math.max(
				MIN_HEIGHT,
				resizeState.initialHeight - (handleY - resizeState.startY)
			);
			newX = resizeState.startX + (resizeState.initialWidth - newWidth);
			newY = resizeState.startY + (resizeState.initialHeight - newHeight);
			break;
		case 1:
			newWidth = Math.max(MIN_WIDTH, handleX - resizeState.startX);
			newHeight = Math.max(
				MIN_HEIGHT,
				resizeState.initialHeight - (handleY - resizeState.startY)
			);
			newY = resizeState.startY + (resizeState.initialHeight - newHeight);
			break;
		case 2:
			newWidth = Math.max(MIN_WIDTH, handleX - resizeState.startX);
			newHeight = Math.max(MIN_HEIGHT, handleY - resizeState.startY);
			break;
		case 3:
			newWidth = Math.max(
				MIN_WIDTH,
				resizeState.initialWidth - (handleX - resizeState.startX)
			);
			newHeight = Math.max(MIN_HEIGHT, handleY - resizeState.startY);
			newX = resizeState.startX + (resizeState.initialWidth - newWidth);
			break;
	}

	connector.x = newX;
	connector.y = newY;
	connector.width = newWidth;
	connector.height = newHeight;
}
