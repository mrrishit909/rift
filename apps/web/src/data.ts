import type { Building, InfraEdge, InfraNode, SeismicEvent } from "@rift/schemas";
export type Data = { event: SeismicEvent; buildings: Building[]; nodes: InfraNode[]; edges: InfraEdge[] };
export const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export async function loadData(): Promise<Data> {
  const g = async <T,>(n: string) => (await fetch(`${base}/data/${n}.json`)).json() as Promise<T>;
  const [event, buildings, nodes, edges] = await Promise.all([g<SeismicEvent>("event"), g<Building[]>("buildings"), g<InfraNode[]>("infra-nodes"), g<InfraEdge[]>("infra-edges")]);
  return { event, buildings, nodes, edges };
}
