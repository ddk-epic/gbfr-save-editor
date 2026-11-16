import { describe, expect, it } from "vitest";
import {
  Attribute,
  EMPTY_HASH,
  hashAttribute,
  keyAttribute,
  keyTable,
  hashId,
} from "@gbfr/core";

const COUNT = Attribute.int(10);
const IDS = Attribute.uintList(11);
const OPTIONAL = Attribute.optional<number>(12, "int");
const FLAGS = Attribute.flags(13, { first: 0x1, second: 0x2, third: 0x8 });
const RAW = Attribute.rawFlags(14);
const NAME = Attribute.text(15, "byte");
const TABLE = keyTable("test", { [hashId("KEY_A")]: "KEY_A" });
const KEY = keyAttribute(16, TABLE);
const HASH = hashAttribute(17);

describe("Attribute.write", () => {
  it("writes a scalar as one value", () => {
    expect(COUNT.write(5, undefined)).toEqual([5]);
    expect(RAW.write(0x2001, [0])).toEqual([0x2001]);
  });

  it("writes a list as given", () => {
    expect(IDS.write([1, 2, 3], [0])).toEqual([1, 2, 3]);
  });

  it("writes an optional value and throws on undefined", () => {
    expect(OPTIONAL.write(4, undefined)).toEqual([4]);
    expect(() => OPTIONAL.write(undefined, [1])).toThrow();
  });

  it("merges flags onto the current bits, keeping unnamed ones", () => {
    expect(FLAGS.write({ second: true }, [0x11])).toEqual([0x13]);
    expect(FLAGS.write({ first: false, third: true }, [0x11])).toEqual([0x18]);
    expect(FLAGS.write({}, [0x11])).toEqual([0x11]);
  });

  it("starts flags from 0 with no current values", () => {
    expect(FLAGS.write({ first: true, third: true }, undefined)).toEqual([9]);
    expect(FLAGS.write({ first: false }, undefined)).toEqual([0]);
  });

  it("pads text with 0 to the stored length", () => {
    expect(NAME.write("Ab", [1, 2, 3, 4])).toEqual([65, 98, 0, 0]);
    expect(NAME.write("", [9, 9])).toEqual([0, 0]);
  });

  it("throws on text longer than the unit or without a unit", () => {
    expect(() => NAME.write("abc", [0, 0])).toThrow();
    expect(() => NAME.write("a", undefined)).toThrow();
  });

  it("writes a key as its hash, a #hex key as that hash, none as empty", () => {
    expect(KEY.write("KEY_A", undefined)).toEqual([hashId("KEY_A")]);
    expect(KEY.write("#0000abcd", undefined)).toEqual([0xabcd]);
    expect(KEY.write(undefined, undefined)).toEqual([EMPTY_HASH]);
  });

  it("writes a hash, none as empty", () => {
    expect(HASH.write(77, undefined)).toEqual([77]);
    expect(HASH.write(undefined, undefined)).toEqual([EMPTY_HASH]);
  });
});
