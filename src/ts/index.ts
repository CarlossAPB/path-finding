class PathFinderWrapper {
    private container = document.getElementById("grid");
    private rows = document.getElementById("rows") as HTMLInputElement
    private columns = document.getElementById("cols") as HTMLInputElement

    private start = document.getElementById("start")
    private end = document.getElementById("end")
    private obstacle = document.getElementById("obstacle")
    private clear = document.getElementById("clear")
    private generateObstacles = document.getElementById("generate-obstacles")

    private reset: HTMLButtonElement = document.getElementById("reset") as HTMLButtonElement

    private controlSelected: HTMLElement | null = null

    private mode_: PathFinderGridMode = "PATH"
    private pathFinder: PathFinder

    constructor() {
        if (this.container) {
            this.pathFinder = new PathFinder(+this.columns.value, +this.rows.value);
            this.pathFinder.generateRandomObstacles()

            this.container.appendChild(this.pathFinder.element);

            this.rows.addEventListener("change", () => {
                this.pathFinder.h = +this.rows.value
            })
            this.columns.addEventListener("change", () => {
                this.pathFinder.w = +this.columns.value
            })

            this.start.addEventListener("click", (ev) => {
                this.onControlSelected(this.start)
                this.mode = "START"
            })
            this.end.addEventListener("click", () => {
                this.onControlSelected(this.end)
                this.mode = "END"
            })
            this.obstacle.addEventListener("click", () => {
                this.onControlSelected(this.obstacle)
                this.mode = "OBSTACLE"
            })
            this.clear.addEventListener("click", () => {
                this.onControlSelected(this.clear)
                this.mode = "CLEAR"
            })

            this.reset.addEventListener("click", () => {
                this.pathFinder.init()
            })
            this.generateObstacles.addEventListener("click", () => {
                this.pathFinder.start = null
                this.pathFinder.end = null
                this.pathFinder.resetPath()
                this.pathFinder.generateRandomObstacles()
            })
        }
    }

    onControlSelected(control: HTMLElement) {
        if (control) {
            if (control != this.controlSelected) {
                this.controlSelected?.classList.remove("selected")
            }
            if (control.classList.contains("selected")) {
                control.classList.remove("selected")
            } else {
                control.classList.add("selected")
            }
            this.controlSelected = control
        }
    }

    set mode(value: PathFinderGridMode) {
        this.pathFinder.element.classList.remove(this.mode)

        if (this.mode === value) {
            this.mode = "PATH";
            return
        }
        this.mode_ = value
        this.pathFinder.element.classList.add(value)
        this.pathFinder.mode = value
    }
    get mode() {
        return this.mode_
    }
}

new PathFinderWrapper()
