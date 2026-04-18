export interface AuditLogRecord {
  userId: string;
  machineId: string;
  transactionType: string;
  success: boolean;
  similarityScore?: number;
  metadata?: Record<string, unknown>;
}
