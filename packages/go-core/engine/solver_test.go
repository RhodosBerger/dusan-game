package engine

import (
	"testing"
)

func TestSolveRuleOfThree_Ohm(t *testing.T) {
	vVal := 12.0
	rVal := 4.0
	req := SolveRequest{
		Type: "ohm",
		V:    &vVal,
		R:    &rVal,
	}

	resp, err := SolveRuleOfThree(req)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	expectedI := 3.0
	if resp.I != expectedI {
		t.Errorf("Expected I = %f, got: %f", expectedI, resp.I)
	}
}

func TestSolveRuleOfThree_Direct(t *testing.T) {
	a1 := 10.0
	b1 := 2.0
	b2 := 4.0
	req := SolveRequest{
		Type: "direct",
		A1:   &a1,
		B1:   &b1,
		B2:   &b2,
	}

	resp, err := SolveRuleOfThree(req)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	expectedResult := 20.0
	if resp.Result != expectedResult {
		t.Errorf("Expected result = %f, got: %f", expectedResult, resp.Result)
	}
}
