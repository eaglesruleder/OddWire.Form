const MASTHEAD_PX = 60;
const LAYER_PX = 48;

export const stickyTop = (depth: number): number =>
    MASTHEAD_PX + depth * LAYER_PX;
