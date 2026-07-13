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

  it("includes port with default value of 3737", () => {
    const result = ConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.port).toBe(3737);
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
      expect(config).toHaveProperty("display");
    }
  });

  it("returns display defaults for empty object", () => {
    const result = ConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.display.default_view).toBe("board");
      expect(result.data.display.sort_order).toBe("last_updated");
      expect(result.data.display.theme).toBe("light");
    }
  });

  it("accepts custom display preferences", () => {
    const result = ConfigSchema.safeParse({
      display: { default_view: "list", theme: "dark" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.display.default_view).toBe("list");
      expect(result.data.display.theme).toBe("dark");
      // sort_order should still default
      expect(result.data.display.sort_order).toBe("last_updated");
    }
  });

  it("rejects invalid display.theme value", () => {
    const result = ConfigSchema.safeParse({
      display: { theme: "invalid" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid display.default_view value", () => {
    const result = ConfigSchema.safeParse({
      display: { default_view: "grid" },
    });
    expect(result.success).toBe(false);
  });

  it("existing config without display field validates", () => {
    const result = ConfigSchema.safeParse({
      scan_dirs: ["/Users/me/projects"],
      scan_depth: 3,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scan_dirs).toEqual(["/Users/me/projects"]);
      expect(result.data.scan_depth).toBe(3);
      // display should get full defaults
      expect(result.data.display.default_view).toBe("board");
      expect(result.data.display.sort_order).toBe("last_updated");
      expect(result.data.display.theme).toBe("light");
    }
  });

  it("accepts ideas_file alongside existing fields", () => {
    const result = ConfigSchema.safeParse({
      ideas_file: "~/projects/PROJECT_IDEAS.md",
      scan_dirs: ["/Users/me/projects"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ideas_file).toBe("~/projects/PROJECT_IDEAS.md");
      expect(result.data.scan_dirs).toEqual(["/Users/me/projects"]);
    }
  });

  it("accepts empty object without ideas_file (field is optional)", () => {
    const result = ConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ideas_file).toBeUndefined();
    }
  });

  it("Config type includes ideas_file as optional string", () => {
    const result = ConfigSchema.safeParse({
      ideas_file: "/absolute/path/PROJECT_IDEAS.md",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const config: Config = result.data;
      expect(typeof config.ideas_file).toBe("string");
    }
  });
});
