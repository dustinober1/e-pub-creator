import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { EpubPackageAssetFile, EpubPackageResult } from "./package-epub";

const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const MINIMUM_ZIP_VERSION = 20;
const STORE_COMPRESSION_METHOD = 0;
const DOS_EPOCH_TIME = 0;
const DOS_EPOCH_DATE = 0x0021;
const CRC32_TABLE = createCrc32Table();

export interface WriteEpubFileInput {
  projectDirectory: string;
  outputPath: string;
  packageResult: EpubPackageResult;
}

interface ZipEntryInput {
  path: string;
  content: string | Uint8Array;
}

interface PreparedZipEntry {
  path: string;
  data: Uint8Array;
  crc32: number;
  localHeaderOffset: number;
}

export async function writeEpubFile(input: WriteEpubFileInput): Promise<void> {
  const entries = await collectEntries(input.projectDirectory, input.packageResult);
  const archive = createStoredZip(entries);

  await mkdir(dirname(input.outputPath), { recursive: true });
  await writeFile(input.outputPath, archive);
}

async function collectEntries(projectDirectory: string, packageResult: EpubPackageResult): Promise<ZipEntryInput[]> {
  const assetEntries = await Promise.all(
    packageResult.assetFiles.map(async (assetFile) => ({
      path: assetFile.path,
      content: await readAsset(projectDirectory, assetFile)
    }))
  );

  return [...packageResult.files, ...assetEntries];
}

async function readAsset(projectDirectory: string, assetFile: EpubPackageAssetFile): Promise<Uint8Array> {
  assertSafeRelativePath(assetFile.projectPath, "asset project path");
  return readFile(join(projectDirectory, assetFile.projectPath));
}

function createStoredZip(entries: ZipEntryInput[]): Uint8Array {
  const preparedEntries: PreparedZipEntry[] = [];
  const localParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    assertSafeRelativePath(entry.path, "EPUB entry path");
    const data = encodeContent(entry.content);
    const name = encodeUtf8(entry.path);
    const crc32 = calculateCrc32(data);
    const localHeader = createLocalFileHeader(name, data.length, crc32);

    preparedEntries.push({
      path: entry.path,
      data,
      crc32,
      localHeaderOffset: offset
    });
    localParts.push(localHeader, data);
    offset += localHeader.length + data.length;
  }

  const centralDirectoryOffset = offset;
  const centralParts = preparedEntries.map((entry) =>
    createCentralDirectoryHeader(encodeUtf8(entry.path), entry.data.length, entry.crc32, entry.localHeaderOffset)
  );
  const centralDirectorySize = centralParts.reduce((size, part) => size + part.length, 0);
  const endRecord = createEndOfCentralDirectoryRecord(
    preparedEntries.length,
    centralDirectorySize,
    centralDirectoryOffset
  );

  return concatUint8Arrays([...localParts, ...centralParts, endRecord]);
}

function createLocalFileHeader(name: Uint8Array, size: number, crc32: number): Uint8Array {
  const header = new Uint8Array(30 + name.length);
  const view = new DataView(header.buffer);

  view.setUint32(0, LOCAL_FILE_HEADER_SIGNATURE, true);
  view.setUint16(4, MINIMUM_ZIP_VERSION, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, STORE_COMPRESSION_METHOD, true);
  view.setUint16(10, DOS_EPOCH_TIME, true);
  view.setUint16(12, DOS_EPOCH_DATE, true);
  view.setUint32(14, crc32, true);
  view.setUint32(18, size, true);
  view.setUint32(22, size, true);
  view.setUint16(26, name.length, true);
  view.setUint16(28, 0, true);
  header.set(name, 30);

  return header;
}

function createCentralDirectoryHeader(
  name: Uint8Array,
  size: number,
  crc32: number,
  localHeaderOffset: number
): Uint8Array {
  const header = new Uint8Array(46 + name.length);
  const view = new DataView(header.buffer);

  view.setUint32(0, CENTRAL_DIRECTORY_SIGNATURE, true);
  view.setUint16(4, MINIMUM_ZIP_VERSION, true);
  view.setUint16(6, MINIMUM_ZIP_VERSION, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, STORE_COMPRESSION_METHOD, true);
  view.setUint16(12, DOS_EPOCH_TIME, true);
  view.setUint16(14, DOS_EPOCH_DATE, true);
  view.setUint32(16, crc32, true);
  view.setUint32(20, size, true);
  view.setUint32(24, size, true);
  view.setUint16(28, name.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, localHeaderOffset, true);
  header.set(name, 46);

  return header;
}

function createEndOfCentralDirectoryRecord(
  entryCount: number,
  centralDirectorySize: number,
  centralDirectoryOffset: number
): Uint8Array {
  const record = new Uint8Array(22);
  const view = new DataView(record.buffer);

  view.setUint32(0, END_OF_CENTRAL_DIRECTORY_SIGNATURE, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, entryCount, true);
  view.setUint16(10, entryCount, true);
  view.setUint32(12, centralDirectorySize, true);
  view.setUint32(16, centralDirectoryOffset, true);
  view.setUint16(20, 0, true);

  return record;
}

function encodeContent(content: string | Uint8Array): Uint8Array {
  return typeof content === "string" ? encodeUtf8(content) : content;
}

function encodeUtf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function concatUint8Arrays(parts: Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }

  return output;
}

function calculateCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ byte) & 0xff];
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function createCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);

  for (let index = 0; index < table.length; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
}

function assertSafeRelativePath(value: string, fieldName: string): void {
  if (
    value.trim() === "" ||
    value.startsWith("/") ||
    value.includes("\\") ||
    /^[a-z][a-z0-9+.-]*:/i.test(value) ||
    value.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw new Error(`Invalid ${fieldName}: ${value}`);
  }
}
