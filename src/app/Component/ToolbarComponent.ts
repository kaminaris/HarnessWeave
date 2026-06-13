import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectionService } from '../Service/SelectionService';

interface WireColor {
	name: string;
	hex: string;
}

@Component({
	selector: 'app-toolbar',
	imports: [CommonModule, FormsModule],
	template: `
		<div class="toolbar">
			<h5 class="p-3 mb-0 border-bottom">Properties</h5>
			<div class="p-3">
				@if (selected(); as selection) {
					@switch (selection.type) {
						@case ('connector') {
							<div class="property-section">
								<h6 class="mb-2">Connector</h6>
								<div class="property">
									<label>Type:</label>
									<input type="text" class="form-control form-control-sm" [(ngModel)]="selection.data.type" (ngModelChange)="onConnectorPropertyChange(selection.data)" placeholder="e.g., JWPF-3" />
								</div>
								<div class="property">
									<label>Name:</label>
									<input type="text" class="form-control form-control-sm" [(ngModel)]="selection.data.name" (ngModelChange)="onConnectorPropertyChange(selection.data)" placeholder="e.g., Main Connector" />
								</div>
								<div class="property">
									<label>Description:</label>
									<textarea class="form-control form-control-sm" [(ngModel)]="selection.data.description" (ngModelChange)="onConnectorPropertyChange(selection.data)" placeholder="e.g., Some example description" rows="2"></textarea>
								</div>

								<hr class="my-2" style="border-color: #444;" />

								<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
									<h6 class="mb-0">Pins ({{ selection.data.pins?.length }})</h6>
									<button class="btn btn-sm btn-success" (click)="addPin(selection.data)">+ Add</button>
								</div>
								
								<div style="max-height: 350px; overflow-y: auto;">
									@for (pin of selection.data.pins; track pin.id) {
										<div class="pin-row">
											<input type="text" class="form-control form-control-sm" [(ngModel)]="pin.name" (ngModelChange)="onConnectorPropertyChange(selection.data)" placeholder="Name" />
											<input type="text" class="form-control form-control-sm" [(ngModel)]="pin.description" (ngModelChange)="onConnectorPropertyChange(selection.data)" placeholder="Desc" />
											<button class="btn-delete-small" (click)="deletePin(selection.data, pin)" title="Delete pin">×</button>
										</div>
									}
								</div>
							</div>
						}
						@case ('pin') {
							<div class="property-section">
								<h6 class="mb-2">Pin</h6>
								<div class="property">
									<label>ID:</label>
									<code class="id-display">{{ selection.data.id }}</code>
								</div>
								<div class="property">
									<label>Name:</label>
									<input type="text" class="form-control form-control-sm" [(ngModel)]="selection.data.name" placeholder="e.g., A0, B1" />
								</div>
								<div class="property">
									<label>Description:</label>
									<input type="text" class="form-control form-control-sm" [(ngModel)]="selection.data.description" placeholder="e.g., TX, RX, GND" />
								</div>
								<hr class="my-2" style="border-color: #444;" />
								<div class="property">
									<label class="small">Connector:</label>
									<span class="text-muted small">{{ selection.metadata?.connector?.title }}</span>
								</div>
								<div class="property">
									<label class="small">Side:</label>
									<span class="text-muted small">{{ selection.metadata?.side === 'left' ? 'Left' : 'Right' }}</span>
								</div>
							</div>
						}
						@case ('wire') {
							<div class="property-section">
								<h6 class="mb-2">Wire</h6>
								<div class="property">
									<label>Thickness:</label>
									<input type="number" class="form-control form-control-sm" [(ngModel)]="selection.data.strokeWidth" (change)="onThicknessChange(selection.data)" min="1" max="20" />
								</div>
								<div class="property">
									<label>Color:</label>
									<div class="color-presets">
										@for (color of wireColors; track color.hex) {
											<button
												class="color-preset"
												[style.background-color]="color.hex"
												[class.active]="selection.data.stroke === color.hex"
												(click)="selectColor(selection.data, color)"
												[title]="color.name"
											></button>
										}
										<button class="color-preset-add" (click)="showColorPicker = !showColorPicker" title="Add custom color">
											+
										</button>
									</div>
									@if (showColorPicker) {
										<div class="color-picker-container">
											<input type="color" class="form-control form-control-sm" [(ngModel)]="customColor" />
											<input type="text" class="form-control form-control-sm mt-2" [(ngModel)]="customColorName" placeholder="Color name" />
											<button class="btn btn-sm btn-primary mt-2 w-100" (click)="addCustomColor(selection.data)">
												Save Color
											</button>
										</div>
									}
								</div>
							</div>
						}
					}
				} @else {
					<p class="text-muted small">Select an object to edit</p>
				}
			</div>
		</div>
	`,
	styles: [
		`
			.toolbar {
				height: 100vh;
				background: #1a1a1a;
				color: #fff;
				border-left: 1px solid #333;
				overflow-y: auto;
			}
			
			.property-section {
				margin-bottom: 20px;
			}
			
			.property {
				margin-bottom: 12px;
			}
			
			.property label {
				display: block;
				font-size: 0.85rem;
				margin-bottom: 4px;
				font-weight: 500;
			}
			
			.form-control {
				background: #2a2a2a;
				border: 1px solid #444;
				color: #fff;
				padding: 4px 8px;
				font-size: 0.85rem;
			}
			
			.form-control:focus {
				background: #2a2a2a;
				border-color: #666;
				color: #fff;
				outline: none;
			}

			.color-presets {
				display: flex;
				gap: 4px;
				flex-wrap: wrap;
				margin-top: 8px;
			}

			.color-preset {
				width: 32px;
				height: 32px;
				border: 2px solid #555;
				border-radius: 4px;
				cursor: pointer;
				transition: all 0.2s;
			}

			.color-preset:hover {
				transform: scale(1.1);
				border-color: #fff;
			}

			.color-preset.active {
				border-color: #fff;
				box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
			}

			.color-preset-add {
				width: 32px;
				height: 32px;
				background: #333;
				border: 2px solid #555;
				border-radius: 4px;
				color: #fff;
				cursor: pointer;
				font-weight: bold;
				font-size: 18px;
				display: flex;
				align-items: center;
				justify-content: center;
				transition: all 0.2s;
			}

			.color-preset-add:hover {
				background: #444;
				border-color: #fff;
			}

			.color-picker-container {
				background: #2a2a2a;
				border: 1px solid #444;
				border-radius: 4px;
				padding: 12px;
				margin-top: 8px;
			}

			.btn {
				background: #0d6efd;
				border: none;
				color: #fff;
				padding: 6px 12px;
				border-radius: 4px;
				cursor: pointer;
				font-size: 0.85rem;
				transition: background 0.2s;
			}

			.btn:hover {
				background: #0b5ed7;
			}

			.mt-2 {
				margin-top: 8px;
			}

			.w-100 {
				width: 100%;
			}

			.id-display {
				display: block;
				background: #1a1a1a;
				border: 1px solid #444;
				border-radius: 4px;
				padding: 6px 8px;
				font-size: 0.8rem;
				font-family: 'Courier New', monospace;
				color: #00ff00;
				word-break: break-all;
				margin-top: 4px;
			}

			.pin-item {
				background: #0d0d0d;
				border: 1px solid #333;
				border-radius: 4px;
				padding: 8px;
				margin-bottom: 8px;
			}

			.pin-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 6px;
			}

			.pin-row {
				display: flex;
				gap: 6px;
				margin-bottom: 6px;
				align-items: stretch;
			}

			.pin-row .form-control {
				min-height: 30px;
				padding: 4px 6px;
				font-size: 0.8rem;
			}

			.pin-row .form-control:first-child {
				flex: 0 0 45%;
			}

			.pin-row .form-control:nth-child(2) {
				flex: 1;
			}

			.btn-delete {
				background: #dc3545;
				border: none;
				color: #fff;
				width: 24px;
				height: 24px;
				padding: 0;
				border-radius: 3px;
				cursor: pointer;
				font-size: 16px;
				line-height: 1;
				transition: background 0.2s;
			}

			.btn-delete:hover {
				background: #bb2d3b;
			}

			.btn-delete-small {
				background: #dc3545;
				border: none;
				color: #fff;
				width: 28px;
				min-width: 28px;
				height: 30px;
				padding: 0;
				border-radius: 3px;
				cursor: pointer;
				font-size: 18px;
				line-height: 1;
				transition: background 0.2s;
				flex-shrink: 0;
			}

			.btn-delete-small:hover {
				background: #bb2d3b;
			}

			.btn-success {
				background: #198754;
				border: none;
				color: #fff;
				padding: 6px 12px;
				border-radius: 4px;
				cursor: pointer;
				font-size: 0.85rem;
				transition: background 0.2s;
			}

			.btn-success:hover {
				background: #157347;
			}

			.d-flex {
				display: flex;
			}

			.gap-1 {
				gap: 8px;
			}

			.d-block {
				display: block;
			}

			.mb-1 {
				margin-bottom: 4px;
			}
		`
	]
})
export class ToolbarComponent implements OnInit {
	wireColors: WireColor[] = [];
	customColor: string = '#ff0000';
	customColorName: string = '';
	showColorPicker: boolean = false;

