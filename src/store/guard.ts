import {
  EventObject,
  StoreAssigner,
  StoreContext,
  StorePropertyAssigner,
} from "@xstate/store";
import { GameState } from "../types";

export type GuardCondition<
  SC extends StoreContext = any,
  E extends EventObject = any
> = (ctx: SC, event: E) => boolean;

/**
 * Guarded assigners are used to conditionally assign values to the store.
 * If the assignment shouldn't occur due to the state of the store, the context
 * is returned without any changes.
 *
 * I could make this guard specific to my store context and events, but wanted to
 * experiment with how flexible the generalization could be.
 *
 * @param condition The condition to check before assignment
 * @param assigner The assigner to use if the condition is met
 * @returns
 */
export const guard =
  <SC extends StoreContext, E extends EventObject>(
    condition: GuardCondition<SC, E> | GuardCondition<SC, E>[],
    assigner: StoreAssigner<SC, E>
  ): StoreAssigner<SC, E> =>
  (ctx, event) => {
    // const result = condition(ctx, event);
    let result = false;
    if (Array.isArray(condition)) {
      result = condition.every((c) => c(ctx, event));
    } else {
      result = condition(ctx, event);
    }

    if (!result) {
      console.warn(`Guard stopped ${event.type} event`);
      return {};
    }

    return assigner(ctx, event);
  };

export const gameIsNotOver: GuardCondition<GameState> = (ctx) =>
  ctx.gameStatus !== "game-over" && ctx.gameStatus !== "win";
