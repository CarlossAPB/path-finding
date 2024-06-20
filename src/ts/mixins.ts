function PointableElement<Element extends Elementable<ElementType>, ElementType>(Base: Element) {
    return class PointableElement extends Base implements Point {
        x: number;
        y: number;

        instantiateNeighbor(x: number, y: number, isDiagonal: boolean): PointNeighbor {
            return {
                x: this.x + x,
                y: this.y + y,
                isDiagonal
            }
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
            ].filter(neighbor => neighbor.y >= 0 && neighbor.x >= 0)
        }
    }
}

function SelectablePointedElement<PointedElement extends PointableElement<ElementType>, ElementType>(Base: PointedElement) {
    return class PointableElement extends Base {
        listener: SelectablePointedElementListener

        generate(): ElementType {
            this.element = super.generate() as ElementType
            this.initListeners()
            return this.element
        }

        initListeners(): void {
            throw Error("Method is not implemented.")
        }

        onSelected() {
            if (this.listener) {
                this.listener.onPointSelected(this)
            }
        }
    }
}

function RowableElement<
    Element extends Elementable<ElementType>,
    ElementType,
    CellType extends PointedElement<CellElementType>,
    CellElementType
>
    (Base: Element) {
    return class RowableElement extends Base implements CellInstantiator<CellType> {
        w: number;
        index: number
        private cells_: CellType[] = [];

        generateCell(index: number): CellType {
            throw Error("Method is not implemented.")
        }

        instantiateCell(index: number): CellType {
            throw Error("Method is not implemented.")
        }

        onCellAppend(cell: CellType) {
            throw Error("Method is not implemented.")
        }

        protected init(): void {
            for (let i = 0; i < this.w; i++) {
                const cell = this.generateCell(i);
                this.cells.push(cell);
                this.onCellAppend(cell)
            }
        }

        set cells(value: CellType[]) {
            this.cells_ = value
        }
        get cells(): CellType[] {
            return this.cells_
        }
    }
}
function GridableElement<
    Element extends Elementable<ElementType>,
    ElementType,
    RowType extends RowElement<RowElementType>,
    RowElementType,
    CellType extends PointedElement<CellElementType>,
    CellElementType
>
    (Base: Element) {
    return class GridableElement extends Base implements RowInstantiator<RowType> {
        w_: number;
        h_: number;
        private rows_: RowType[] = [];

        generateRow(index: number): RowType {
            throw Error("Method is not implemented.")
        }

        instantiateRow(index: number): RowType {
            throw Error("Method is not implemented.")
        }

        onRowAppend(row: RowType) {
            throw Error("Method is not implemented.")
        }

        init(): void {
            this.rows = []
            this.reset()
            for (let i = 0; i < this.h; i++) {
                const row = this.generateRow(i);
                this.rows.push(row);
                this.onRowAppend(row)
            }
        }

        protected getCell(point: Point): CellType | null {
            return (
                this.rows.map(row => row.cells).flat().map(cell => cell)[point.y * this.h + point.x] ?? null
            ) as CellType | null
        }

        protected getPointNeighbors(point: CellType) {
            return point.neighbors.filter(neighbor => neighbor.y <= (this.h - 1) && neighbor.x <= (this.w - 1))
        }

        set rows(value: RowType[]) {
            this.rows_ = value
        }
        get rows(): RowType[] {
            return this.rows_
        }

        set w(value: number) {
            this.w_ = value
            this.init();
        }
        get w() {
            return this.w_
        }

        set h(value: number) {
            this.h_ = value
            this.init();
        }
        get h() {
            return this.h_
        }
    }
}

function PaintableGridElement<
    GridElement extends GridableElement<ElementType>,
    ElementType,
    CellType extends PointedElement<CellElementType>,
    CellElementType
>
    (Base: GridElement) {
    return class PaintableGridElement extends Base implements SelectableRowCellListener {
        dragging: boolean = false

        mouseDownHandler() { this.dragging = true }
        mouseUpHandler() { this.dragging = false }

        mouseMoveHandler(event: MouseEvent) {
            if (this.dragging) {
                this.onRowCellSelected(
                    this.rows.map(row => row.cells).flat().find(cell => cell.element === event.target) as CellType
                )
            }
        }

        selectPoint(cell: CellType): void {
            throw Error("Method is not implemented.")
        }

        generate(): ElementType {
            this.element = super.generate() as ElementType
            this.initListeners()
            return this.element
        }

        initListeners(): void {
            throw Error("Method is not implemented.")
        }

        onRowCellSelected(cell: CellType): void {
            this.selectPoint(cell);
        }
    }
}