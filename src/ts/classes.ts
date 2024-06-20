class AppElement<Type> implements AppElementable<Type> {
    private element_!: Type;

    generate(): Type {
        throw new Error("Method not implemented.");
    }

    reset(): void {
        throw new Error("Method not implemented.");
    }

    set element(value: Type) {
        this.element_ = value
    }
    get element(): Type {
        return this.element_;
    }
}

class PointedElement<Type = any> extends PointableElement(AppElement)<Type> { }

class RowElement<Type = any> extends RowableElement(AppElement)<Type> { }

class GridElement<Type = any> extends GridableElement(AppElement)<Type> { }

class PaintableGrid<Type = any> extends PaintableGridElement(GridElement)<Type> { }

class AppHTMLElement<Type extends HTMLElement = HTMLElement> extends AppElement<Type> {
    protected elementType: keyof HTMLElementTagNameMap
    protected cssClasses: string[]

    constructor(elementType: keyof HTMLElementTagNameMap, cssClasses: string[]) {
        super()
        this.elementType = elementType
        this.cssClasses = cssClasses
        this.element = this.generate()
    }

    override generate(): Type {
        const cell = document.createElement(this.elementType) as Type
        this.cssClasses.forEach(cssClass => cell.classList.add(cssClass))
        return cell;
    }

    reset(): void {
        this.element.setAttribute("class", "")
        this.element.classList.add(...this.cssClasses)
    }
}

class PointedHTMLElement<Type extends HTMLElement = HTMLDivElement> extends PointableElement(AppHTMLElement)<Type> {
    constructor(
        elementType: keyof HTMLElementTagNameMap,
        cssClasses: string[],
        x: number,
        y: number
    ) {
        super(elementType, cssClasses)
        this.x = x
        this.y = y
    }
}

class HTMLCellElement<Type extends HTMLElement = HTMLDivElement> extends PointedHTMLElement<Type> {
    constructor(x: number, y: number) {
        super("div", ["col"], x, y)
        this.x = x
        this.y = y
    }
}

class SelectableHTMLPointedElement<Type extends HTMLElement = HTMLDivElement> extends SelectablePointedElement(HTMLCellElement)<Type> {
    initListeners(): void {
        this.element.addEventListener("click", () => {
            this.onSelected()
        });
    }
}

class HTMLRowElement<Type extends HTMLElement = HTMLDivElement> extends RowableElement
    <
        typeof AppHTMLElement,
        HTMLDivElement,
        HTMLCellElement,
        HTMLDivElement
    >
    (AppHTMLElement)<Type> {

    constructor(w: number, index: number) {
        super("div", ["row"])
        this.w = w;
        this.index = index
        this.init();
    }

    onCellAppend(cell: PointedHTMLElement<HTMLDivElement>): void {
        this.element.appendChild(cell.element);
    }
}


class HTMLGridElement extends GridableElement
    <
        typeof AppHTMLElement,
        HTMLDivElement,
        HTMLRowElement,
        HTMLDivElement,
        HTMLCellElement,
        HTMLDivElement
    >
    (AppHTMLElement)<HTMLDivElement> {

    constructor(w: number, h: number) {
        super("div", ["grid"])
        this.w = w;
        this.h = h;
    }

    onRowAppend(row: HTMLRowElement): void {
        this.element.appendChild(row.element);
    }
}

class PaintableHTMLGrid extends PaintableGridElement(HTMLGridElement) {
    initListeners(): void {
        this.element.addEventListener("mousedown", () => {
            this.mouseDownHandler()
        });
        this.element.addEventListener("mouseup", () => {
            this.mouseUpHandler()
        });
        this.element.addEventListener("mouseleave", () => {
            this.mouseUpHandler()
        });
        this.element.addEventListener("mousemove", (event: MouseEvent) => {
            this.mouseMoveHandler(event)
        });
    }

    reset(): void {
        super.reset()
        this.element.innerHTML = ""
    }
}

class Line extends AppHTMLElement {
    private STROKE = 3

    constructor() {
        super("div", ["line"])
    }

    hide() {
        this.element.style.border = 'none'
    }