	private readonly COLORS_STORAGE_KEY = 'harness-weave-wire-colors';
	private readonly DEFAULT_COLORS: WireColor[] = [
		{ name: 'Lime', hex: '#00ff00' },
		{ name: 'Red', hex: '#ff0000' },
		{ name: 'Blue', hex: '#0000ff' },
		{ name: 'Yellow', hex: '#ffff00' },
		{ name: 'Cyan', hex: '#00ffff' },
		{ name: 'Magenta', hex: '#ff00ff' },
		{ name: 'White', hex: '#ffffff' },
		{ name: 'Orange', hex: '#ffa500' }
	];

	constructor(public selection: SelectionService) {}

	ngOnInit() {
		this.loadColors();
	}

	get selected() {
		return this.selection.selectedObject;
	}

	private loadColors() {
		const stored = localStorage.getItem(this.COLORS_STORAGE_KEY);
		if (stored) {
			this.wireColors = JSON.parse(stored);
		} else {
			this.wireColors = [...this.DEFAULT_COLORS];
			this.saveColors();
		}
	}

	private saveColors() {
		localStorage.setItem(this.COLORS_STORAGE_KEY, JSON.stringify(this.wireColors));
	}

	selectColor(wire: any, color: WireColor) {
		wire.stroke = color.hex;
		this.updateWireAppearance(wire);
	}

