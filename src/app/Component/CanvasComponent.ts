import {
	AfterViewInit,
	Component,
	ElementRef,
	ViewChild,
	effect
} from '@angular/core';

import Konva                from 'konva';
import { ConnectorService } from '../Service/ConnectorService';
import { WireService }      from '../Service/WireService';
import { SelectionService } from '../Service/SelectionService';

@Component({
	selector: 'app-canvas',
	template: `
		<div #stageContainer class="canvas"></div>`,
	styles: [
		`
			.canvas {
				width:      100%;
				height:     100vh;
				background: #111;
			}
		`
	]
})
export class CanvasComponent implements AfterViewInit {
	@ViewChild('stageContainer', { static: true })
	containerRef!: ElementRef;

	stage!: Konva.Stage;
	layer!: Konva.Layer;
	wireLayer!: Konva.Layer;
	anchorLayer!: Konva.Layer;
	selectionLayer!: Konva.Layer;

	activeWire: any = null;
	allWires: any[] = [];

	constructor(
		public connectors: ConnectorService,
		public wires: WireService,
		public selection: SelectionService
	) {
		// Watch SelectionService and render UI accordingly
		// This is the ONLY place that decides what UI elements to show/hide
		effect(() => {
			// Guard: Only run if canvas is initialized
			if (!this.anchorLayer || !this.selectionLayer || !this.wireLayer) {
				return;
			}

			const selected = this.selection.selectedObject();

			// Clear everything first
			this.hideWireAnchors();
			this.hideConnectorResizeHandles();
			this.resetAllWireAppearance();

			// Show UI based on what's selected
			if (selected?.type === 'connector') {
				this.showConnectorResizeHandles(selected.data);
			} else if (selected?.type === 'wire') {
				this.showWireAnchors(selected.data);
				// Highlight the selected wire
				selected.data.line.stroke('#ffff00');
				selected.data.line.strokeWidth(8);
				this.wireLayer.batchDraw();
			}
		});
	}

	ngAfterViewInit() {
		this.initCanvas();
		this.render();

		// Handle window resize
		window.addEventListener('resize', () => this.onWindowResize());

		// Handle stage click for deselection
		this.stage.on('click', (e) => {
			if (e.target === this.stage) {
				this.selection.deselect();
			}
		});

		// Listen for wire property changes
		window.addEventListener('wirePropertyChanged', (event: any) => {
			this.updateWireAppearance(event.detail);
		});

		// Listen for connector changes (add/remove pins, edit pins)
		window.addEventListener('connectorChanged', (event: any) => {
			this.render();
		});
	}

	private updateWireAppearance(wire: any) {
		if (wire && wire.line) {
			wire.line.stroke(wire.stroke || '#00ff00');
			wire.line.strokeWidth(wire.strokeWidth || 6);
			this.wireLayer.batchDraw();
		}
	}

	private resetAllWireAppearance() {
		if (!this.wireLayer) {
			return;
		}
		for (const wire of this.allWires) {
			if (wire.line) {
				wire.line.stroke(wire.stroke || '#00ff00');
				wire.line.strokeWidth(wire.strokeWidth || 6);
			}
		}
		this.wireLayer.batchDraw();
	}

	onWindowResize() {
		const container = this.containerRef.nativeElement;
		this.stage.width(container.offsetWidth);
		this.stage.height(container.offsetHeight);
		this.layer.batchDraw();
		this.wireLayer.batchDraw();
		this.anchorLayer.batchDraw();
		this.selectionLayer.batchDraw();
	}

	initCanvas() {
		const container = this.containerRef.nativeElement;
		this.stage = new Konva.Stage({
			container: container,
			width: container.offsetWidth,
			height: container.offsetHeight
		});

		this.layer = new Konva.Layer();
		this.wireLayer = new Konva.Layer();
		this.anchorLayer = new Konva.Layer();
		this.selectionLayer = new Konva.Layer();

		this.stage.add(this.layer);
		this.stage.add(this.wireLayer);
		this.stage.add(this.anchorLayer);
		this.stage.add(this.selectionLayer);
	}

	render() {
		this.layer.destroyChildren();
		this.wireLayer.destroyChildren();
		this.anchorLayer.destroyChildren();
		this.selectionLayer.destroyChildren();
		this.allWires = [];

		this.renderConnectors();
		this.renderWires();

		this.layer.draw();
		this.wireLayer.draw();
		this.anchorLayer.draw();
		this.selectionLayer.draw();
	}

