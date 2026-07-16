//go:build js && wasm

package main

import (
	"math"
	"syscall/js"
)

func solvePhysicsCost(this js.Value, args []js.Value) any {
	if len(args) < 1 {
		return 0
	}
	baseCost := args[0].Float()
	return math.Round(baseCost * 15.0)
}

func resolveCombatDamage(this js.Value, args []js.Value) any {
	if len(args) < 2 {
		return 0
	}
	damage := args[0].Float()
	armor := args[1].Float()
	reactions := 0.0
	if len(args) > 2 {
		reactions = args[2].Float()
	}
	reduction := 1.0 - math.Exp(-0.35*(armor+reactions*0.5))
	res := damage * math.Max(0.1, 1.0-reduction)
	return math.Round(res)
}

func main() {
	c := make(chan struct{}, 0)
	js.Global().Set("solvePhysicsCost", js.FuncOf(solvePhysicsCost))
	js.Global().Set("resolveCombatDamage", js.FuncOf(resolveCombatDamage))
	<-c
}
