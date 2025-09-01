// Removed '@testing-library/jest-dom' which isn't installed; add if DOM matchers needed.

// jsdom doesn't implement canvas. Stub getContext so Chart.js doesn't crash during tests.
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
	value: function () {
		return {
			// minimal stub used by chart.js
			save: () => {},
			restore: () => {},
			scale: () => {},
			rotate: () => {},
			translate: () => {},
			beginPath: () => {},
			moveTo: () => {},
			lineTo: () => {},
			arc: () => {},
			closePath: () => {},
			clearRect: () => {},
			fillRect: () => {},
			strokeRect: () => {},
			fillText: () => {},
			measureText: () => ({ width: 0 }),
			setTransform: () => {},
			resetTransform: () => {},
			drawImage: () => {},
			createLinearGradient: () => ({ addColorStop: () => {} }),
			createPattern: () => ({}),
			createRadialGradient: () => ({ addColorStop: () => {} }),
			rect: () => {},
			clip: () => {},
			isPointInPath: () => false,
			isPointInStroke: () => false,
			stroke: () => {},
			fill: () => {},
			canvas: document.createElement('canvas')
		} as any;
	},
});