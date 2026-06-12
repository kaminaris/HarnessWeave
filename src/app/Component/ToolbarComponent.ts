import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectionService } from '../Service/SelectionService';

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
									<label>Name:</label>
									<input type="text" class="form-control form-control-sm" [(ngModel)]="selection.data.title" />
								</div>
								<div class="property">
									<label>X Position:</label>
									<input type="number" class="form-control form-control-sm" [(ngModel)]="selection.data.x" />
								</div>
								<div class="property">
									<label>Y Position:</label>
									<input type="number" class="form-control form-control-sm" [(ngModel)]="selection.data.y" />
								</div>
								<div class="property">
									<label>Pins: {{ selection.data.pins?.length }}</label>
								</div>
							</div>
						}
						@case ('pin') {
							<div class="property-section">
								<h6 class="mb-2">Pin</h6>
								<div class="property">
									<label>Name:</label>
									<input type="text" class="form-control form-control-sm" [(ngModel)]="selection.data.name" />
								</div>
								<div class="property">
									<label>Connector:</label>
									<span class="text-muted small">{{ selection.metadata?.connector?.title }}</span>
								</div>
								<div class="property">
									<label>Side:</label>
									<span class="text-muted small">{{ selection.metadata?.side }}</span>
								</div>
							</div>
						}
						@case ('wire') {
							<div class="property-section">
								<h6 class="mb-2">Wire</h6>
								<div class="property">
									<label>Start X:</label>
									<input type="number" class="form-control form-control-sm" [(ngModel)]="selection.data.startX" />
								</div>
								<div class="property">
									<label>Start Y:</label>
									<input type="number" class="form-control form-control-sm" [(ngModel)]="selection.data.startY" />
								</div>
								<div class="property">
									<label>End X:</label>
									<input type="number" class="form-control form-control-sm" [(ngModel)]="selection.data.endX" />
								</div>
								<div class="property">
									<label>End Y:</label>
									<input type="number" class="form-control form-control-sm" [(ngModel)]="selection.data.endY" />
								</div>
								<hr class="my-2" style="border-color: #444;" />
								<h6 class="mb-2 small">Control Points</h6>
								<div class="property">
									<label class="small">Start Control X:</label>
									<input type="number" class="form-control form-control-sm" [(ngModel)]="selection.data.controlStartX" />
								</div>
								<div class="property">
									<label class="small">Start Control Y:</label>
									<input type="number" class="form-control form-control-sm" [(ngModel)]="selection.data.controlStartY" />
								</div>
								<div class="property">
									<label class="small">End Control X:</label>
									<input type="number" class="form-control form-control-sm" [(ngModel)]="selection.data.controlEndX" />
								</div>
								<div class="property">
									<label class="small">End Control Y:</label>
									<input type="number" class="form-control form-control-sm" [(ngModel)]="selection.data.controlEndY" />
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
		`
	]
})
export class ToolbarComponent {
	constructor(public selection: SelectionService) {}

	get selected() {
		return this.selection.selectedObject;
	}
}