	renderConnectors() {
		const FONT_SIZE = 12;
		const ROW_HEIGHT = 22;
		const PADDING = 8;
		const COL1_WIDTH = 80; // Name column
		const COL2_WIDTH = 120; // Description column
		const TOTAL_WIDTH = COL1_WIDTH + COL2_WIDTH + PADDING * 2;

		for (const c of this.connectors.connectors) {
			const group = new Konva.Group({
				x: c.x,
				y: c.y,
				draggable: true,
				name: `connector-${c.id}`
			});

		// Store reference to group in connector for later access
		(c as any).group = group;

		// Use stored dimensions or calculate defaults
		const headerHeight = ROW_HEIGHT + PADDING;
		const rowsHeight = c.pins.length * ROW_HEIGHT;
		const hasDescription = c.description && c.description.trim().length > 0;
		const descriptionRowHeight = hasDescription ? ROW_HEIGHT : 0;
		const calculatedHeight = headerHeight + rowsHeight + descriptionRowHeight + PADDING;
		const calculatedWidth = TOTAL_WIDTH;

		// Use connector's stored dimensions or defaults
		const width = c.width || calculatedWidth;
		const height = c.height || calculatedHeight;

		// Background rectangle
		const rect = new Konva.Rect({
			width: width,
			height: height,
			fill: '#1a1a1a',
			stroke: '#555',
			strokeWidth: 2
		});
		group.add(rect);

		// Header row: type and name
		const typeText = new Konva.Text({
			text: c.type || 'Connector',
			fill: '#fff',
			fontSize: FONT_SIZE,
			fontWeight: 'bold',
			x: PADDING,
			y: PADDING / 2,
			width: COL1_WIDTH - PADDING
		});
		group.add(typeText);

		const nameHeaderText = new Konva.Text({
			text: c.name || 'N/A',
			fill: '#fff',
			fontSize: FONT_SIZE,
			fontWeight: 'bold',
			x: COL1_WIDTH + PADDING * 2,
			y: PADDING / 2,
			width: COL2_WIDTH - PADDING
		});
		group.add(nameHeaderText);

		// Header line separator
		const headerLine = new Konva.Line({
			points: [0, headerHeight, width, headerHeight],
			stroke: '#555',
			strokeWidth: 1
		});
		group.add(headerLine);

		// Vertical separator between columns
		const colSeparator = new Konva.Line({
			points: [COL1_WIDTH + PADDING, 0, COL1_WIDTH + PADDING, height],
			stroke: '#555',
			strokeWidth: 1
		});
		group.add(colSeparator);

		// Render pins as table rows
		c.pins.forEach((p, i) => {
			const rowY = headerHeight + i * ROW_HEIGHT;

			// Row separator line
			if (i > 0) {
				const rowSeparator = new Konva.Line({
					points: [0, rowY, width, rowY],
					stroke: '#333',
					strokeWidth: 1
				});
				group.add(rowSeparator);
			}

			// Create snap point for left side
			group.add(
				this.createSnapPoint(c.id, p.id, 'left', 0, rowY + ROW_HEIGHT / 2, c, p)
			);

			// Left column: Pin name
			const pinNameText = new Konva.Text({
				text: p.name,
				fill: '#00ff00',
				fontSize: FONT_SIZE,
				x: PADDING,
				y: rowY + (ROW_HEIGHT - FONT_SIZE) / 2,
				width: COL1_WIDTH - PADDING
			});
			group.add(pinNameText);

			// Right column: Pin description
			const pinDescriptionText = new Konva.Text({
				text: p.description || '',
				fill: '#ccc',
				fontSize: FONT_SIZE,
				x: COL1_WIDTH + PADDING * 2,
				y: rowY + (ROW_HEIGHT - FONT_SIZE) / 2,
				width: COL2_WIDTH - PADDING
			});
			group.add(pinDescriptionText);

			// Create snap point for right side
			group.add(
				this.createSnapPoint(c.id, p.id, 'right', width, rowY + ROW_HEIGHT / 2, c, p)
			);
		});

		// Description row (if description exists)
		if (hasDescription) {
			const descRowY = headerHeight + rowsHeight;

			// Description separator line
			const descSeparator = new Konva.Line({
				points: [0, descRowY, width, descRowY],
				stroke: '#333',
				strokeWidth: 1
			});
			group.add(descSeparator);

			// Description text (spanning both columns)
			const descriptionDisplay = new Konva.Text({
				text: c.description,
				fill: '#aaa',
				fontSize: FONT_SIZE - 2,
				x: PADDING,
				y: descRowY + (ROW_HEIGHT - FONT_SIZE) / 2,
				width: width - PADDING * 2
			});
			group.add(descriptionDisplay);
		}

			// Add click handler to connector group
			group.on('click', (e) => {
				if (e.target === group || e.target === rect) {
					this.selection.select({
						type: 'connector',
						data: c
					});
				}
			});

			// Add drag handlers
			group.on('dragmove', () => {

				// Update connector position
				c.x = group.x();
				c.y = group.y();

				// Update all wires connected to this connector
				this.updateConnectedWires(c.id);

				this.wireLayer.batchDraw();
			});

			group.on('dragend', () => {
				this.layer.batchDraw();
			});

			this.layer.add(group);
		}
	}

