import fs from "node:fs/promises";

export async function setup() {
  await fs.mkdir("test", {});
}

export async function teardown() {
  await fs.rm("test", { recursive: true, force: true });
}
