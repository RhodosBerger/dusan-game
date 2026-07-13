export interface WasmModuleExports {
    solvePhysicsCost?: (baseCost: number, metaId: number, hexId: number) => number;
    resolveCombatDamage?: (damage: number, armor: number, reactions: number) => number;
    [key: string]: any;
}

export class UniversalWasmBridge {
    private moduleInstance: any = null;
    private exports: WasmModuleExports = {};

    constructor() {}

    /**
     * Load compiled WASM binary dynamically (compatible with Node and Browser environments)
     */
    public async loadModule(wasmBinary: ArrayBuffer): Promise<WasmModuleExports> {
        try {
            const { instance } = await WebAssembly.instantiate(wasmBinary, {
                env: {
                    memory: new WebAssembly.Memory({ initial: 256, maximum: 512 }),
                    abort: () => {
                        console.error("[WASM] Aborted execution");
                    }
                }
            });
            this.moduleInstance = instance;
            this.exports = instance.exports as WasmModuleExports;
            return this.exports;
        } catch (error: any) {
            console.warn("[UniversalWasmBridge] compilation error, falling back to local TypeScript math:", error.message);
            return this.getTsFallbacks();
        }
    }

    /**
     * Fallback handlers matching WASM signatures
     */
    public getTsFallbacks(): WasmModuleExports {
        return {
            solvePhysicsCost: (baseCost: number, metaId: number, hexId: number) => {
                return Math.round(baseCost * 15.0);
            },
            resolveCombatDamage: (damage: number, armor: number, reactions: number) => {
                const reduction = 1.0 - Math.exp(-0.35 * (armor + reactions * 0.5));
                return Math.round(damage * Math.max(0.1, 1.0 - reduction));
            }
        };
    }

    public getExports(): WasmModuleExports {
        return Object.keys(this.exports).length > 0 ? this.exports : this.getTsFallbacks();
    }
}
