import { readFileSync, readdirSync } from "node:fs";

/** Decodes the MessagePack subset the .msg files use. */
function decodeMsgPack(buf: Buffer): unknown {
  let p = 0;
  const str = (n: number) => buf.toString("utf8", p, (p += n));
  const arr = (n: number) => Array.from({ length: n }, read);
  const map = (n: number) => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < n; i++) obj[read() as string] = read();
    return obj;
  };
  function read(): unknown {
    const tag = buf[p++]!;
    if (tag < 0x80) return tag;
    if (tag >= 0xe0) return tag - 0x100;
    if (tag < 0x90) return map(tag & 0x0f);
    if (tag < 0xa0) return arr(tag & 0x0f);
    if (tag < 0xc0) return str(tag & 0x1f);
    const at = p;
    switch (tag) {
      case 0xc0:
        return null;
      case 0xc2:
        return false;
      case 0xc3:
        return true;
      case 0xcc:
        return buf[p++];
      case 0xcd:
        return ((p += 2), buf.readUInt16BE(at));
      case 0xce:
        return ((p += 4), buf.readUInt32BE(at));
      case 0xd0:
        return ((p += 1), buf.readInt8(at));
      case 0xd1:
        return ((p += 2), buf.readInt16BE(at));
      case 0xd2:
        return ((p += 4), buf.readInt32BE(at));
      case 0xd9:
        return str(buf[p++]!);
      case 0xda:
        return ((p += 2), str(buf.readUInt16BE(at)));
      case 0xdb:
        return ((p += 4), str(buf.readUInt32BE(at)));
      case 0xdc:
        return ((p += 2), arr(buf.readUInt16BE(at)));
      case 0xdd:
        return ((p += 4), arr(buf.readUInt32BE(at)));
      case 0xde:
        return ((p += 2), map(buf.readUInt16BE(at)));
      case 0xdf:
        return ((p += 4), map(buf.readUInt32BE(at)));
    }
    throw new Error(`msgpack: tag 0x${tag.toString(16)} at ${at - 1}`);
  }
  return read();
}

type MsgRow = {
  column_: { id_hash_: string; subid_hash_: string; text_: string };
};

/** Text id -> text for one language, preferring the row without a subid. */
export function loadMsg(textDir: string, folder: string): Map<string, string> {
  const dir = `${textDir}/${folder}`;
  const texts = new Map<string, string>();
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".msg") || file.endsWith("_tag.msg")) continue;
    const { rows_ } = decodeMsgPack(readFileSync(`${dir}/${file}`)) as {
      rows_: MsgRow[];
    };
    for (const { column_: c } of rows_)
      if (!c.subid_hash_ || !texts.has(c.id_hash_))
        texts.set(c.id_hash_, c.text_);
  }
  return texts;
}
