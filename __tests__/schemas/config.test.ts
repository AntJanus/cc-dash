import { describe, it, expect } from "vitest";
import { ConfigSchema, type Config } from "@/lib/schemas/config";

describe("ConfigSchema", () => {
  it("accepts valid full config", () => {
    const input = {
      scan_dirs: ["/Users/me/projects"],
      exclude_dirs: ["node_modules", ".git"],
      explicit_projects: [{ path: "/Users/me/projects/myapp", name: "My App" }],
      scan_depth: 3,
    };
    const result = ConfigSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scan_dirs).toEqual(["/Users/me/projects"]);
      expect(result.data.scan_depth).toBe(3);
      expect(result.data.explicit_projects).toHaveLength(1);
    }
  });

  it("returns defaults for empty object", () => {
    const result = ConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scan_dirs).toEqual([]);
      expect(result.data.exclude_dirs).toEqual([
        "node_modules",
        ".git",
        "vendor",
      ]);
      expect(result.data.scan_depth).toBe(2);
      expect(result.data.explicit_projects).toEqual([]);
    }
  });

  it("rejects scan_depth below 1", () => {
    const result = ConfigSchema.safeParse({ scan_depth: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects scan_depth above 10", () => {
    const result = ConfigSchema.safeParse({ scan_depth: 11 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer scan_depth", () => {
    const result = ConfigSchema.safeParse({ scan_depth: 2.5 });
    expect(result.success).toBe(false);
  });

  it("accepts explicit_projects with path and name", () => {
    const result = ConfigSchema.safeParse({
      explicit_projects: [
        { path: "/a", name: "A" },
        { path: "/b", name: "B" },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.explicit_projects).toHaveLength(2);
      expect(result.data.explicit_projects[0].path).toBe("/a");
      expect(result.data.explicit_projects[0].name).toBe("A");
    }
  });

  it("includes port with default value of 3000", () => {
    const result = ConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.port).toBe(3000);
    }
  });

  it("accepts custom port value", () => {
    const result = ConfigSchema.safeParse({ port: 8080 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.port).toBe(8080);
    }
  });

  it("returns correct Config type shape", () => {
    const result = ConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      const config: Config = result.data;
      expect(config).toHaveProperty("scan_dirs");
      expect(config).toHaveProperty("exclude_dirs");
      expect(config).toHaveProperty("explicit_projects");
      expect(config).toHaveProperty("scan_depth");
      expect(config).toHaveProperty("port");
    }
  });
});
