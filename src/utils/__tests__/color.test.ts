import { withOpacity } from "@/utils/color";

describe("withOpacity", () => {
  it("converts opacity 0.1 to hex alpha '1a'", () => {
    expect(withOpacity("#FFFFFF", 0.1)).toBe("#FFFFFF1a");
  });

  it("converts opacity 1.0 to hex alpha 'ff'", () => {
    expect(withOpacity("#000000", 1.0)).toBe("#000000ff");
  });

  it("converts opacity 0.0 to hex alpha '00'", () => {
    expect(withOpacity("#FF5733", 0.0)).toBe("#FF573300");
  });

  it("clamps opacity above 1.0 to 'ff'", () => {
    expect(withOpacity("#FFFFFF", 1.5)).toBe("#FFFFFFff");
  });

  it("clamps opacity below 0.0 to '00'", () => {
    expect(withOpacity("#FFFFFF", -0.5)).toBe("#FFFFFF00");
  });
});
