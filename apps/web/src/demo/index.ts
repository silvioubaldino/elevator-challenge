export { DEMO_FLEET, DEMO_SCENARIO } from "./scenario"
export const loadDemoSolution = (): Promise<string> => import("./solution.py?raw").then((m) => m.default)
