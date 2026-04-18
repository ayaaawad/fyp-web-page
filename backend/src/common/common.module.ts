import { Global, Module } from '@nestjs/common';
import { HashingService } from './services/hashing.service';
import { VectorCryptoService } from './services/vector-crypto.service';
import { VectorMathService } from './services/vector-math.service';

@Global()
@Module({
  providers: [HashingService, VectorCryptoService, VectorMathService],
  exports: [HashingService, VectorCryptoService, VectorMathService],
})
export class CommonModule {}
