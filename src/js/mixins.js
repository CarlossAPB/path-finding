function PointableElement(Base) {
    return class PointableElement extends Base {
        instantiateNeighbor(x, y, isDiagonal) {
            return {
                x: this.x + x,
                y: this.y + y,
                isDiagonal
            };
        }
        get neighbors() {
            return [
                this.instantiateNeighbor(-1, -1, true),
                this.instantiateNeighbor(0, -1, false),
                this.instantiateNeighbor(1, -1, true),
                this.instantiateNeighbor(-1, 0, false),
                this.instantiateNeighbor(1, 0, false),
                this.instantiateNeighbor(-1, 1, true),
                this.instantiateNeighbor(0, 1, false),
                this.instantiateNeighbor(1, 1, true)
            ].filter(neighbor => neighbor.y >= 0 && neighbor.x >= 0);
        }
    };
}
function SelectablePointedElement(Base) {
    return class PointableElement extends Base {
        generate() {
            this.element = super.generate();
            this.initListeners();
            return this.element;
        }
        initListeners() {
            throw Error("Method is not implemented.");
        }
        onSelected() {
            if (this.listener) {
                this.listener.onPointSelected(this);
            }
        }
    };
}
function RowableElement(Base) {
    return class RowableElement extends Base {
        constructor() {
            super(...arguments);
            this.cells_ = [];
        }
        generateCell(index) {
            throw Error("Method is not implemented.");
        }
        instantiateCell(index) {
            throw Error("Method is not implemented.");
        }
        onCellAppend(cell) {
            throw Error("Method is not implemented.");
        }
        init() {
            for (let i = 0; i < this.w; i++) {
                const cell = this.generateCell(i);
                this.cells.push(cell);
                this.onCellAppend(cell);
            }
        }
        set cells(value) {
            this.cells_ = value;
        }
        get cells() {
            return this.cells_;
        }
    };
}
function GridableElement(Base) {
    return class GridableElement extends Base {
        constructor() {
            super(...arguments);
            this.rows_ = [];
        }
        generateRow(index) {
            throw Error("Method is not implemented.");
        }
        instantiateRow(index) {
            throw Error("Method is not implemented.");
        }
        onRowAppend(row) {
            throw Error("Method is not implemented.");
        }
        init() {
            this.rows = [];
            this.reset();
            for (let i = 0; i < this.h; i++) {
                const row = this.generateRow(i);
                this.rows.push(row);
                this.onRowAppend(row);
            }
        }
        getCell(point) {
            return (this.rows.map(row => row.cells).flat().map(cell => cell)[point.y * this.h + point.x] ?? null);
        }
        getPointNeighbors(point) {
            return point.neighbors.filter(neighbor => neighbor.y <= (this.h - 1) && neighbor.x <= (this.w - 1));
        }
        set rows(value) {
            this.rows_ = value;
        }
        get rows() {
            return this.rows_;
        }
        set w(value) {
            this.w_ = value;
            this.init();
        }
        get w() {
            return this.w_;
        }
        set h(value) {
            this.h_ = value;
            this.init();
        }
        get h() {
            return this.h_;
        }
    };
}
function PaintableGridElement(Base) {
    return class PaintableGridElement extends Base {
        constructor() {
            super(...arguments);
            this.dragging = false;
        }
        mouseDownHandler() { this.dragging = true; }
        mouseUpHandler() { this.dragging = false; }
        mouseMoveHandler(event) {
            if (this.dragging) {
                this.onRowCellSelected(this.rows.map(row => row.cells).flat().find(cell => cell.element === event.target));
            }
        }
        selectPoint(cell) {
            throw Error("Method is not implemented.");
        }
        generate() {
            this.element = super.generate();
            this.initListeners();
            return this.element;
        }
        initListeners() {
            throw Error("Method is not implemented.");
        }
        onRowCellSelected(cell) {
            this.selectPoint(cell);
        }
    };
}
//# sourceMappingURL=mixins.js.map