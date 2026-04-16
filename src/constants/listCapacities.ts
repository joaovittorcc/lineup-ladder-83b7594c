/** Fixed UI / ladder capacities per list id (initiation, main lists). */
export const LIST_CAPACITIES: Record<string, number> = {
  initiation: 5,
  'list-01': 5,
  'list-02': 10,
};

export function getListCapacity(listId: string): number {
  return LIST_CAPACITIES[listId] ?? 0;
}
