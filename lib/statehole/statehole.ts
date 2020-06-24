export function state<T>(
  stateFn: TStateFunction<T>,
  defaultValue: T | undefined = undefined
): TState<T> {
  return StateHole.create(stateFn, defaultValue);
}

type TState<T> = () => TState<T>;
type TStateFunction<T> = TStatePromiseFunction<T> | TStateNonPromiseFunction<T>;
type TStatePromiseFunction<T> = (hole: IStateActions<T>) => Promise<T>;
type TStateNonPromiseFunction<T> = (hole: IStateActions<T>) => T;

interface IStateActions<T> {
  update: (newState: T) => void;
  useStateHole<AnyT>(state: TState<AnyT>): AnyT | undefined;
}

interface IState<T> {
  value: T | undefined;
  subscribers: TState<any>[];
  evaluate(): Promise<void>;
  evaluated: boolean;
}

namespace StateHole {
  const states = new Map<TState<any>, IState<any>>();

  export function create<T>(
    stateFn: TStateFunction<T>,
    defaultValue: T | undefined = undefined
  ): TState<T> {
    const currentState: IState<T> = {
      value: defaultValue,
      subscribers: [],
      evaluate,
      evaluated: false,
    };

    states.set(key, currentState);

    function update<T>(newState: T) {}

    function useStateHole<AnyT>(stateKey: TState<AnyT>): AnyT | undefined {
      subscribeTo(stateKey);

      const state = states.get(stateKey)!;
      const { value, evaluate, evaluated } = state;

      !evaluated && evaluate();

      return value;
    }

    function subscribeTo(stateKey: TState<unknown>) {
      const state = states.get(stateKey)!;
      state.subscribers.push(key);
    }

    async function evaluate() {
      currentState.evaluated = true;

      const value = await Promise.resolve(stateFn({ update, useStateHole }));
      currentState.value = value;

      currentState.subscribers.forEach((subscriber) =>
        states.get(subscriber)!.evaluate()
      );
    }

    function key() {
      evaluate();

      return key;
    }

    return key;
  }
}
