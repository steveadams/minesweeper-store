import { EventObject, StoreAssigner, StoreContext } from "@xstate/store";

export type GuardCondition<SC extends StoreContext, E extends EventObject> = (
  ctx: SC,
  event: E
) => boolean;

export const guard =
  <SC extends StoreContext, E extends EventObject>(
    condition: GuardCondition<SC, E>,
    assigner: StoreAssigner<SC, E>
  ): StoreAssigner<SC, E> =>
  (ctx, event) => {
    const result = condition(ctx, event);

    if (!result) {
      console.warn(`Guard stopped ${event.type} event`);
      return {};
    }

    return assigner(ctx, event);
  };