    show() {
        this.element.style.border = `${this.STROKE}px solid rgba(137, 43, 226, 1)`
    }

    update(hypot: number, angle: number) {
        this.element.style.top = `calc(50% - ${this.STROKE}px)`;
        this.element.style.width = `${hypot - this.STROKE}px`
        this.element.style.transform = `rotate(${Utils.flipAngle(angle)}deg)`
        this.element.style.borderRadius = `${this.STROKE}px`;
    }
}

class LineConnector {
    start: HTMLElement
    line: Line

    constructor(start: HTMLElement) {
        this.start = start
        this.start.style.position = "relative"
        this.line = new Line()
        this.start.appendChild(this.line.element)
    }

    connect(end: HTMLElement) {
        const el1 = this.start
        const el2 = end
        const getCoords = (rect: DOMRect) => {
            return {
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                bottom: rect.bottom + window.scrollY,
                right: rect.right + window.scrollX
            }
        }
        const coord1 = getCoords(el1.getBoundingClientRect())
        const coord2 = getCoords(el2.getBoundingClientRect())

        const cOps = coord1.top - coord2.top
        const cAdy = coord1.left - coord2.left
        const hypot = Math.hypot(cOps, cAdy)
        const angle = Math.atan2(cOps, cAdy) * 180 / Math.PI

        this.line.update(hypot, angle)
        this.line.show()
    }
}

type PathFinderCellType = "START" | "END" | "OBSTACLE" | "EMPTY-CELL" | "OPEN" | "CLOSE"

class PathFinderCell extends SelectableHTMLPointedElement {
    type_: PathFinderCellType = "EMPTY-CELL"
    lineConnector: LineConnector

    generate(): HTMLDivElement {
        const element = super.generate() as HTMLDivElement
        this.lineConnector = new LineConnector(this.element)
        return element
    }

    set type(value: PathFinderCellType) {
        this.reset()
        this.type_ = value

        switch (value) {
            case "START":
                this.element.classList.add("col", "pointA")
                break
            case "END":
                this.element.classList.add("col", "pointB")
                break
            case "CLOSE":
                this.element.classList.add("col", "close", "rect")
                break
            case "OPEN":
                this.element.classList.add("col", "open")
                break
            case "OBSTACLE":
                this.element.classList.add("col", "obstacle")
                break
            default:
                break
        }
    }
    get type(): PathFinderCellType {
        return this.type_
    }

    get isTransversable() {
        return !Array<PathFinderCellType>("OBSTACLE").includes(this.type)
    }
}

class PathFinderRow extends HTMLRowElement implements SelectablePointedElementListener {
    listener: SelectableRowCellListener

    generateCell(index: number): PathFinderCell {
        const cell = this.instantiateCell(index)
        cell.listener = this
        return cell
    }

    instantiateCell(index: number): PathFinderCell {
        return new PathFinderCell(index, this.index)
    }

    onPointSelected(cell: PathFinderCell): void {
        if (this.listener) {
            this.listener.onRowCellSelected(cell)
        }
    }
}

type PathFinderGridMode = 'START' | 'END' | 'OBSTACLE' | 'CLEAR' | 'PATH'

class PathFinder extends PaintableHTMLGrid {
    private start_: PathFinderCell | null;
    private end_: PathFinderCell | null;
    private mode_: PathFinderGridMode = "PATH"
    private openSet: Set<PathFinderCell>
    private closeSet: Set<PathFinderCell> = new Set([])
    private cameFrom: Map<PathFinderCell, PathFinderCell>
    private path: PathFinderCell[] | null = null

    set mode(value: PathFinderGridMode) {
        this.mode_ = value
    }
    get mode() {
        return this.mode_
    }

    set start(value: PathFinderCell | null) {
        if (this.start_) this.start_.reset()

        this.start_ = value

        if (value) this.start_.type = "START"
    }

    get start() {
        return this.start_
    }

    set end(value: PathFinderCell | null) {
        if (this.end_) this.end_.reset()

        this.end_ = value

        if (value) this.end_.type = "END"
    }

    get end() {
        return this.end_
    }

    init(): void {
        super.init()
        this.start = null
        this.end = null
    }

