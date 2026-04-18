import { Injectable } from '@nestjs/common';

@Injectable()
export class VectorMathService {
  cosineSimilarity(first: number[], second: number[]): number {
    if (first.length !== second.length || first.length === 0) {
      throw new Error('Vectors must have the same non-zero dimension');
    }

    let dot = 0;
    let firstNorm = 0;
    let secondNorm = 0;

    for (let index = 0; index < first.length; index += 1) {
      dot += first[index] * second[index];
      firstNorm += first[index] ** 2;
      secondNorm += second[index] ** 2;
    }

    const denominator = Math.sqrt(firstNorm) * Math.sqrt(secondNorm);
    if (denominator === 0) {
      return 0;
    }

    return Number((dot / denominator).toFixed(6));
  }
}
