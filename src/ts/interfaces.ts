interface SelectablePointedElementListener {
    onPointSelected(point: PointedElement): void
}

interface SelectableRowCellListener {
    onRowCellSelected(cell: PointedElement): void
}

interface AppElementable<Type> {
    generate(): Type
    reset(): void
}

interface Point {
    x: number
    y: number
}

interface PointNeighbor extends Point {
    isDiagonal: boolean
}

interface CellInstantiator<CellType extends PointedElement<any>> {
    instantiateCell(index: number): CellType
}

interface RowInstantiator<RowType extends RowElement> {
    instantiateRow(index: number): RowType
}

interface ConnectableByLine {
    line: Line
}