import { Component, signal } from '@angular/core';
import { CanvasComponent }   from './Component/CanvasComponent';
import { ToolbarComponent }  from './Component/ToolbarComponent';

@Component({
	selector: 'app-root',
	imports: [CanvasComponent, ToolbarComponent],
	templateUrl: './app.html',
	styleUrl: './app.scss'
})
export class App {
	protected readonly title = signal('HarnessWeave');
}