	createSnapPoint(
		connectorId: string,
		pinId: string,
		side: 'left' | 'right',
		x: number,
		y: number,
		connector: any,
		pin: any
	) {
		const circle = new Konva.Circle({
			x,
			y,
			radius: 5,
			fill: 'orange',
			stroke: 'black',
			strokeWidth: 1
		});

		(circle as any).meta = { connectorId, pinId, side };

		circle.on('mousedown', (e) => this.startWire(e, circle));
		circle.on('click', (e) => {
			e.cancelBubble = true;
			this.selection.select({
				type: 'pin',
				data: pin,
				metadata: { connector, side }
			});
		});
		circle.on('mouseenter', () => circle.fill('red'));
		circle.on('mouseleave', () => {
			if (!this.activeWire) {
				circle.fill('orange');
			}
		});

		return circle;
	}

	startWire(e: any, circle: Konva.Circle) {
		const pos = this.stage.getPointerPosition();
		const meta = (circle as any).meta;
		if (!pos || !meta) {
			return;
		}

		this.activeWire = {
			from: meta,
			startX: pos.x,
			startY: pos.y,
			endX: pos.x,
			endY: pos.y,
			controlStartX: pos.x + 50,
			controlStartY: pos.y,
			controlEndX: pos.x - 50,
			controlEndY: pos.y,
			stroke: '#00ff00',
			strokeWidth: 6
		};

		const line = new Konva.Line({
			points: this.generateBezierCurvePoints(
				this.activeWire.startX,
				this.activeWire.startY,
				this.activeWire.endX,
				this.activeWire.endY,
				this.activeWire.controlStartX,
				this.activeWire.controlStartY,
				this.activeWire.controlEndX,
				this.activeWire.controlEndY
			),
			stroke: this.activeWire.stroke,
			strokeWidth: this.activeWire.strokeWidth,
			lineCap: 'round',
			lineJoin: 'round',
			hitStrokeWidth: 20
		});

		this.activeWire.line = line;
		this.wireLayer.add(line);

		// Disable dragging on all connectors while placing wire
		this.disableConnectorDragging();

		this.stage.on('mousemove', () => this.updateWire());
		this.stage.on('mouseup', () => this.finishWire());
	}

	finishWire() {
		if (!this.activeWire) {
			return;
		}

		this.stage.off('mousemove');
		this.stage.off('mouseup');

		// Store the finished wire
		const finishedWire = this.activeWire;
		this.allWires.push(finishedWire);

		// Add click handler to the wire line
		finishedWire.line.on('click', (e: any) => {
			e.cancelBubble = true;
			this.selection.select({
				type: 'wire',
				data: finishedWire
			});
		});

		// Reset snap point colors
		this.layer.find('Circle').forEach((circle: any) => {
			circle.fill('orange');
		});

		// Enable dragging on all connectors again
		this.enableConnectorDragging();

		this.activeWire = null;
	}

	private disableConnectorDragging() {
		for (const c of this.connectors.connectors) {
			if ((c as any).group) {
				(c as any).group.draggable(false);
			}
		}
	}

	private enableConnectorDragging() {
		for (const c of this.connectors.connectors) {
			if ((c as any).group) {
				(c as any).group.draggable(true);
			}
		}
	}

