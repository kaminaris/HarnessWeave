import { Connector } from './Connector';
import { WireDisplay } from './WireDisplay';

export interface HarnessProjectState {
	version: 1;
	connectors: Connector[];
	wires: WireDisplay[];
}
