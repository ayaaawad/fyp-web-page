import { Injectable } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import { FirestoreService } from '../database/firestore.service';
import { AuditLogRecord } from './audit-logs.types';

@Injectable()
export class AuditLogsService {
  private readonly inMemoryLogs: Array<{
    id: string;
    userId: string;
    machineId: string;
    transactionType: string;
    success: boolean;
    similarityScore?: number;
    dateTime: string;
  }> = [];
  private useInMemoryStore = false;

  constructor(private readonly firestoreService: FirestoreService) {}

  async createLog(payload: AuditLogRecord): Promise<void> {
    if (this.useInMemoryStore) {
      this.pushInMemoryLog(payload);
      return;
    }

    try {
      await this.firestoreService.auditLogsCollection.add({
        ...payload,
        createdAt: this.firestoreService.serverTimestamp(),
        clientTimeIso: new Date().toISOString(),
      });
    } catch (error) {
      this.enableInMemoryFallback(error);
      this.pushInMemoryLog(payload);
    }
  }

  async getRecentLogs(limit = 50): Promise<
    Array<{
      id: string;
      userId: string;
      machineId: string;
      transactionType: string;
      success: boolean;
      similarityScore?: number;
      dateTime: string;
    }>
  > {
    if (this.useInMemoryStore) {
      return this.inMemoryLogs.slice(0, limit);
    }

    try {
      const snapshot = await this.firestoreService.auditLogsCollection
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((document) => {
        const data = document.data() as {
          userId: string;
          machineId: string;
          transactionType: string;
          success: boolean;
          similarityScore?: number;
          createdAt?: Timestamp;
          clientTimeIso?: string;
        };

        return {
          id: document.id,
          userId: data.userId,
          machineId: data.machineId,
          transactionType: data.transactionType,
          success: data.success,
          similarityScore: data.similarityScore,
          dateTime: data.createdAt
            ? data.createdAt.toDate().toISOString()
            : (data.clientTimeIso ?? new Date().toISOString()),
        };
      });
    } catch (error) {
      this.enableInMemoryFallback(error);
      return this.inMemoryLogs.slice(0, limit);
    }
  }

  private pushInMemoryLog(payload: AuditLogRecord): void {
    this.inMemoryLogs.unshift({
      id: `mem-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      userId: payload.userId,
      machineId: payload.machineId,
      transactionType: payload.transactionType,
      success: payload.success,
      similarityScore: payload.similarityScore,
      dateTime: new Date().toISOString(),
    });

    if (this.inMemoryLogs.length > 1000) {
      this.inMemoryLogs.length = 1000;
    }
  }

  private enableInMemoryFallback(reason: unknown): void {
    if (!this.useInMemoryStore) {
      const message =
        reason instanceof Error ? reason.message : 'Unknown Firestore error';
      // eslint-disable-next-line no-console
      console.warn(
        `Firestore unavailable for audit logs. Using in-memory store. Reason: ${message}`,
      );
      this.useInMemoryStore = true;
    }
  }
}
