import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HashingService } from '../common/services/hashing.service';
import {
  EncryptedVector,
  VectorCryptoService,
} from '../common/services/vector-crypto.service';
import { VectorMathService } from '../common/services/vector-math.service';
import { FirestoreService } from '../database/firestore.service';
import { EnrollUserDto } from './dto/enroll-user.dto';
import { PublicUser, UserDocument } from './user.types';

export interface ProcessControls {
  withdrawal: boolean;
  transaction: boolean;
  deposit: boolean;
  updatedBy: string;
  updatedAt: string;
}

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly inMemoryUsers = new Map<string, UserDocument>();
  private readonly processControlDocId = 'process-controls';
  private processControls: ProcessControls = this.createDefaultProcessControls();
  private processControlsLoaded = false;
  private useInMemoryStore = false;

  constructor(
    private readonly firestoreService: FirestoreService,
    private readonly hashingService: HashingService,
    private readonly vectorCryptoService: VectorCryptoService,
    private readonly vectorMathService: VectorMathService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureAdminUser();
      await this.getProcessControls();
    } catch (error) {
      this.enableInMemoryFallback(error);
      await this.ensureAdminUser();
      await this.getProcessControls();
    }
  }

  async getProcessControls(): Promise<ProcessControls> {
    if (!this.processControlsLoaded) {
      await this.loadProcessControlsFromStore();
    }

    return { ...this.processControls };
  }

  async updateProcessControls(
    update: Partial<Pick<ProcessControls, 'withdrawal' | 'transaction' | 'deposit'>>,
    updatedBy: string,
  ): Promise<ProcessControls> {
    const hasAnyValue =
      typeof update.withdrawal === 'boolean' ||
      typeof update.transaction === 'boolean' ||
      typeof update.deposit === 'boolean';

    if (!hasAnyValue) {
      throw new BadRequestException('Provide at least one process control value');
    }

    const nextState: ProcessControls = {
      ...(await this.getProcessControls()),
      ...(typeof update.withdrawal === 'boolean'
        ? { withdrawal: update.withdrawal }
        : {}),
      ...(typeof update.transaction === 'boolean'
        ? { transaction: update.transaction }
        : {}),
      ...(typeof update.deposit === 'boolean' ? { deposit: update.deposit } : {}),
      updatedBy,
      updatedAt: new Date().toISOString(),
    };

    if (this.useInMemoryStore) {
      this.processControls = nextState;
      this.processControlsLoaded = true;
      return { ...this.processControls };
    }

    try {
      await this.firestoreService.systemCollection.doc(this.processControlDocId).set(
        {
          ...nextState,
          updatedAtServer: this.firestoreService.serverTimestamp(),
        },
        { merge: true },
      );

      this.processControls = nextState;
      this.processControlsLoaded = true;
      return { ...this.processControls };
    } catch (error) {
      this.enableInMemoryFallback(error);
      this.processControls = nextState;
      this.processControlsLoaded = true;
      return { ...this.processControls };
    }
  }

  async ensureAdminUser(): Promise<void> {
    const adminUserId =
      this.configService.get<string>('ADMIN_USER_ID') ?? 'admin-awadaya18';
    const adminEmail = this.configService.getOrThrow<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.getOrThrow<string>('ADMIN_PASSWORD');

    if (this.useInMemoryStore) {
      this.ensureAdminInMemory(adminUserId, adminEmail, adminPassword);
      return;
    }

    try {
      const adminDocRef = this.firestoreService.usersCollection.doc(adminUserId);
      const snapshot = await adminDocRef.get();

      if (snapshot.exists) {
        const existing = snapshot.data() as UserDocument;

        const canVerifyExistingPassword =
          !!existing.passwordHash &&
          !!existing.passwordSalt &&
          !!existing.passwordIterations &&
          !!existing.passwordKeylen &&
          !!existing.passwordDigest;

        const matchesConfiguredPassword = canVerifyExistingPassword
          ? this.hashingService.verifySecret(adminPassword, {
              hash: existing.passwordHash!,
              salt: existing.passwordSalt!,
              iterations: existing.passwordIterations!,
              keylen: existing.passwordKeylen!,
              digest: existing.passwordDigest!,
            })
          : false;

        if (
          existing.role === 'admin' &&
          existing.email === adminEmail &&
          matchesConfiguredPassword
        ) {
          return;
        }

        const updatedPassword = this.hashingService.hashSecret(adminPassword);
        await adminDocRef.set(
          {
            userId: adminUserId,
            email: adminEmail,
            role: 'admin',
            passwordHash: updatedPassword.hash,
            passwordSalt: updatedPassword.salt,
            passwordIterations: updatedPassword.iterations,
            passwordKeylen: updatedPassword.keylen,
            passwordDigest: updatedPassword.digest,
            encryptedVector:
              existing.encryptedVector ??
              this.vectorCryptoService.encryptVector(this.getZeroVector()),
            updatedAt: this.firestoreService.serverTimestamp(),
          },
          { merge: true },
        );
        return;
      }

      const passwordPayload = this.hashingService.hashSecret(adminPassword);
      const encryptedVector = this.vectorCryptoService.encryptVector(
        this.getZeroVector(),
      );

      const adminDocument: UserDocument = {
        userId: adminUserId,
        email: adminEmail,
        role: 'admin',
        passwordHash: passwordPayload.hash,
        passwordSalt: passwordPayload.salt,
        passwordIterations: passwordPayload.iterations,
        passwordKeylen: passwordPayload.keylen,
        passwordDigest: passwordPayload.digest,
        encryptedVector,
      };

      await adminDocRef.set({
        ...adminDocument,
        createdAt: this.firestoreService.serverTimestamp(),
        updatedAt: this.firestoreService.serverTimestamp(),
      });
    } catch (error) {
      this.enableInMemoryFallback(error);
      this.ensureAdminInMemory(adminUserId, adminEmail, adminPassword);
    }
  }

  async enrollCustomer(input: EnrollUserDto): Promise<PublicUser> {
    const pinPayload = this.hashingService.hashSecret(input.pin);
    const encryptedVector = this.vectorCryptoService.encryptVector(input.vector);
    const userDocument: UserDocument = {
      userId: input.userId,
      email: input.email,
      role: input.role ?? 'customer',
      pinHash: pinPayload.hash,
      pinSalt: pinPayload.salt,
      pinIterations: pinPayload.iterations,
      pinKeylen: pinPayload.keylen,
      pinDigest: pinPayload.digest,
      encryptedVector,
    };

    if (this.useInMemoryStore) {
      return this.enrollCustomerInMemory(userDocument);
    }

    try {
      const userDocRef = this.firestoreService.usersCollection.doc(input.userId);
      const snapshot = await userDocRef.get();

      if (snapshot.exists) {
        throw new ConflictException('userId already exists');
      }

      await userDocRef.set({
        ...userDocument,
        createdAt: this.firestoreService.serverTimestamp(),
        updatedAt: this.firestoreService.serverTimestamp(),
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      this.enableInMemoryFallback(error);
      return this.enrollCustomerInMemory(userDocument);
    }

    return {
      userId: input.userId,
      email: input.email,
      role: input.role ?? 'customer',
    };
  }

  async listUsers(): Promise<PublicUser[]> {
    if (this.useInMemoryStore) {
      return this.listUsersInMemory();
    }

    try {
      const snapshot = await this.firestoreService.usersCollection.limit(300).get();

      const users = snapshot.docs.map((document) => {
        const data = document.data() as UserDocument;
        return {
          userId: data.userId,
          email: data.email,
          role: data.role,
        };
      });

      return users.sort((left, right) => left.userId.localeCompare(right.userId));
    } catch (error) {
      this.enableInMemoryFallback(error);
      return this.listUsersInMemory();
    }
  }

  async removeUserById(userId: string): Promise<{ userId: string; removed: true }> {
    const adminUserId =
      this.configService.get<string>('ADMIN_USER_ID') ?? 'admin-awadaya18';

    if (userId === adminUserId) {
      throw new ForbiddenException('Admin account cannot be removed');
    }

    if (this.useInMemoryStore) {
      this.removeUserInMemory(userId);
      return { userId, removed: true };
    }

    try {
      const userRef = this.firestoreService.usersCollection.doc(userId);
      const snapshot = await userRef.get();

      if (!snapshot.exists) {
        throw new NotFoundException('User not found for this userId');
      }

      const user = snapshot.data() as UserDocument;
      if (user.role === 'admin') {
        throw new ForbiddenException('Admin account cannot be removed');
      }

      await userRef.delete();
      return { userId, removed: true };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      this.enableInMemoryFallback(error);
      this.removeUserInMemory(userId);
      return { userId, removed: true };
    }
  }

  async getAdminByEmail(email: string): Promise<UserDocument | null> {
    const adminUserId =
      this.configService.get<string>('ADMIN_USER_ID') ?? 'admin-awadaya18';

    if (this.useInMemoryStore) {
      return this.getAdminByEmailInMemory(adminUserId, email);
    }

    try {
      const adminSnapshot = await this.firestoreService.usersCollection
        .doc(adminUserId)
        .get();

      if (!adminSnapshot.exists) {
        return null;
      }

      const adminUser = adminSnapshot.data() as UserDocument;
      if (adminUser.role !== 'admin' || adminUser.email !== email) {
        return null;
      }

      return adminUser;
    } catch (error) {
      this.enableInMemoryFallback(error);
      await this.ensureAdminUser();
      return this.getAdminByEmailInMemory(adminUserId, email);
    }
  }

  async verify1To1(
    userId: string,
    liveVector: number[],
    transactionType: string,
  ): Promise<{
    user: PublicUser;
    similarityScore: number;
    threshold: number;
    isMatch: boolean;
  }> {
    await this.assertProcessIsEnabled(
      this.mapTransactionTypeToProcess(transactionType),
    );

    let user: UserDocument;

    if (this.useInMemoryStore) {
      user = this.getUserByIdInMemory(userId);
    } else {
      try {
        // O(1) path: direct document lookup by userId.
        const snapshot = await this.firestoreService.usersCollection.doc(userId).get();

        if (!snapshot.exists) {
          throw new NotFoundException('User not found for this userId');
        }

        user = snapshot.data() as UserDocument;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.enableInMemoryFallback(error);
        user = this.getUserByIdInMemory(userId);
      }
    }

    const encrypted = user.encryptedVector as EncryptedVector;
    const storedVector = this.vectorCryptoService.decryptVector(encrypted);

    const similarityScore = this.vectorMathService.cosineSimilarity(
      storedVector,
      liveVector,
    );
    const threshold = Number(
      this.configService.get<number>('SIMILARITY_THRESHOLD') ?? 0.92,
    );

    return {
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
      similarityScore,
      threshold,
      isMatch: similarityScore >= threshold,
    };
  }

  private enrollCustomerInMemory(userDocument: UserDocument): PublicUser {
    if (this.inMemoryUsers.has(userDocument.userId)) {
      throw new ConflictException('userId already exists');
    }

    this.inMemoryUsers.set(userDocument.userId, userDocument);

    return {
      userId: userDocument.userId,
      email: userDocument.email,
      role: userDocument.role,
    };
  }

  private getAdminByEmailInMemory(
    adminUserId: string,
    email: string,
  ): UserDocument | null {
    const adminUser = this.inMemoryUsers.get(adminUserId);

    if (!adminUser) {
      return null;
    }

    if (adminUser.role !== 'admin' || adminUser.email !== email) {
      return null;
    }

    return adminUser;
  }

  private getUserByIdInMemory(userId: string): UserDocument {
    const user = this.inMemoryUsers.get(userId);

    if (!user) {
      throw new NotFoundException('User not found for this userId');
    }

    return user;
  }

  private listUsersInMemory(): PublicUser[] {
    const users = Array.from(this.inMemoryUsers.values()).map((user) => ({
      userId: user.userId,
      email: user.email,
      role: user.role,
    }));

    return users.sort((left, right) => left.userId.localeCompare(right.userId));
  }

  private removeUserInMemory(userId: string): void {
    const user = this.inMemoryUsers.get(userId);

    if (!user) {
      throw new NotFoundException('User not found for this userId');
    }

    if (user.role === 'admin') {
      throw new ForbiddenException('Admin account cannot be removed');
    }

    this.inMemoryUsers.delete(userId);
  }

  private ensureAdminInMemory(
    adminUserId: string,
    adminEmail: string,
    adminPassword: string,
  ): void {
    const existing = this.inMemoryUsers.get(adminUserId);

    if (existing) {
      const canVerifyExistingPassword =
        !!existing.passwordHash &&
        !!existing.passwordSalt &&
        !!existing.passwordIterations &&
        !!existing.passwordKeylen &&
        !!existing.passwordDigest;

      const matchesConfiguredPassword = canVerifyExistingPassword
        ? this.hashingService.verifySecret(adminPassword, {
            hash: existing.passwordHash!,
            salt: existing.passwordSalt!,
            iterations: existing.passwordIterations!,
            keylen: existing.passwordKeylen!,
            digest: existing.passwordDigest!,
          })
        : false;

      if (
        existing.role === 'admin' &&
        existing.email === adminEmail &&
        matchesConfiguredPassword
      ) {
        return;
      }
    }

    const passwordPayload = this.hashingService.hashSecret(adminPassword);
    this.inMemoryUsers.set(adminUserId, {
      userId: adminUserId,
      email: adminEmail,
      role: 'admin',
      passwordHash: passwordPayload.hash,
      passwordSalt: passwordPayload.salt,
      passwordIterations: passwordPayload.iterations,
      passwordKeylen: passwordPayload.keylen,
      passwordDigest: passwordPayload.digest,
      encryptedVector: this.vectorCryptoService.encryptVector(this.getZeroVector()),
    });
  }

  private enableInMemoryFallback(reason: unknown): void {
    if (!this.useInMemoryStore) {
      const message =
        reason instanceof Error ? reason.message : 'Unknown Firestore error';
      // eslint-disable-next-line no-console
      console.warn(
        `Firestore unavailable. Falling back to in-memory simulation store. Reason: ${message}`,
      );
      this.useInMemoryStore = true;
    }
  }

  private getZeroVector(): number[] {
    return Array.from({ length: 128 }, () => 0);
  }

  private async assertProcessIsEnabled(category: 'withdrawal' | 'transaction' | 'deposit') {
    const controls = await this.getProcessControls();
    if (!controls[category]) {
      throw new ForbiddenException(
        `${category} is currently disabled by system administration`,
      );
    }
  }

  private async loadProcessControlsFromStore(): Promise<void> {
    if (this.useInMemoryStore) {
      this.processControlsLoaded = true;
      return;
    }

    try {
      const snapshot = await this.firestoreService.systemCollection
        .doc(this.processControlDocId)
        .get();

      if (!snapshot.exists) {
        this.processControls = this.createDefaultProcessControls();
        this.processControlsLoaded = true;
        return;
      }

      const data = snapshot.data() as Partial<ProcessControls>;
      const defaults = this.createDefaultProcessControls();

      this.processControls = {
        withdrawal:
          typeof data.withdrawal === 'boolean'
            ? data.withdrawal
            : defaults.withdrawal,
        transaction:
          typeof data.transaction === 'boolean'
            ? data.transaction
            : defaults.transaction,
        deposit: typeof data.deposit === 'boolean' ? data.deposit : defaults.deposit,
        updatedBy:
          typeof data.updatedBy === 'string' && data.updatedBy.length > 0
            ? data.updatedBy
            : defaults.updatedBy,
        updatedAt:
          typeof data.updatedAt === 'string' && data.updatedAt.length > 0
            ? data.updatedAt
            : defaults.updatedAt,
      };

      this.processControlsLoaded = true;
    } catch (error) {
      this.enableInMemoryFallback(error);
      this.processControls = this.createDefaultProcessControls();
      this.processControlsLoaded = true;
    }
  }

  private createDefaultProcessControls(): ProcessControls {
    return {
      withdrawal: true,
      transaction: true,
      deposit: true,
      updatedBy: 'system-bootstrap',
      updatedAt: new Date().toISOString(),
    };
  }

  private mapTransactionTypeToProcess(
    transactionType: string,
  ): 'withdrawal' | 'transaction' | 'deposit' {
    if (transactionType === 'withdrawal') {
      return 'withdrawal';
    }

    if (transactionType === 'deposit') {
      return 'deposit';
    }

    return 'transaction';
  }
}
