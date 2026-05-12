import fs from 'node:fs/promises';
import path from 'node:path';

type ResolveDirectory = () => Promise<string>;

type ReadDiskRecordOpts<TRecord> = {
  getDirectory: ResolveDirectory;
  extension: `.${string}`;
  exclude?: ReadonlySet<string>;
  parseRecord: (opts: { slug: string; raw: string; filename: string }) => Promise<TRecord | null> | TRecord | null;
};

export async function readDiskRecords<TRecord>({
  getDirectory,
  extension,
  exclude = new Set<string>(),
  parseRecord,
}: ReadDiskRecordOpts<TRecord>): Promise<TRecord[]> {
  const directory = await getDirectory();

  let filenames: string[];
  try {
    filenames = await fs.readdir(directory);
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const records: TRecord[] = [];
  for (const filename of filenames) {
    if (!filename.endsWith(extension)) continue;
    const slug = path.basename(filename, extension);
    if (exclude.has(slug)) continue;
    const raw = await fs.readFile(path.join(directory, filename), 'utf8');
    const record = await parseRecord({ slug, raw, filename });
    if (record) {
      records.push(record);
    }
  }

  return records;
}