    generateRow(index: number): PathFinderRow {
        const cell = this.instantiateRow(index)
        cell.listener = this
        return cell
    }

    instantiateRow(index: number): PathFinderRow {
        return new PathFinderRow(this.w, index)
    }

    mouseMoveHandler(event: MouseEvent): void {
        if (this.isDraggableMode(this.mode)) {
            super.mouseMoveHandler(event)
        }
    }

    isDraggableMode(value: PathFinderGridMode) {
        return Array<PathFinderGridMode>("OBSTACLE", "CLEAR", "START", "END").includes(value)
    }


    getCell(point: Point): PathFinderCell {
        return super.getCell(point) as PathFinderCell
    }

    protected resetCellClasses(point: PathFinderCell) {
        if (!point || ["CLOSE", "OPEN"].includes(point.type)) return
        point.type = "EMPTY-CELL"
        point.reset()
    }

    selectPoint(point: PathFinderCell) {
        switch (this.mode) {
            case "START":
                this.resetPath()
                this.start = point
                this.generatePath()
                break
            case "END":
                this.resetPath()
                this.end = point
                this.generatePath()
                break
            case "OBSTACLE":
                this.resetPath()
                point.type = "OBSTACLE"
                this.generatePath()
                break
            case "CLEAR":
                this.resetPath()
                this.resetCellClasses(point)
                this.generatePath()
                break
            default:
                return
        }
    }

    generateRandomObstacles() {
        (this.rows as PathFinderRow[]).forEach(row => {
            (row.cells as PathFinderCell[]).forEach(cell => {
                cell.type = "EMPTY-CELL"
                if (Math.random() < 0.3) cell.type = "OBSTACLE"
            })
        })
    }

    resetPath() {
        this.path?.forEach(item => {
            item.lineConnector.line.hide()
        })
        this.path = null
        this.openSet?.forEach(item => {
            if (item.isTransversable && !["START", "END"].includes(item.type)) {
                item.reset()
            }
        })
        this.closeSet?.forEach(item => {
            if (item.isTransversable && !["START", "END"].includes(item.type)) {
                item.reset()
            }
        })
    }

    generatePath() {
        if (!this.start || !this.end) { return }
        this.pathByAStar()
    }

    pathByAStar() {
        this.openSet = new Set([this.start])
        this.cameFrom = new Map()
        let gScore: Map<PathFinderCell, number> = new Map()
        gScore.set(this.start, 0)
        let fScore = new Map()
        fScore.set(this.start, Utils.heuristic(this.start, this.end))

        while (this.openSet.size > 0) {
            let current: PathFinderCell
            let lowestFScore = Infinity

            for (let node of this.openSet) {
                if (fScore.get(node) < lowestFScore) {
                    current = node
                    lowestFScore = fScore.get(node)
                }
            }

            if (current === this.end) {
                this.reconstructPath(this.cameFrom, current)
                return
            }

            this.openSet.delete(current)
            this.closeSet.add(current)
            current.type = "CLOSE"

            for (let neighbor of this.getNeighbors(current)) {
                let tentativeGScore = gScore.get(current) + 1

                if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)) {
                    this.cameFrom.set(neighbor, current)
                    gScore.set(neighbor, tentativeGScore)
                    fScore.set(neighbor, tentativeGScore + Utils.heuristic(neighbor, this.end))
                    if (!this.openSet.has(neighbor)) {
                        this.openSet.add(neighbor)
                        neighbor.type = "OPEN"
                    }
                }
            }
        }
        return null;
    }

    reconstructPath(cameFrom: Map<PathFinderCell, PathFinderCell>, current: PathFinderCell) {
        this.path = [current];
        let prev: PathFinderCell = current
        while (cameFrom.has(current)) {
            current = cameFrom.get(current);
            this.path.unshift(current);
            if (prev) prev.lineConnector.connect(current.element)
            prev = current
        }
    }

    getNeighbors(point: PathFinderCell) {
        return point.neighbors.map(neighbor => {
            return this.getCell(neighbor)
        }).filter(cell => {
            return cell &&
                cell.isTransversable &&
                Math.abs(cell.x - point.x) <= 1 &&
                Math.abs(cell.y - point.y) <= 1
        })
    }
}