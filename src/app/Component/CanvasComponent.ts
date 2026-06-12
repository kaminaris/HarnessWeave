import {
	AfterViewInit,
	Component,
	ElementRef,
	ViewChild
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
	) {}

	ngAfterViewInit() {
		this.initCanvas();
		this.render();

		// Handle window resize
		window.addEventListener('resize', () => this.onWindowResize());

		// Handle stage click for deselection
		this.stage.on('click', (e) => {
			if (e.target === this.stage) {
				this.selection.deselect();
				this.hideWireAnchors();
			}
		});
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
		for (const c of this.connectors.connectors) {
			const group = new Konva.Group({ x: c.x, y: c.y });

			const height = c.pins.length * 25 + 30;
			const width = 180;

			const rect = new Konva.Rect({
				width,
				height,
				fill: '#222',
				stroke: '#555'
			});

			group.add(rect);

			group.add(
				new Konva.Text({
					text: c.title,
					fill: 'white',
					x: 10,
					y: 5
				})
			);

			c.pins.forEach((p, i) => {
				const y = 25 + i * 25;

				// left snap
				group.add(
					this.createSnapPoint(c.id, p.id, 'left', 0, y, c, p)
				);

				// label
				group.add(
					new Konva.Text({
						text: p.name,
						fill: '#ccc',
						x: 30,
						y: y - 8
					})
				);

				// right snap
				group.add(
					this.createSnapPoint(c.id, p.id, 'right', width, y, c, p)
				);
			});

			// Add click handler to connector group
			group.on('click', (e) => {
				if (e.target === group || e.target === rect) {
					this.selection.select({
						type: 'connector',
						data: c
					});
					this.hideWireAnchors();
				}
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
			this.hideWireAnchors();
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
			controlEndY: pos.y
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
			stroke: 'lime',
			strokeWidth: 6,
			lineCap: 'round',
			lineJoin: 'round',
			hitStrokeWidth: 20
		});

		this.activeWire.line = line;
		this.wireLayer.add(line);

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
			this.showWireAnchors(finishedWire);
		});

		// Reset snap point colors
		this.layer.find('Circle').forEach((circle: any) => {
			circle.fill('orange');
		});

		this.activeWire = null;
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
}