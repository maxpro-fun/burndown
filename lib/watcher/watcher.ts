import * as fs from "fs";
import { state, IStateActions } from "../statehole/statehole";
import { readFSStructure, IWatchItem } from "./readFsStructure";

export = state<Map<string, IWatchItem>>(async (hole) => {
  const items = await readFSStructure(["./src"]);

  items.forEach((item) => watch(item, hole));

  return items;

  function watch(
    item: IWatchItem,
    hole: IStateActions<Map<string, IWatchItem>>
  ) {
    fs.watch(item.path, undefined, (event: string, fileName: string) => {
      console.log(event, fileName, item.path);
      // hole.update(filess);
    });
  }
});
