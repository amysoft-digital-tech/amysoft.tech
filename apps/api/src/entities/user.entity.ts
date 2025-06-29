import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Index,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { UserSubscription } from './user-subscription.entity';
import { UserActivity } from './user-activity.entity';
import { Content } from './content.entity';
import { Payment } from './payment.entity';

export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  GUEST = 'guest'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
  DELETED = 'deleted'
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['status'])
@Index(['role'])
@Index(['createdAt'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  @MinLength(8)
  password: string;

  @Column()
  @IsString()
  firstName: string;

  @Column()
  @IsString()
  lastName: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  displayName?: string;

  @Column({ nullable: true })
  @IsOptional()
  avatar?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING_VERIFICATION })
  @IsEnum(UserStatus)
  status: UserStatus;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ nullable: true })
  passwordResetExpires?: Date;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Column({ nullable: true })
  lastLoginIp?: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: {
        marketing: boolean;
        productUpdates: boolean;
        securityAlerts: boolean;
        courseReminders: boolean;
      };
      push: {
        enabled: boolean;
        courseReminders: boolean;
        achievements: boolean;
      };
      inApp: {
        enabled: boolean;
        sound: boolean;
      };
    };
    privacy: {
      profileVisibility: 'public' | 'private' | 'friends';
      showProgress: boolean;
      allowAnalytics: boolean;
      allowMarketing: boolean;
    };
    accessibility: {
      reducedMotion: boolean;
      highContrast: boolean;
      fontSize: 'small' | 'medium' | 'large' | 'xl';
      screenReader: boolean;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  profile?: {
    bio?: string;
    website?: string;
    location?: string;
    timezone: string;
    language: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToOne(() => UserSubscription, subscription => subscription.user)
  subscription?: UserSubscription;

  @OneToMany(() => UserActivity, activity => activity.user)
  activities: UserActivity[];

  @OneToMany(() => Content, content => content.author)
  authoredContent: Content[];

  @OneToMany(() => Payment, payment => payment.user)
  payments: Payment[];

  // Virtual properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  get isVerified(): boolean {
    return this.emailVerified;
  }

  // Methods
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  @BeforeInsert()
  setDefaults() {
    if (!this.displayName) {
      this.displayName = this.fullName;
    }

    if (!this.preferences) {
      this.preferences = {
        theme: 'system',
        notifications: {
          email: {
            marketing: true,
            productUpdates: true,
            securityAlerts: true,
            courseReminders: true
          },
          push: {
            enabled: false,
            courseReminders: false,
            achievements: false
          },
          inApp: {
            enabled: true,
            sound: true
          }
        },
        privacy: {
          profileVisibility: 'public',
          showProgress: true,
          allowAnalytics: true,
          allowMarketing: true
        },
        accessibility: {
          reducedMotion: false,
          highContrast: false,
          fontSize: 'medium',
          screenReader: false
        }
      };
    }

    if (!this.profile) {
      this.profile = {
        timezone: 'UTC',
        language: 'en'
      };
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  async generatePasswordResetToken(): Promise<string> {
    const token = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    this.passwordResetToken = await bcrypt.hash(token, 10);
    this.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    return token;
  }

  async validatePasswordResetToken(token: string): Promise<boolean> {
    if (!this.passwordResetToken || !this.passwordResetExpires) {
      return false;
    }

    if (this.passwordResetExpires < new Date()) {
      return false;
    }

    return bcrypt.compare(token, this.passwordResetToken);
  }

  updateLastLogin(ip?: string): void {
    this.lastLoginAt = new Date();
    if (ip) {
      this.lastLoginIp = ip;
    }
  }

  toJSON() {
    const { password, passwordResetToken, emailVerificationToken, ...result } = this;
    return result;
  }
}