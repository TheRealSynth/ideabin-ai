export type PendingStructuringRequest = {
  contract: "mission-3-structuring-placeholder";
  requested_at: string;
  status: "pending";
};

export function createPendingStructuringRequest(requestedAt: string): PendingStructuringRequest {
  return {
    contract: "mission-3-structuring-placeholder",
    requested_at: requestedAt,
    status: "pending",
  };
}
