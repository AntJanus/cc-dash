import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks must be set up before importing the module under test ---

const { mockRevalidatePath } = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

// Import AFTER mocks
import { refreshAllData } from "@/lib/actions/refresh-action";

// --- Tests ---

describe("refreshAllData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls revalidatePath('/', 'layout')", async () => {
    await refreshAllData();

    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(mockRevalidatePath).toHaveBeenCalledTimes(1);
  });

  it("returns void (no errors)", async () => {
    const result = await refreshAllData();

    expect(result).toBeUndefined();
  });
});
