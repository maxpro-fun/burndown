import * as fs from "fs";
import * as path from "path";

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

namespace StateHole {
  const states = new Map<State<any>, any>();

  class State<T> implements IState<T>, IStateActions<T> {
    constructor(private stateFn: TStateFunction<T>) {
      this.init();
    }

    private async init() {
      this._value = await Promise.resolve(this.stateFn(this));
    }

    private _value: T | undefined = undefined;
    private _subscribers: State<any>[] = [];

    public update(newState: T): void {
      this._value = newState;

      console.log("this._subscribers", this._subscribers.length);

      const subs = this._subscribers;
      this._subscribers = [];

      subs.forEach((s) => s.stateFn(s));
    }

    public useStateHole<AnyT>(state: State<AnyT>): AnyT {
      state._subscribers.push(this);

      let value = states.get(state as any);

      if (!value) {
        value = state.getValue();
        states.set(state as any, value);
      }

      return value;
    }

    public getValue(): T | undefined {
      return this._value;
    }
  }

  export function state<T>(stateFn: TStateFunction<T>): IState<T> {
    return new State(stateFn);
  }

  interface IState<T> {
    getValue(): T | undefined;
  }

  interface IStateActions<T> {
    update: (newState: T) => void;
    useStateHole<AnyT>(state: IState<AnyT>): void;
  }

  type TStateFunction<T> =
    | TStatePromiseFunction<T>
    | TStateNonPromiseFunction<T>;
  type TStatePromiseFunction<T> = (hole: IStateActions<T>) => Promise<T>;
  type TStateNonPromiseFunction<T> = (hole: IStateActions<T>) => T;
}

const test = StateHole.state<Map<string, IWatchItem>>(async (hole) => {
  console.log("read structure");
  const files = await readFSStructure(["./src"]);

  files.forEach((file) => {
    console.log("watch", file.path);
    fs.watch(file.path, undefined, (event: string, fileName: string) => {
      console.log(event, fileName, file.path);
      hole.update(files);
    });
  });
  return files;
});

StateHole.state<number>((hole) => {
  console.log("subscribed to structure changes");
  hole.useStateHole(test);
  return 3;
});
