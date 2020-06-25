import { state } from "../statehole/statehole";
import watcher from "../watcher/watcher";

state((hole) => {
  const files = hole.useStateHole(watcher);
  console.log(files?.size);
})();
