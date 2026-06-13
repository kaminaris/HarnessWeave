import {
	AfterViewInit,
	Component,
	ElementRef,
	ViewChild,
	effect
} from '@angular/core';

import Konva                              from 'konva';
import { ConnectorService }               from '../Service/ConnectorService';
import { WireService }                    from '../Service/WireService';
import { SelectionService, OverlayState } from '../Service/SelectionService';
import { CanvasRenderService }            from '../Service/CanvasRenderService';
import { WireDisplay }                    from '../Model/WireDisplay';
import { Connector }                      from '../Model/Connector';
import {
	applyConnectorResize,
	ResizeState
}                                         from '../Util/ConnectorLayout';

interface KonvaWire extends WireDisplay {
	line: Konva.Line;
	anchors?: Record<string, Konva.Circle>;
}

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

	private resizeHandles: Konva.Rect[] = [];

	constructor(
		public connectors: ConnectorService,
		public wires: WireService,
		public selection: SelectionService,
		private canvasRender: CanvasRenderService
	) {
		effect(() => {
			const overlay = this.selection.overlay();
			if (!this.anchorLayer || !this.selectionLayer || !this.wireLayer) {
				return;
			}
			this.syncOverlay(overlay);
		});

		effect(() => {
			this.canvasRender.renderTick();
			if (!this.layer) {
				return;
			}
			this.render();
		});

		effect(() => {
			const wire = this.canvasRender.wireAppearanceTick();
			if (!wire || !this.wireLayer) {
				return;
			}
			this.applyWireAppearance(wire as KonvaWire);
		});
	}

	ngAfterViewInit() {
		this.initCanvas();
		this.render();
		// Layers exist now; re-sync overlay in case selection was set before init
		this.syncOverlay(this.selection.overlay());

		window.addEventListener('resize', () => this.onWindowResize());

		this.stage.on('click', (e) => {
			if (e.target === this.stage) {
				this.selection.deselect();
			}
		});
	}

	private applyWireAppearance(wire: KonvaWire) {
		if (wire.line) {
			wire.line.stroke(wire.stroke || '#00ff00');
			wire.line.strokeWidth(wire.strokeWidth || 6);
			this.wireLayer.batchDraw();
		}
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
		this.clearResizeHandles();

		this.renderConnectors();
		this.renderWires();

		this.layer.draw();
		this.wireLayer.draw();
		this.anchorLayer.draw();
		this.selectionLayer.draw();

		this.syncOverlay(this.selection.overlay());
	}

	private syncOverlay(overlay: OverlayState) {
		this.hideWireAnchors();
		this.clearResizeHandles();
		this.resetAllWireAppearance();

		if (!overlay) {
			return;
		}

		if (overlay.type === 'connector-resize') {
			this.showConnectorResizeHandles(overlay.data);
		}
		else if (overlay.type === 'wire-anchors') {
			this.showWireAnchors(overlay.data as KonvaWire);
			const wire = overlay.data as KonvaWire;
			if (wire.line) {
				wire.line.stroke('#ffff00');
				wire.line.strokeWidth(8);
				this.wireLayer.batchDraw();
			}
		}
	}

	private resetAllWireAppearance() {
		if (!this.wireLayer) {
			return;
		}
		for (const wire of this.wires.displayWires as KonvaWire[]) {
			if (wire.line) {
				wire.line.stroke(wire.stroke || '#00ff00');
				wire.line.strokeWidth(wire.strokeWidth || 6);
			}
		}
		this.wireLayer.batchDraw();
	}

	renderConnectors() {
		const layout = this.connectors.getLayoutConstants();
		const { FONT_SIZE, ROW_HEIGHT, PADDING, COL1_WIDTH, COL2_WIDTH } = layout;

		for (const c of this.connectors.connectors) {
			const group = new Konva.Group({
				x: c.x,
				y: c.y,
				draggable: true,
				name: `connector-${ c.id }`
			});

			(c as Connector & { group?: Konva.Group }).group = group;

			const width = this.connectors.getConnectorWidth(c);
			const height = this.connectors.getConnectorHeight(c);
			const headerHeight = this.connectors.getPinRowY(0);

			const rect = new Konva.Rect({
				width,
				height,
				fill: '#1a1a1a',
				stroke: '#555',
				strokeWidth: 2,
				name: 'connector-bg'
			});
			group.add(rect);

			const typeText = new Konva.Text({
				text: c.type || 'Connector',
				fill: '#fff',
				fontSize: FONT_SIZE,
				fontWeight: 'bold',
				x: PADDING,
				y: PADDING / 2,
				width: COL1_WIDTH - PADDING,
				listening: false
			});
			group.add(typeText);

			const nameHeaderText = new Konva.Text({
				text: c.name || 'N/A',
				fill: '#fff',
				fontSize: FONT_SIZE,
				fontWeight: 'bold',
				x: COL1_WIDTH + PADDING * 2,
				y: PADDING / 2,
				width: COL2_WIDTH - PADDING,
				listening: false
			});
			group.add(nameHeaderText);

			group.add(
				new Konva.Line({
					points: [0, headerHeight, width, headerHeight],
					stroke: '#555',
					strokeWidth: 1,
					listening: false
				})
			);

			group.add(
				new Konva.Line({
					points: [COL1_WIDTH + PADDING, 0, COL1_WIDTH + PADDING, height],
					stroke: '#555',
					strokeWidth: 1,
					listening: false
				})
			);

			c.pins.forEach((p, i) => {
				const rowY = this.connectors.getPinRowY(i);

				if (i > 0) {
					group.add(
						new Konva.Line({
							points: [0, rowY, width, rowY],
							stroke: '#333',
							strokeWidth: 1,
							listening: false
						})
					);
				}

				group.add(
					this.createSnapPoint(c.id, p.id, 'left', 0, rowY + ROW_HEIGHT / 2, c, p)
				);

				group.add(
					new Konva.Text({
						text: p.name,
						fill: '#00ff00',
						fontSize: FONT_SIZE,
						x: PADDING,
						y: rowY + (ROW_HEIGHT - FONT_SIZE) / 2,
						width: COL1_WIDTH - PADDING,
						listening: false
					})
				);

				group.add(
					new Konva.Text({
						text: p.description || '',
						fill: '#ccc',
						fontSize: FONT_SIZE,
						x: COL1_WIDTH + PADDING * 2,
						y: rowY + (ROW_HEIGHT - FONT_SIZE) / 2,
						width: COL2_WIDTH - PADDING,
						listening: false
					})
				);

				group.add(
					this.createSnapPoint(
						c.id,
						p.id,
						'right',
						width,
						rowY + ROW_HEIGHT / 2,
						c,
						p
					)
				);
			});

			const hasDescription = c.description && c.description.trim().length > 0;
			if (hasDescription) {
				const descRowY = headerHeight + c.pins.length * ROW_HEIGHT;
				group.add(
					new Konva.Line({
						points: [0, descRowY, width, descRowY],
						stroke: '#333',
						strokeWidth: 1,
						listening: false
					})
				);
				group.add(
					new Konva.Text({
						text: c.description,
						fill: '#aaa',
						fontSize: FONT_SIZE - 2,
						x: PADDING,
						y: descRowY + (ROW_HEIGHT - FONT_SIZE) / 2,
						width: width - PADDING * 2,
						listening: false
					})
				);
			}

			group.on('click', (e) => {
				if ((e.target as Konva.Node & { meta?: unknown }).meta) {
					return;
				}
				this.selection.select({ type: 'connector', data: c });
			});

			group.on('dragmove', () => {
				c.x = group.x();
				c.y = group.y();
				this.wires.updateWiresForConnector(c.id);
				this.redrawAllWireCurves();
				this.wireLayer.batchDraw();

				const selected = this.selection.getSelected();
				if (
					selected?.type === 'connector' &&
					selected.data === c &&
					this.resizeHandles.length > 0
				) {
					this.updateResizeHandlePositions(c);
				}
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
		connector: Connector,
		pin: { id: string; name: string; description?: string }
	) {
		const circle = new Konva.Circle({
			x,
			y,
			radius: 5,
			fill: 'orange',
			stroke: 'black',
			strokeWidth: 1
		});

		(circle as Konva.Circle & { meta: unknown }).meta = { connectorId, pinId, side };

		circle.on('mousedown', (e) => this.startWire(e, circle, connector, side, pinId));
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
			if (!this.wires.activeWire) {
				circle.fill('orange');
			}
		});

		return circle;
	}

	startWire(
		_e: Konva.KonvaEventObject<MouseEvent>,
		circle: Konva.Circle,
		connector: Connector,
		side: 'left' | 'right',
		pinId: string
	) {
		const pos = this.connectors.getSnapPointStagePosition(connector, pinId, side);
		if (!pos) {
			return;
		}

		const from = { connectorId: connector.id, pinId, side };
		this.wires.activeWire = this.wires.createActiveWire(from, pos.x, pos.y);

		const wire = this.wires.activeWire as KonvaWire;
		const line = new Konva.Line({
			points: this.wires.getBezierPoints(wire),
			stroke: wire.stroke,
			strokeWidth: wire.strokeWidth,
			lineCap: 'round',
			lineJoin: 'round',
			hitStrokeWidth: 20
		});

		wire.line = line;
		this.wireLayer.add(line);
		this.disableConnectorDragging();

		this.stage.on('mousemove', () => this.updateWire());
		this.stage.on('mouseup', () => this.finishWire());
	}

	finishWire() {
		if (!this.wires.activeWire) {
			return;
		}

		this.stage.off('mousemove');
		this.stage.off('mouseup');

		this.updateWire();

		const finished = this.wires.commitActiveWire() as KonvaWire;
		if (!finished) {
			return;
		}

		finished.line.on('click', (e) => {
			e.cancelBubble = true;
			this.selection.select({ type: 'wire', data: finished });
		});

		this.layer.find('Circle').forEach((circle) => {
			(circle as Konva.Circle).fill('orange');
		});

		this.enableConnectorDragging();
	}

	private disableConnectorDragging() {
		for (const c of this.connectors.connectors) {
			const group = (c as Connector & { group?: Konva.Group }).group;
			if (group) {
				group.draggable(false);
			}
		}
	}

	private enableConnectorDragging() {
		for (const c of this.connectors.connectors) {
			const group = (c as Connector & { group?: Konva.Group }).group;
			if (group) {
				group.draggable(true);
			}
		}
	}

	updateWire() {
		const wire = this.wires.activeWire as KonvaWire | null;
		if (!wire) {
			return;
		}

		const pos = this.stage.getPointerPosition();
		if (!pos) {
			return;
		}

		const snap = this.connectors.findSnapPointNear(pos.x, pos.y, 40, wire.from);
		const endX = snap ? snap.x : pos.x;
		const endY = snap ? snap.y : pos.y;

		this.wires.updateActiveWireEnd(wire, endX, endY);

		// Update wire.to when snapped to a point
		if (snap) {
			wire.to = {
				connectorId: snap.connector.id,
				pinId: snap.pinId,
				side: snap.side
			};
		} else {
			wire.to = undefined;
		}

		wire.line.points(this.wires.getBezierPoints(wire));
		this.wireLayer.batchDraw();
	}

	renderWires() {
		for (const wire of this.wires.displayWires as KonvaWire[]) {
			const line = new Konva.Line({
				points: this.wires.getBezierPoints(wire),
				stroke: wire.stroke,
				strokeWidth: wire.strokeWidth,
				lineCap: 'round',
				lineJoin: 'round',
				hitStrokeWidth: 20
			});

			wire.line = line;
			line.on('click', (e) => {
				e.cancelBubble = true;
				this.selection.select({ type: 'wire', data: wire });
			});

			this.wireLayer.add(line);
		}
	}

	private redrawAllWireCurves() {
		for (const wire of this.wires.displayWires as KonvaWire[]) {
			if (wire.line) {
				wire.line.points(this.wires.getBezierPoints(wire));
			}
		}
	}

	showWireAnchors(wire: KonvaWire) {
		const startControlLine = new Konva.Line({
			points: [
				wire.startX,
				wire.startY,
				wire.controlStartX,
				wire.controlStartY
			],
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

		const startAnchor = this.createAnchor(
			wire.startX,
			wire.startY,
			'start',
			wire,
			startControlLine,
			endControlLine
		);
		const endAnchor = this.createAnchor(
			wire.endX,
			wire.endY,
			'end',
			wire,
			startControlLine,
			endControlLine
		);
		const controlStartAnchor = this.createAnchor(
			wire.controlStartX,
			wire.controlStartY,
			'controlStart',
			wire,
			startControlLine,
			endControlLine
		);
		const controlEndAnchor = this.createAnchor(
			wire.controlEndX,
			wire.controlEndY,
			'controlEnd',
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
	}

	createAnchor(
		x: number,
		y: number,
		type: string,
		wire: KonvaWire,
		startControlLine: Konva.Line,
		endControlLine: Konva.Line
	) {
		const colors: Record<string, string> = {
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
			name: `anchor-${ type }`
		});

		anchor.on('dragmove', () => {
			const selected = this.selection.getSelected();
			if (selected?.type !== 'wire' || selected.data !== wire) {
				return;
			}

			if (type === 'start') {
				// Check for snap points when dragging start endpoint
				const snap = this.connectors.findSnapPointNear(anchor.x(), anchor.y(), 40, wire.from);
				if (snap) {
					wire.startX = snap.x;
					wire.startY = snap.y;
					anchor.x(snap.x);
					anchor.y(snap.y);
					// Update wire connection
					wire.from = {
						connectorId: snap.connector.id,
						pinId: snap.pinId,
						side: snap.side
					};
				} else {
					wire.startX = anchor.x();
					wire.startY = anchor.y();
				}
				startControlLine.points([
					wire.startX,
					wire.startY,
					wire.controlStartX,
					wire.controlStartY
				]);
			}
			else if (type === 'end') {
				// Check for snap points when dragging end endpoint
				const snap = this.connectors.findSnapPointNear(anchor.x(), anchor.y(), 40, wire.from);
				if (snap) {
					wire.endX = snap.x;
					wire.endY = snap.y;
					anchor.x(snap.x);
					anchor.y(snap.y);
					// Update wire connection
					wire.to = {
						connectorId: snap.connector.id,
						pinId: snap.pinId,
						side: snap.side
					};
				} else {
					wire.endX = anchor.x();
					wire.endY = anchor.y();
				}
				endControlLine.points([
					wire.endX,
					wire.endY,
					wire.controlEndX,
					wire.controlEndY
				]);
			}
			else if (type === 'controlStart') {
				wire.controlStartX = anchor.x();
				wire.controlStartY = anchor.y();
				startControlLine.points([
					wire.startX,
					wire.startY,
					wire.controlStartX,
					wire.controlStartY
				]);
			}
			else if (type === 'controlEnd') {
				wire.controlEndX = anchor.x();
				wire.controlEndY = anchor.y();
				endControlLine.points([
					wire.endX,
					wire.endY,
					wire.controlEndX,
					wire.controlEndY
				]);
			}

			wire.line.points(this.wires.getBezierPoints(wire));
			this.wireLayer.batchDraw();
			this.anchorLayer.batchDraw();
		});

		anchor.on('dragend', () => {
			this.showWireAnchors(wire);
		});

		this.anchorLayer.add(anchor);
		return anchor;
	}

	private showConnectorResizeHandles(connector: Connector) {
		const layout = this.connectors.getLayoutConstants();
		const HANDLE_SIZE = layout.HANDLE_SIZE;

		const width = this.connectors.getConnectorWidth(connector);
		const height = this.connectors.getConnectorHeight(connector);

		const resizeState: ResizeState = {
			startX: connector.x,
			startY: connector.y,
			initialWidth: width,
			initialHeight: height
		};

		const corners = [
			{ x: connector.x, y: connector.y },
			{ x: connector.x + width, y: connector.y },
			{ x: connector.x + width, y: connector.y + height },
			{ x: connector.x, y: connector.y + height }
		];

		this.resizeHandles = corners.map((corner, index) => {
			const handle = new Konva.Rect({
				x: corner.x - HANDLE_SIZE / 2,
				y: corner.y - HANDLE_SIZE / 2,
				width: HANDLE_SIZE,
				height: HANDLE_SIZE,
				fill: '#4CAF50',
				stroke: '#fff',
				strokeWidth: 1,
				draggable: true,
				name: `resize-handle-${ index }`
			});

			handle.on('dragmove', () => {
				this.handleConnectorResizeDrag(
					connector,
					index,
					handle.x() + HANDLE_SIZE / 2,
					handle.y() + HANDLE_SIZE / 2,
					resizeState
				);
				this.updateResizeHandlePositions(connector);
			});

			handle.on('dragend', () => {
				this.canvasRender.requestRender();
				this.selection.select({ type: 'connector', data: connector });
			});

			this.selectionLayer.add(handle);
			return handle;
		});

		this.selectionLayer.draw();
	}

	private updateResizeHandlePositions(connector: Connector) {
		const layout = this.connectors.getLayoutConstants();
		const HANDLE_SIZE = layout.HANDLE_SIZE;
		const width = this.connectors.getConnectorWidth(connector);
		const height = this.connectors.getConnectorHeight(connector);

		const corners = [
			{ x: connector.x, y: connector.y },
			{ x: connector.x + width, y: connector.y },
			{ x: connector.x + width, y: connector.y + height },
			{ x: connector.x, y: connector.y + height }
		];

		corners.forEach((corner, index) => {
			const handle = this.resizeHandles[index];
			if (handle) {
				handle.x(corner.x - HANDLE_SIZE / 2);
				handle.y(corner.y - HANDLE_SIZE / 2);
			}
		});

		this.selectionLayer.batchDraw();
	}

	private clearResizeHandles() {
		this.resizeHandles.forEach((h) => h.destroy());
		this.resizeHandles = [];
	}

	private handleConnectorResizeDrag(
		connector: Connector,
		cornerIndex: number,
		handleCenterX: number,
		handleCenterY: number,
		resizeState: ResizeState
	) {
		applyConnectorResize(
			connector,
			cornerIndex,
			handleCenterX,
			handleCenterY,
			resizeState
		);

		const group = (connector as Connector & { group?: Konva.Group }).group;
		if (group) {
			group.x(connector.x);
			group.y(connector.y);
			const rect = group.findOne('.connector-bg') as Konva.Rect;
			if (rect) {
				rect.width(this.connectors.getConnectorWidth(connector));
				rect.height(this.connectors.getConnectorHeight(connector));
			}
		}

		this.wires.updateWiresForConnector(connector.id);
		this.redrawAllWireCurves();
		this.layer.batchDraw();
		this.wireLayer.batchDraw();
	}
}
