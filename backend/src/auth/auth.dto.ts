import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { IsValidAddress, IsValidEmail, IsValidName, IsValidPassword } from '../common/validation';

export class SignupDto {
  /** 20–60 characters */
  @IsValidName()
  name!: string;

  @IsValidEmail()
  email!: string;

  /** Up to 400 characters */
  @IsValidAddress()
  address!: string;

  /** 8–16 characters with at least one uppercase letter and one special character */
  @IsValidPassword()
  password!: string;
}

/** Login only checks presence: the format rules apply when a password is set, not when it's typed. */
export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(254)
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MaxLength(100)
  password!: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  @MaxLength(100)
  currentPassword!: string;

  /** 8–16 characters with at least one uppercase letter and one special character */
  @IsValidPassword()
  newPassword!: string;
}
