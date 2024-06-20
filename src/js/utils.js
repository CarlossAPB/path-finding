class Utils {
    static flipAngle(angle) { return 360 - (180 - angle); }
    static heuristic(point, target) {
        const dx = Math.abs(point.x - target.x);
        const dy = Math.abs(point.y - target.y);
        const minD = Math.min(dx, dy);
        const maxD = Math.max(dx, dy);
        const diagonalSteps = minD;
        const straightSteps = maxD - minD;
        return Math.sqrt(2) * diagonalSteps + straightSteps;
    }
}
//# sourceMappingURL=utils.js.map