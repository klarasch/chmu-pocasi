export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { registerNode } = await import("@/lib/chmi/instrumentation-node");
  registerNode();
}
