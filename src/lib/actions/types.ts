export type ActionResult = { error?: string; success?: string };

export type ActionResultWithToken = ActionResult & { token?: string };
