import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  App,
  ServiceAccount,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import {
  CollectionReference,
  DocumentData,
  FieldValue,
  Firestore,
  getFirestore,
} from 'firebase-admin/firestore';

@Injectable()
export class FirestoreService {
  private readonly app: App;
  private readonly db: Firestore;

  constructor(private readonly configService: ConfigService) {
    const existingApp = getApps()[0];
    if (existingApp) {
      this.app = existingApp;
    } else {
      const rawServiceAccount = this.configService.get<string>(
        'FIREBASE_SERVICE_ACCOUNT_KEY',
      );
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');

      if (rawServiceAccount) {
        const serviceAccount = JSON.parse(rawServiceAccount) as {
          project_id: string;
          client_email: string;
          private_key: string;
        };

        const mappedServiceAccount: ServiceAccount = {
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key,
        };

        this.app = initializeApp({
          credential: cert(mappedServiceAccount),
          projectId: projectId || serviceAccount.project_id,
        });
      } else {
        this.app = initializeApp({
          projectId: projectId || undefined,
        });
      }
    }

    this.db = getFirestore(this.app);
    this.db.settings({ ignoreUndefinedProperties: true });
  }

  get usersCollection(): CollectionReference<DocumentData> {
    return this.db.collection('users');
  }

  get auditLogsCollection(): CollectionReference<DocumentData> {
    return this.db.collection('auditLogs');
  }

  get systemCollection(): CollectionReference<DocumentData> {
    return this.db.collection('system');
  }

  serverTimestamp(): FieldValue {
    return FieldValue.serverTimestamp();
  }
}
