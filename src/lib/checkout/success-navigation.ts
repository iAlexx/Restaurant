export interface EmptyCartGuardInput {
  hydrated: boolean;
  cartLineCount: number;
  isRedirectingToSuccess: boolean;
}

/** True when checkout should send the user back to the empty cart route. */
export function shouldRedirectEmptyCart(input: EmptyCartGuardInput): boolean {
  if (!input.hydrated) return false;
  if (input.isRedirectingToSuccess) return false;
  return input.cartLineCount === 0;
}

export interface SuccessHrefInput {
  orderId: string;
  successBasePath: string;
  unifiedSuccessPath?: (orderId: string) => string;
}

export function buildSuccessHref(input: SuccessHrefInput): string {
  if (input.unifiedSuccessPath) {
    return input.unifiedSuccessPath(input.orderId);
  }
  return `${input.successBasePath}/${input.orderId}`;
}

export interface OrderSuccessPlan {
  orderId: string;
  successHref: string;
  clearCart: boolean;
  resetSubmitToken: boolean;
}

export function planOrderSuccessNavigation(
  orderId: string,
  options: Omit<SuccessHrefInput, "orderId">
): OrderSuccessPlan {
  return {
    orderId,
    successHref: buildSuccessHref({ orderId, ...options }),
    clearCart: true,
    resetSubmitToken: true,
  };
}

/**
 * Applies post-success side effects after navigation has been initiated.
 * Cart is cleared in a microtask so empty-cart guards on checkout cannot race ahead of router.push.
 */
export function applyOrderSuccessSideEffects(
  plan: OrderSuccessPlan,
  actions: {
    clearCart: () => void;
    resetSubmitToken: () => void;
  }
): void {
  if (plan.resetSubmitToken) {
    actions.resetSubmitToken();
  }
  if (plan.clearCart) {
    queueMicrotask(() => actions.clearCart());
  }
}