	updateWire() {
		if (!this.activeWire) {
			return;
		}

		const pos = this.stage.getPointerPosition();
		this.activeWire.endX = pos!.x;
		this.activeWire.endY = pos!.y;

		// Auto-adjust control point for the end
		const dx = this.activeWire.endX - this.activeWire.startX;
		this.activeWire.controlEndX = this.activeWire.endX - dx * 0.3;
		this.activeWire.controlEndY = this.activeWire.endY;

		const bezierPoints = this.generateBezierCurvePoints(
			this.activeWire.startX,
			this.activeWire.startY,
			this.activeWire.endX,
			this.activeWire.endY,
			this.activeWire.controlStartX,
			this.activeWire.controlStartY,
			this.activeWire.controlEndX,
			this.activeWire.controlEndY
		);

		this.activeWire.line.points(bezierPoints);
		this.wireLayer.batchDraw();
	}

	generateBezierCurvePoints(
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		cx1: number = 0,
		cy1: number = 0,
		cx2: number = 0,
		cy2: number = 0,
		resolution: number = 50
	): number[] {
		const points: number[] = [];

		// If control points not provided, calculate defaults
		if (cx1 === 0 && cy1 === 0 && cx2 === 0 && cy2 === 0) {
			const dx = x2 - x1;
			cx1 = x1 + dx * 0.3;
			cy1 = (y1 + y2) / 2;
			cx2 = x1 + dx * 0.7;
			cy2 = (y1 + y2) / 2;
		}

		// Generate cubic Bézier curve points
		// B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
		for (let i = 0; i <= resolution; i++) {
			const t = i / resolution;
			const mt = 1 - t;
			const mt2 = mt * mt;
			const mt3 = mt2 * mt;
			const t2 = t * t;
			const t3 = t2 * t;

			const x = mt3 * x1 + 3 * mt2 * t * cx1 + 3 * mt * t2 * cx2 + t3 * x2;
			const y = mt3 * y1 + 3 * mt2 * t * cy1 + 3 * mt * t2 * cy2 + t3 * y2;

			points.push(x, y);
		}

		return points;
	}

	showWireAnchors(wire: any) {
		this.hideWireAnchors();

		// Create lines connecting points to control points
		const startControlLine = new Konva.Line({
			points: [wire.startX, wire.startY, wire.controlStartX, wire.controlStartY],
			stroke: '#888',
			strokeWidth: 1,
			dash: [5, 5],
			listening: false
		});

		const endControlLine = new Konva.Line({
			points: [wire.endX, wire.endY, wire.controlEndX, wire.controlEndY],
			stroke: '#888',
			strokeWidth: 1,
			dash: [5, 5],
			listening: false
		});

		this.anchorLayer.add(startControlLine);
		this.anchorLayer.add(endControlLine);

		// Create anchor points
		const startAnchor = this.createAnchor(
			wire.startX,
			wire.startY,
			'start',
			() => this.onAnchorDragEnd(wire),
			wire,
			startControlLine,
			endControlLine
		);

		const endAnchor = this.createAnchor(
			wire.endX,
			wire.endY,
			'end',
			() => this.onAnchorDragEnd(wire),
			wire,
			startControlLine,
			endControlLine
		);

		const controlStartAnchor = this.createAnchor(
			wire.controlStartX,
			wire.controlStartY,
			'controlStart',
			() => this.onAnchorDragEnd(wire),
			wire,
			startControlLine,
			endControlLine
		);

		const controlEndAnchor = this.createAnchor(
			wire.controlEndX,
			wire.controlEndY,
			'controlEnd',
			() => this.onAnchorDragEnd(wire),
			wire,
			startControlLine,
			endControlLine
		);

		wire.anchors = {
			start: startAnchor,
			end: endAnchor,
			controlStart: controlStartAnchor,
			controlEnd: controlEndAnchor
		};

		this.anchorLayer.draw();
	}

	hideWireAnchors() {
		if (!this.anchorLayer) {
			return;
		}
		this.anchorLayer.destroyChildren();
		this.anchorLayer.draw();
	}

