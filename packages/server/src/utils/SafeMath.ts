export class SafeMath {
  public static clampMin(val: number, min: number): number {
    return Math.max(val, min);
  }

  public static subSaturate(val: number, amount: number): number {
    return Math.max(0, val - amount);
  }
}
