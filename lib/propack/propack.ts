import * as fs from "fs";
import * as path from "path";
import { state } from "../statehole/statehole";

export async function readFSStructure(
  dirs: string[]
): Promise<Map<string, IWatchItem>> {
  const items: Map<string, IWatchItem> = new Map();
  let dirsToRead = dirs.map((d) => path.resolve(d));

  while (dirsToRead.length > 0) {
    const dir = dirsToRead.shift()!;
    items.set(dir, { path: dir, isFile: false, isDirectory: true });

    const paths = await fs.promises
      .readdir(dir, { withFileTypes: true })
      .catch((err) => {
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

const watcher = state(async () => {
  console.log("watcher");
  const files = await readFSStructure(["./src"]);

  files.forEach((file) => {
    fs.watch(file.path, undefined, (event: string, fileName: string) => {
      // console.log(event, fileName, file.path);
      // hole.update(files);
    });
  });

  console.log("watcher - end");

  return files;
});

function test(): number {
  return 1;
}

state<number>(async (hole) => {
  console.log("main");
  const a = hole.useStateHole(watcher);

  console.log("main - end");
  return 3;
})();

// 1. create watcher
// 2. create main
// 3.   - eval main
// 4.   - start eval watcher
// 5.    -eval main