	createAnchor(
		x: number,
		y: number,
		type: string,
		onDragEnd: () => void,
		wire: any,
		startControlLine: any,
		endControlLine: any
	) {
		const colors: { [key: string]: string } = {
			start: '#00ffff',
			end: '#00ffff',
			controlStart: '#ffff00',
			controlEnd: '#ffff00'
		};

		const anchor = new Konva.Circle({
			x,
			y,
			radius: 8,
			fill: colors[type] || '#ff00ff',
			stroke: 'white',
			strokeWidth: 2,
			draggable: true,
			name: `anchor-${type}`
		});

		anchor.on('dragmove', (e) => {
			const selected = this.selection.getSelected();
			const selectedWire = selected?.type === 'wire' ? selected.data : null;

			if (selectedWire === wire) {
				if (type === 'start') {
					wire.startX = anchor.x();
					wire.startY = anchor.y();
					startControlLine.points([wire.startX, wire.startY, wire.controlStartX, wire.controlStartY]);
				} else if (type === 'end') {
					wire.endX = anchor.x();
					wire.endY = anchor.y();
					endControlLine.points([wire.endX, wire.endY, wire.controlEndX, wire.controlEndY]);
				} else if (type === 'controlStart') {
					wire.controlStartX = anchor.x();
					wire.controlStartY = anchor.y();
					startControlLine.points([wire.startX, wire.startY, wire.controlStartX, wire.controlStartY]);
				} else if (type === 'controlEnd') {
					wire.controlEndX = anchor.x();
					wire.controlEndY = anchor.y();
					endControlLine.points([wire.endX, wire.endY, wire.controlEndX, wire.controlEndY]);
				}

				// Update wire curve
				const bezierPoints = this.generateBezierCurvePoints(
					wire.startX,
					wire.startY,
					wire.endX,
					wire.endY,
					wire.controlStartX,
					wire.controlStartY,
					wire.controlEndX,
					wire.controlEndY
				);

				wire.line.points(bezierPoints);
				this.wireLayer.batchDraw();
				this.anchorLayer.batchDraw();
			}
		});

		anchor.on('dragend', onDragEnd);

		this.anchorLayer.add(anchor);
		return anchor;
	}

	onAnchorDragEnd(wire: any) {
		// Update anchors display
		this.showWireAnchors(wire);
	}

	renderWires() {
		for (const w of this.wires.wires) {
			// placeholder for committed wires
		}
	}

	private updateConnectedWires(connectorId: string) {
		const FONT_SIZE = 12;
		const ROW_HEIGHT = 22;
		const PADDING = 8;
		const COL1_WIDTH = 80;
		const TOTAL_WIDTH = COL1_WIDTH + 120 + PADDING * 2;
		const HEADER_HEIGHT = ROW_HEIGHT + PADDING;

		for (const wire of this.allWires) {
			// Check if wire starts from this connector
			if (wire.from.connectorId === connectorId) {
				const connector = this.connectors.connectors.find(c => c.id === connectorId);
				if (connector) {
					const pinIndex = connector.pins.findIndex(p => p.id === wire.from.pinId);
					if (pinIndex !== -1) {
						const rowY = HEADER_HEIGHT + pinIndex * ROW_HEIGHT;
						const snapPointY = rowY + ROW_HEIGHT / 2;
						const x = wire.from.side === 'left' ? 0 : TOTAL_WIDTH;
						wire.startX = connector.x + x;
						wire.startY = connector.y + snapPointY;
					}
				}
			}

			// Update the wire curve
			const bezierPoints = this.generateBezierCurvePoints(
				wire.startX,
				wire.startY,
				wire.endX,
				wire.endY,
				wire.controlStartX,
				wire.controlStartY,
				wire.controlEndX,
				wire.controlEndY
			);

			wire.line.points(bezierPoints);
		}
	}

	private showConnectorResizeHandles(connector: any) {
		if (!this.selectionLayer) {
			return;
		}
		this.hideConnectorResizeHandles();

		const HANDLE_SIZE = 10;
		const PADDING = 8;
		const COL1_WIDTH = 80;
		const COL2_WIDTH = 120;
		const TOTAL_WIDTH = COL1_WIDTH + COL2_WIDTH + PADDING * 2;

		// Use stored connector dimensions or calculate from current render
		const width = connector.width || TOTAL_WIDTH;
		const height = connector.height || this.calculateConnectorHeight(connector);

		// Store initial values for this resize operation
		const resizeState = {
			startX: connector.x,
			startY: connector.y,
			initialWidth: width,
			initialHeight: height
		};

		// Corner positions relative to connector (add connector position to get stage coordinates)
		const corners = [
			{ x: connector.x, y: connector.y }, // top-left
			{ x: connector.x + width, y: connector.y }, // top-right
			{ x: connector.x + width, y: connector.y + height }, // bottom-right
			{ x: connector.x, y: connector.y + height } // bottom-left
		];

		corners.forEach((corner, index) => {
			const handle = new Konva.Rect({
				x: corner.x - HANDLE_SIZE / 2,
				y: corner.y - HANDLE_SIZE / 2,
				width: HANDLE_SIZE,
				height: HANDLE_SIZE,
				fill: '#4CAF50',
				stroke: '#fff',
				strokeWidth: 1,
				draggable: true,
				name: `resize-handle-${index}`
			});

			handle.on('dragmove', () => {
				this.handleConnectorResizeDrag(connector, index, handle.x(), handle.y(), resizeState);
			});

			handle.on('dragend', () => {
				// Trigger a re-render and update the effect by setting selection again
				this.render();
				this.selection.select({
					type: 'connector',
					data: connector
				});
			});

			this.selectionLayer.add(handle);
		});

		this.selectionLayer.draw();
	}

