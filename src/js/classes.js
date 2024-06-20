class AppElement {
    generate() {
        throw new Error("Method not implemented.");
    }
    reset() {
        throw new Error("Method not implemented.");
    }
    set element(value) {
        this.element_ = value;
    }
    get element() {
        return this.element_;
    }
}
class PointedElement extends PointableElement(AppElement) {
}
class RowElement extends RowableElement(AppElement) {
}
class GridElement extends GridableElement(AppElement) {
}
class PaintableGrid extends PaintableGridElement(GridElement) {
}
class AppHTMLElement extends AppElement {
    constructor(elementType, cssClasses) {
        super();
        this.elementType = elementType;
        this.cssClasses = cssClasses;
        this.element = this.generate();
    }
    generate() {
        const cell = document.createElement(this.elementType);
        this.cssClasses.forEach(cssClass => cell.classList.add(cssClass));
        return cell;
    }
    reset() {
        this.element.setAttribute("class", "");
        this.element.classList.add(...this.cssClasses);
    }
}
class PointedHTMLElement extends PointableElement(AppHTMLElement) {
    constructor(elementType, cssClasses, x, y) {
        super(elementType, cssClasses);
        this.x = x;
        this.y = y;
    }
}
class HTMLCellElement extends PointedHTMLElement {
    constructor(x, y) {
        super("div", ["col"], x, y);
        this.x = x;
        this.y = y;
    }
}
class SelectableHTMLPointedElement extends SelectablePointedElement(HTMLCellElement) {
    initListeners() {
        this.element.addEventListener("click", () => {
            this.onSelected();
        });
    }
}
class HTMLRowElement extends RowableElement(AppHTMLElement) {
    constructor(w, index) {
        super("div", ["row"]);
        this.w = w;
        this.index = index;
        this.init();
    }
    onCellAppend(cell) {
        this.element.appendChild(cell.element);
    }
}
class HTMLGridElement extends GridableElement(AppHTMLElement) {
    constructor(w, h) {
        super("div", ["grid"]);
        this.w = w;
        this.h = h;
    }
    onRowAppend(row) {
        this.element.appendChild(row.element);
    }
}
class PaintableHTMLGrid extends PaintableGridElement(HTMLGridElement) {
    initListeners() {
        this.element.addEventListener("mousedown", () => {
            this.mouseDownHandler();
        });
        this.element.addEventListener("mouseup", () => {
            this.mouseUpHandler();
        });
        this.element.addEventListener("mouseleave", () => {
            this.mouseUpHandler();
        });
        this.element.addEventListener("mousemove", (event) => {
            this.mouseMoveHandler(event);
        });
    }
    reset() {
        super.reset();
        this.element.innerHTML = "";
    }
}
class Line extends AppHTMLElement {
    constructor() {
        super("div", ["line"]);
        this.STROKE = 3;
    }
    hide() {
        this.element.style.border = 'none';
    }
    show() {
        this.element.style.border = `${this.STROKE}px solid rgba(137, 43, 226, 1)`;
    }
    update(hypot, angle) {
        this.element.style.top = `calc(50% - ${this.STROKE}px)`;
        this.element.style.width = `${hypot - this.STROKE}px`;
        this.element.style.transform = `rotate(${Utils.flipAngle(angle)}deg)`;
        this.element.style.borderRadius = `${this.STROKE}px`;
    }
}
class LineConnector {
    constructor(start) {
        this.start = start;
        this.start.style.position = "relative";
        this.line = new Line();
        this.start.appendChild(this.line.element);
    }
    connect(end) {
        const el1 = this.start;
        const el2 = end;
        const getCoords = (rect) => {
            return {
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                bottom: rect.bottom + window.scrollY,
                right: rect.right + window.scrollX
            };
        };
        const coord1 = getCoords(el1.getBoundingClientRect());
        const coord2 = getCoords(el2.getBoundingClientRect());
        const cOps = coord1.top - coord2.top;
        const cAdy = coord1.left - coord2.left;
        const hypot = Math.hypot(cOps, cAdy);
        const angle = Math.atan2(cOps, cAdy) * 180 / Math.PI;
        this.line.update(hypot, angle);
        this.line.show();
    }
}
class PathFinderCell extends SelectableHTMLPointedElement {
    constructor() {
        super(...arguments);
        this.type_ = "EMPTY-CELL";
    }
    generate() {
        const element = super.generate();
        this.lineConnector = new LineConnector(this.element);
        return element;
    }
    set type(value) {
        this.reset();
        this.type_ = value;
        switch (value) {
            case "START":
                this.element.classList.add("col", "pointA");
                break;
            case "END":
                this.element.classList.add("col", "pointB");
                break;
            case "CLOSE":
                this.element.classList.add("col", "close", "rect");
                break;
            case "OPEN":
                this.element.classList.add("col", "open");
                break;
            case "OBSTACLE":
                this.element.classList.add("col", "obstacle");
                break;
            default:
                break;
        }
    }
    get type() {
        return this.type_;
    }
    get isTransversable() {
        return !Array("OBSTACLE").includes(this.type);
    }
}
class PathFinderRow extends HTMLRowElement {
    generateCell(index) {
        const cell = this.instantiateCell(index);
        cell.listener = this;
        return cell;
    }
    instantiateCell(index) {
        return new PathFinderCell(index, this.index);
    }
    onPointSelected(cell) {
        if (this.listener) {
            this.listener.onRowCellSelected(cell);
        }
    }
}
class PathFinder extends PaintableHTMLGrid {
    constructor() {
        super(...arguments);
        this.mode_ = "PATH";
        this.closeSet = new Set([]);
        this.path = null;
    }
    set mode(value) {
        this.mode_ = value;
    }
    get mode() {
        return this.mode_;
    }
    set start(value) {
        if (this.start_)
            this.start_.reset();
        this.start_ = value;
        if (value)
            this.start_.type = "START";
    }
    get start() {
        return this.start_;
    }
    set end(value) {
        if (this.end_)
            this.end_.reset();
        this.end_ = value;
        if (value)
            this.end_.type = "END";
    }
    get end() {
        return this.end_;
    }
    init() {
        super.init();
        this.start = null;
        this.end = null;
    }
    generateRow(index) {
        const cell = this.instantiateRow(index);
        cell.listener = this;
        return cell;
    }
    instantiateRow(index) {
        return new PathFinderRow(this.w, index);
    }
    mouseMoveHandler(event) {
        if (this.isDraggableMode(this.mode)) {
            super.mouseMoveHandler(event);
        }
    }
    isDraggableMode(value) {
        return Array("OBSTACLE", "CLEAR", "START", "END").includes(value);
    }
    getCell(point) {
        return super.getCell(point);
    }
    resetCellClasses(point) {
        if (!point || ["CLOSE", "OPEN"].includes(point.type))
            return;
        point.type = "EMPTY-CELL";
        point.reset();
    }
    selectPoint(point) {
        switch (this.mode) {
            case "START":
                this.resetPath();
                this.start = point;
                this.generatePath();
                break;
            case "END":
                this.resetPath();
                this.end = point;
                this.generatePath();
                break;
            case "OBSTACLE":
                this.resetPath();
                point.type = "OBSTACLE";
                this.generatePath();
                break;
            case "CLEAR":
                this.resetPath();
                this.resetCellClasses(point);
                this.generatePath();
                break;
            default:
                return;
        }
    }
    generateRandomObstacles() {
        this.rows.forEach(row => {
            row.cells.forEach(cell => {
                cell.type = "EMPTY-CELL";
                if (Math.random() < 0.3)
                    cell.type = "OBSTACLE";
            });
        });
    }
    resetPath() {
        this.path?.forEach(item => {
            item.lineConnector.line.hide();
        });
        this.path = null;
        this.openSet?.forEach(item => {
            if (item.isTransversable && !["START", "END"].includes(item.type)) {
                item.reset();
            }
        });
        this.closeSet?.forEach(item => {
            if (item.isTransversable && !["START", "END"].includes(item.type)) {
                item.reset();
            }
        });
    }
    generatePath() {
        if (!this.start || !this.end) {
            return;
        }
        this.pathByAStar();
    }
    pathByAStar() {
        this.openSet = new Set([this.start]);
        this.cameFrom = new Map();
        let gScore = new Map();
        gScore.set(this.start, 0);
        let fScore = new Map();
        fScore.set(this.start, Utils.heuristic(this.start, this.end));
        while (this.openSet.size > 0) {
            let current;
            let lowestFScore = Infinity;
            for (let node of this.openSet) {
                if (fScore.get(node) < lowestFScore) {
                    current = node;
                    lowestFScore = fScore.get(node);
                }
            }
            if (current === this.end) {
                this.reconstructPath(this.cameFrom, current);
                return;
            }
            this.openSet.delete(current);
            this.closeSet.add(current);
            current.type = "CLOSE";
            for (let neighbor of this.getNeighbors(current)) {
                let tentativeGScore = gScore.get(current) + 1;
                if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)) {
                    this.cameFrom.set(neighbor, current);
                    gScore.set(neighbor, tentativeGScore);
                    fScore.set(neighbor, tentativeGScore + Utils.heuristic(neighbor, this.end));
                    if (!this.openSet.has(neighbor)) {
                        this.openSet.add(neighbor);
                        neighbor.type = "OPEN";
                    }
                }
            }
        }
        return null;
    }
    reconstructPath(cameFrom, current) {
        this.path = [current];
        let prev = current;
        while (cameFrom.has(current)) {
            current = cameFrom.get(current);
            this.path.unshift(current);
            if (prev)
                prev.lineConnector.connect(current.element);
            prev = current;
        }
    }
    getNeighbors(point) {
        return point.neighbors.map(neighbor => {
            return this.getCell(neighbor);
        }).filter(cell => {
            return cell &&
                cell.isTransversable &&
                Math.abs(cell.x - point.x) <= 1 &&
                Math.abs(cell.y - point.y) <= 1;
        });
    }
}
//# sourceMappingURL=classes.js.map