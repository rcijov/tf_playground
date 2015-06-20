///<reference path='Transform.ts' />
interface Data {
	x: double; y: double; label: int;
}

class NetworkVisualization {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	trafo: Transform;
	showGradient: boolean;
	data: Data[];
	dragged = 0; // ignore clicks if dragged
	colors = {
		bg: ["#f88", "#8f8"],
		fg: ["#f00", "#0f0"],
		gradient: (val: number) => "rgb(" + [((1 - val) * 256) | 0, (val * 256) | 0, 0] + ")"
	}

	constructor(outputCanvas: HTMLCanvasElement, trafo: Transform, data: Data[]) {
		this.canvas = outputCanvas;
		this.ctx = <CanvasRenderingContext2D>this.canvas.getContext('2d');
		this.trafo = trafo;
		this.data = data;
		this.canvasResized();
		window.addEventListener('resize', this.canvasResized.bind(this));
		this.canvas.addEventListener("click", this.canvasClicked.bind(this));
		this.canvas.addEventListener("mousedown", () => this.dragged = 0);
		this.canvas.addEventListener("mousemove", () => this.dragged++);
		this.canvas.addEventListener("contextmenu", this.canvasClicked.bind(this));
	}

	drawDataPoints() {
		this.ctx.strokeStyle = "#000";
		for (let val of this.data) {
			this.ctx.fillStyle = this.colors.fg[val.label | 0];
			this.ctx.beginPath();
			this.ctx.arc(this.trafo.toCanvas.x(val.x), this.trafo.toCanvas.y(val.y), 5, 0, 2 * Math.PI);
			this.ctx.fill();
			this.ctx.arc(this.trafo.toCanvas.x(val.x), this.trafo.toCanvas.y(val.y), 5, 0, 2 * Math.PI);
			this.ctx.stroke();
		}
	}
	drawBackground(resolution: int, classify: (x: double, y: double) => int) {
		for (let x = 0; x < this.canvas.width; x += resolution) {
			for (let y = 0; y < this.canvas.height; y += resolution) {
				let val = classify(this.trafo.toReal.x(x), this.trafo.toReal.y(y));

				if (this.showGradient) {
					this.ctx.fillStyle = this.colors.gradient(val);
				} else this.ctx.fillStyle = this.colors.bg[(val + 0.5) | 0];
				this.ctx.fillRect(x, y, resolution, resolution);
			}
		}
	}
	drawCoordinateSystem() {
		let marklen = 0.2;
		let ctx = this.ctx, toc = this.trafo.toCanvas;
		ctx.strokeStyle = "#000";
		ctx.fillStyle = "#000";
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.font = "20px monospace";
		ctx.beginPath();

		ctx.moveTo(toc.x(0), 0);
		ctx.lineTo(toc.x(0), this.canvas.height);

		ctx.moveTo(toc.x(-marklen / 2), toc.y(1));
		ctx.lineTo(toc.x(marklen / 2), toc.y(1));
		ctx.fillText("1", toc.x(-marklen), toc.y(1));

		ctx.moveTo(0, toc.y(0));
		ctx.lineTo(this.canvas.width, toc.y(0));

		ctx.moveTo(toc.x(1), toc.y(-marklen / 2));
		ctx.lineTo(toc.x(1), toc.y(marklen / 2));
		ctx.fillText("1", toc.x(1), toc.y(-marklen));
		ctx.stroke();
	}
	canvasResized() {
		this.canvas.width = $(this.canvas).width();
		this.canvas.height = $(this.canvas).height();
	}
	canvasClicked(evt: MouseEvent) {
		if (this.dragged > 10) return;
		let rect = this.canvas.getBoundingClientRect();
		let x = this.trafo.toReal.x(evt.clientX - rect.left);
		let y = this.trafo.toReal.y(evt.clientY - rect.top);
		if (evt.button == 2 || evt.shiftKey) {
			//remove nearest
			let nearestDist = Infinity, nearest = -1;
			for (let i = 0; i < this.data.length; i++) {
				let p = this.data[i];
				let dx = p.x - x, dy = p.y - y;
				if (dx * dx + dy * dy < nearestDist) nearest = i;
			}
			if (nearest >= 0) this.data.splice(nearest, 1);
		} else {
			let label = evt.button == 0 ? 0 : 1;
			if(evt.ctrlKey) label = label == 0 ? 1 : 0;
			this.data.push({ x: x, y: y, label: label });
			this.drawDataPoints();
		}
		evt.preventDefault();
	}
}