	private hideConnectorResizeHandles() {
		if (!this.selectionLayer) {
			return;
		}
		const handles = this.selectionLayer.find('[name^="resize-handle"]');
		handles.forEach((h: any) => h.destroy());
		this.selectionLayer.draw();
	}

	private calculateConnectorHeight(connector: any): number {
		const ROW_HEIGHT = 22;
		const PADDING = 8;
		const headerHeight = ROW_HEIGHT + PADDING;
		const rowsHeight = connector.pins.length * ROW_HEIGHT;
		const hasDescription = connector.description && connector.description.trim().length > 0;
		const descriptionRowHeight = hasDescription ? ROW_HEIGHT : 0;
		return headerHeight + rowsHeight + descriptionRowHeight + PADDING;
	}

	private handleConnectorResizeDrag(connector: any, cornerIndex: number, handleX: number, handleY: number, resizeState: any) {
		const PADDING = 8;
		const COL1_WIDTH = 80;
		const COL2_WIDTH = 120;
		const MIN_WIDTH = COL1_WIDTH + COL2_WIDTH + PADDING * 2;
		const MIN_HEIGHT = 22 + PADDING; // At least header height

		let newWidth = resizeState.initialWidth;
		let newHeight = resizeState.initialHeight;
		let newX = resizeState.startX;
		let newY = resizeState.startY;

		// Determine which corner is being dragged and calculate new dimensions
		switch (cornerIndex) {
			case 0: // top-left - resize from top-left
				newWidth = Math.max(MIN_WIDTH, resizeState.initialWidth - (handleX - resizeState.startX));
				newHeight = Math.max(MIN_HEIGHT, resizeState.initialHeight - (handleY - resizeState.startY));
				newX = resizeState.startX + (resizeState.initialWidth - newWidth);
				newY = resizeState.startY + (resizeState.initialHeight - newHeight);
				break;
			case 1: // top-right - resize from top-right
				newWidth = Math.max(MIN_WIDTH, handleX - resizeState.startX);
				newHeight = Math.max(MIN_HEIGHT, resizeState.initialHeight - (handleY - resizeState.startY));
				newY = resizeState.startY + (resizeState.initialHeight - newHeight);
				break;
			case 2: // bottom-right - resize from bottom-right
				newWidth = Math.max(MIN_WIDTH, handleX - resizeState.startX);
				newHeight = Math.max(MIN_HEIGHT, handleY - resizeState.startY);
				break;
			case 3: // bottom-left - resize from bottom-left
				newWidth = Math.max(MIN_WIDTH, resizeState.initialWidth - (handleX - resizeState.startX));
				newHeight = Math.max(MIN_HEIGHT, handleY - resizeState.startY);
				newX = resizeState.startX + (resizeState.initialWidth - newWidth);
				break;
		}

		connector.x = newX;
		connector.y = newY;
		connector.width = newWidth;
		connector.height = newHeight;

		// Update the connector group position and size without destroying
		if ((connector as any).group) {
			const group = (connector as any).group;
			group.x(newX);
			group.y(newY);

			// Update the background rectangle size
			const rect = group.findOne('Rect');
			if (rect && rect.name() !== 'resize-handle' && !rect.name().includes('anchor')) {
				rect.width(newWidth);
				rect.height(newHeight);
			}
		}

		// Update connected wires
		this.updateConnectedWires(connector.id);

		// Draw only the affected layers without full re-render
		this.layer.batchDraw();
		this.wireLayer.batchDraw();
	}
}