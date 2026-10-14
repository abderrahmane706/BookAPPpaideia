/**
 * Minimal, dependency-free ZIP writer (STORE method — no compression).
 *
 * PAIDEIA keeps its dependency surface deliberately small; a multi-file backup
 * is the one place a container format is genuinely useful. This writer emits a
 * spec-compliant archive using only stored (uncompressed) entries, which is
 * perfectly valid ZIP and needs no external library.
 *
 * Text is written UTF-8 and the UTF-8 filename flag (bit 11) is always set.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const encoder = new TextEncoder();

function toBytes(content: string | Uint8Array): Uint8Array {
  return typeof content === "string" ? encoder.encode(content) : content;
}

function dosDateTime(date: Date): { time: number; date: number } {
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const day =
    (((date.getFullYear() - 1980) & 0x7f) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();
  return { time, date: day };
}

export interface ZipEntry {
  /** Forward-slash path within the archive. */
  path: string;
  content: string | Uint8Array;
}

function u16(value: number): number[] {
  return [value & 0xff, (value >>> 8) & 0xff];
}

function u32(value: number): number[] {
  return [
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ];
}

/** Build a ZIP archive as a Blob from the given entries. */
export function createZip(entries: ZipEntry[], date = new Date()): Blob {
  const { time, date: dosDate } = dosDateTime(date);
  const localParts: number[] = [];
  const centralParts: number[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.path);
    const data = toBytes(entry.content);
    const crc = crc32(data);

    const localHeader = [
      ...u32(0x04034b50),
      ...u16(20), // version needed
      ...u16(0x0800), // UTF-8 filename flag
      ...u16(0), // store
      ...u16(time),
      ...u16(dosDate),
      ...u32(crc),
      ...u32(data.length),
      ...u32(data.length),
      ...u16(name.length),
      ...u16(0),
    ];
    localParts.push(...localHeader, ...name, ...data);

    const centralHeader = [
      ...u32(0x02014b50),
      ...u16(20), // version made by
      ...u16(20), // version needed
      ...u16(0x0800),
      ...u16(0),
      ...u16(time),
      ...u16(dosDate),
      ...u32(crc),
      ...u32(data.length),
      ...u32(data.length),
      ...u16(name.length),
      ...u16(0), // extra length
      ...u16(0), // comment length
      ...u16(0), // disk number
      ...u16(0), // internal attrs
      ...u32(0), // external attrs
      ...u32(offset),
    ];
    centralParts.push(...centralHeader, ...name);

    offset += localHeader.length + name.length + data.length;
  }

  const centralSize = centralParts.length;
  const end = [
    ...u32(0x06054b50),
    ...u16(0),
    ...u16(0),
    ...u16(entries.length),
    ...u16(entries.length),
    ...u32(centralSize),
    ...u32(offset),
    ...u16(0),
  ];

  return new Blob(
    [new Uint8Array([...localParts, ...centralParts, ...end])],
    { type: "application/zip" },
  );
}
