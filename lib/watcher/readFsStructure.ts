import * as path from "path";
import * as fs from "fs";

export async function readFSStructure(
  dirs: string[]
): Promise<Map<string, IWatchItem>> {
  const { readdir } = fs.promises;
  const items: Map<string, IWatchItem> = new Map();
  let dirsToRead = dirs.map((d) => path.resolve(d));

  while (dirsToRead.length > 0) {
    const dir = dirsToRead.shift()!;
    items.set(dir, { path: dir, isFile: false, isDirectory: true });

    const paths = await readdir(dir, { withFileTypes: true }).catch((err) => {
      console.log(err);
      return [];
    });

    paths.forEach((item) => {
      const isDirectory = item.isDirectory();
      const path = `${dir}/${item.name}`;

      if (isDirectory) {
        dirsToRead.push(path);
      } else {
        items.set(path, { path, isFile: item.isFile(), isDirectory });
      }
    });
  }

  return items;
}

export interface IWatchItem {
  path: string;
  isFile: boolean;
  isDirectory: boolean;
}
