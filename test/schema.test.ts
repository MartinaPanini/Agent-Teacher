import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  ProfileSchema,
  SkillsFileSchema,
  CoursesFileSchema,
  ModulesFileSchema,
  SessionsFileSchema,
  ReviewsFileSchema,
  InboxFileSchema,
  RequestSchema,
} from "../shared/schema.js";

const DATA_DIR = path.resolve(process.cwd(), "data");

function leggi(fileName: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, fileName), "utf-8"));
}

describe("data/*.json reale post-seed valida contro gli schemi Zod", () => {
  it("profile.json", () => expect(() => ProfileSchema.parse(leggi("profile.json"))).not.toThrow());
  it("skills.json", () => expect(() => SkillsFileSchema.parse(leggi("skills.json"))).not.toThrow());
  it("courses.json", () => expect(() => CoursesFileSchema.parse(leggi("courses.json"))).not.toThrow());
  it("modules.json", () => expect(() => ModulesFileSchema.parse(leggi("modules.json"))).not.toThrow());
  it("sessions.json", () => expect(() => SessionsFileSchema.parse(leggi("sessions.json"))).not.toThrow());
  it("reviews.json", () => expect(() => ReviewsFileSchema.parse(leggi("reviews.json"))).not.toThrow());
  it("inbox.json", () => expect(() => InboxFileSchema.parse(leggi("inbox.json"))).not.toThrow());

  it("ogni richiesta in data/requests/ valida contro RequestSchema", () => {
    const dir = path.join(DATA_DIR, "requests");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    for (const f of files) {
      expect(() => RequestSchema.parse(leggi(path.join("requests", f)))).not.toThrow();
    }
  });
});