	onThicknessChange(wire: any) {
		this.updateWireAppearance(wire);
	}

	addCustomColor(wire: any) {
		if (!this.customColorName.trim() || !this.customColor) {
			alert('Please enter both name and color');
			return;
		}

		const newColor: WireColor = {
			name: this.customColorName,
			hex: this.customColor
		};

		// Check if color already exists
		if (this.wireColors.find(c => c.hex === newColor.hex)) {
			alert('This color already exists');
			return;
		}

		this.wireColors.push(newColor);
		this.saveColors();

		// Select the new color
		this.selectColor(wire, newColor);

		// Reset
		this.customColor = '#ff0000';
		this.customColorName = '';
		this.showColorPicker = false;
	}

	private updateWireAppearance(wire: any) {
		// Dispatch custom event to notify canvas of wire property change
		window.dispatchEvent(new CustomEvent('wirePropertyChanged', { detail: wire }));
	}

	addPin(connector: any) {
		if (!connector.pins) {
			connector.pins = [];
		}

		// Generate unique ID
		const pinId = `pin-${connector.id}-${Date.now()}`;

		const newPin: any = {
			id: pinId,
			name: `Pin${connector.pins.length + 1}`,
			description: ''
		};

		connector.pins.push(newPin);

		// Dispatch event to notify canvas to re-render
		window.dispatchEvent(new CustomEvent('connectorChanged', { detail: connector }));
	}

	deletePin(connector: any, pin: any) {
		if (!confirm(`Delete pin "${pin.name}"?`)) {
			return;
		}

		const index = connector.pins.findIndex((p: any) => p.id === pin.id);
		if (index !== -1) {
			connector.pins.splice(index, 1);

			// Dispatch event to notify canvas to re-render
			window.dispatchEvent(new CustomEvent('connectorChanged', { detail: connector }));
		}
	}

	onConnectorPropertyChange(connector: any) {
		// Dispatch event to notify canvas to re-render
		window.dispatchEvent(new CustomEvent('connectorChanged', { detail: connector }));
	}
}


