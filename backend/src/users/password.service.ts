import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, hash, hashSync } from 'bcryptjs';
import { Env } from '../config/env';

@Injectable()
export class PasswordService {
  private readonly rounds: number;
  /** Compared against when the email doesn't exist, so login takes the same time either way. */
  private readonly dummyHash: string;

  constructor(config: ConfigService<Env, true>) {
    this.rounds = config.get('BCRYPT_ROUNDS', { infer: true });
    this.dummyHash = hashSync('timing-equaliser', this.rounds);
  }

  hash(plain: string): Promise<string> {
    return hash(plain, this.rounds);
  }

  verify(plain: string, passwordHash: string | undefined): Promise<boolean> {
    return compare(plain, passwordHash ?? this.dummyHash);
  }
}
