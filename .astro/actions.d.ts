declare module "astro:actions" {
	type Actions = typeof import("C:/Users/renato.rocha/Documents/GitHub/PactoAgil/src/actions/index.ts")["server"];

	export const actions: Actions;
}