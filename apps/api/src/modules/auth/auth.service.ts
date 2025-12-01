import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { AuditService } from './audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponse } from './interfaces/auth-response.interface';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly authRepository: AuthRepository,
        private readonly tokenService: TokenService,
        private readonly sessionService: SessionService,
        private readonly auditService: AuditService,
    ) { }

    async register(dto: RegisterDto): Promise<AuthResponse> {
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        if (dto.organizationId) {
            throw new BadRequestException('Joining existing organization is not yet supported via public register.');
        }

        // Auto-create Organization
        const orgName = dto.organizationName || `${dto.firstName}'s Organization`;

        // Transactional creation
        const result = await this.authRepository.createOrganizationWithAdmin({
            ...dto,
            organizationName: orgName,
            password: hashedPassword,
        });

        const { user, organization } = result;

        await this.auditService.log(user.id, 'REGISTER_ORG', 'AUTH', { email: dto.email, orgId: organization.id });

        const session = await this.sessionService.createSession(user.id, 'PENDING');

        const tokens = await this.tokenService.generateTokens({
            sub: user.id,
            email: user.email,
            role: user.role.name,
            sid: session.id,
            orgId: organization.id
        });

        const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
        await this.sessionService.updateSessionToken(session.id, hashedRefreshToken);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role.name,
                organizationId: organization.id,
                permissions: [], // Admin has all permissions usually, or fetch default
                avatarUrl: user.avatarUrl || undefined,
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
        };
    }

    async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
        const user = await this.authRepository.findUserByEmail(dto.email);

        if (!user || !(await bcrypt.compare(dto.password, user.password))) {
            await this.auditService.log(null, 'LOGIN_FAILED', 'AUTH', { email: dto.email }, ipAddress, userAgent);
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is disabled');
        }

        const session = await this.sessionService.createSession(user.id, 'PENDING', userAgent, ipAddress);

        const tokens = await this.tokenService.generateTokens({
            sub: user.id,
            email: user.email,
            role: user.role.name,
            sid: session.id,
            orgId: user.organizationId,
        });

        const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
        await this.sessionService.updateSessionToken(session.id, hashedRefreshToken);

        await this.auditService.log(user.id, 'LOGIN_SUCCESS', 'AUTH', { sessionId: session.id }, ipAddress, userAgent);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role.name,
                organizationId: user.organizationId,
                permissions: user.role.permissions.map(p => ({
                    resource: p.permission.resource,
                    action: p.permission.action,
                })),
                avatarUrl: user.avatarUrl || undefined,
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
        };
    }

    async refresh(refreshToken: string) {
        try {
            if (!refreshToken) {
                throw new UnauthorizedException('Refresh token is required');
            }

            const payload = await this.tokenService.verifyRefreshToken(refreshToken);
            if (!payload || !payload.sid) {
                throw new UnauthorizedException('Invalid refresh token payload');
            }

            const session = await this.sessionService.findSessionById(payload.sid);
            if (!session || !session.isValid) {
                throw new UnauthorizedException('Session invalid or expired');
            }

            // Verify token hash matches DB
            const isMatch = await bcrypt.compare(refreshToken, session.refreshToken);
            if (!isMatch) {
                // Token reuse detected! Revoke session
                this.logger.warn(`Token reuse detected for session ${session.id}`);
                await this.sessionService.revokeSession(session.id);
                throw new UnauthorizedException('Invalid refresh token (reuse)');
            }

            const user = await this.authRepository.findUserById(payload.sub);
            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            // Graceful handling if role is missing (though normalization should fix this)
            if (!user.role) {
                this.logger.error(`User ${user.id} has no role assigned during refresh`);
                throw new UnauthorizedException('User has no role assigned');
            }

            // Rotate: Revoke old session, create new one
            await this.sessionService.revokeSession(session.id);

            const newSession = await this.sessionService.createSession(user.id, 'PENDING', session.userAgent, session.ipAddress);

            const tokens = await this.tokenService.generateTokens({
                sub: user.id,
                email: user.email,
                role: user.role.name,
                sid: newSession.id,
                orgId: user.organizationId,
            });

            const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
            await this.sessionService.updateSessionToken(newSession.id, hashedRefreshToken);

            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: tokens.expiresIn,
            };
        } catch (error) {
            this.logger.error(`Refresh token failed: ${(error as Error).message}`, (error as Error).stack);
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException('Could not refresh token');
        }
    }

    async logout(refreshToken: string) {
        const payload = await this.tokenService.verifyRefreshToken(refreshToken);
        if (payload && payload.sid) {
            await this.sessionService.revokeSession(payload.sid);
        }
        return true;
    }
    async forgotPassword(dto: ForgotPasswordDto) {
        const user = await this.authRepository.findUserByEmail(dto.email);
        if (!user) {
            // Don't reveal user existence
            return true;
        }

        // Generate a random token (or JWT)
        // For DB storage, a random string is often enough, but we can use JWT if we want stateless verification option.
        // Requirement says: Store in DB.
        const token = await this.tokenService.generateResetToken(user.id);
        const hashedToken = await bcrypt.hash(token, 10);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

        await this.authRepository.createPasswordResetToken(user.id, hashedToken, expiresAt);

        // In a real app, send email here.
        this.logger.log(`[MOCK EMAIL] Reset Token for ${user.email}: ${token}`);

        await this.auditService.log(user.id, 'FORGOT_PASSWORD_REQUEST', 'AUTH', { email: dto.email });
        return true;
    }

    async resetPassword(dto: ResetPasswordDto) {
        // We need to find the token in DB. 
        // Since we hashed it, we can't look it up directly by the raw token if we only stored the hash.
        // Wait, the requirement says "Guardar token hasheado".
        // If we store the hash, we can't query by it unless we have the ID.
        // Usually, we send a token like `id:secret`.
        // Or we store the raw token in DB (if it's a random string) and hash it for comparison?
        // Let's assume the token sent to user is the one we verify.
        // If we store hashed token, we need to iterate or have a lookup key.
        // Better approach for this prompt: Store the token as is (if it's a UUID/JWT) or hash it if it's a sensitive secret.
        // Given the constraints and typical flow:
        // 1. User gets token.
        // 2. User sends token.
        // 3. We verify token signature (JWT).
        // 4. We ALSO check if it exists in DB and is not used/expired.

        const payload = await this.tokenService.verifyResetToken(dto.token);
        if (!payload) {
            throw new UnauthorizedException('Invalid or expired reset token');
        }

        // Find token record for this user
        // We need to find the token record. Since we don't have the record ID, we might need to query by userId?
        // But a user might have multiple? No, we deleted old ones.
        // Let's try to find by userId.
        // Actually, `findPasswordResetToken` queries by `token`. 
        // If we stored the HASH, we can't query by the raw token.
        // Correction: We should store the raw token if we want to query by it, OR store a lookup ID.
        // Let's NOT hash it in DB for this specific implementation to allow lookup, 
        // OR (Better Security): The token is `id:secret`. We look up by `id`, verify `secret` hash.
        // Let's stick to: Token is the JWT. We store the JWT in DB. 
        // "Guardar token hasheado" -> Okay, if we must hash it, we need a way to find it.
        // Let's assume we store the JWT directly for now to satisfy the "Store in DB" requirement without overcomplicating the lookup.
        // Wait, the prompt says "Guardar token hasheado". 
        // Okay, I will generate a random token (UUID), hash it, store it. 
        // But then I can't look it up by the raw token.
        // I will stick to storing the JWT as is, but maybe "hashed" meant "securely".
        // Let's use the JWT as the key.

        // RE-READING REQUIREMENT 1.3: "Guardar token hasheado".
        // Okay, I will generate a `resetId` and a `token`. Send `resetId` and `token` to user?
        // No, standard flow is one string.
        // Let's use the JWT. The JWT has a signature.
        // I will store the JWT string in the DB. It's already signed.
        // If I MUST hash it, I'll do it, but then I need to fetch all tokens for user and compare? No.
        // I'll store the JWT.

        // Actually, let's look at `findPasswordResetToken`. It queries by `token`.
        // So I must store the value I search for.
        // I will store the JWT.

        // Wait, `createPasswordResetToken` in repo takes `token`.
        // I will pass the JWT there.

        // But I need to verify it matches.
        // Let's verify the JWT first (stateless check).

        const user = await this.authRepository.findUserById(payload.sub);
        if (!user) throw new UnauthorizedException('User not found');

        // Now check DB
        // We need to find the token record.
        // Since we invalidated old ones, we can find by userId?
        // But `findPasswordResetToken` uses `token`.
        // Let's try to find by the token string (dto.token).
        // If we stored the hash, this fails.
        // I will store the RAW token (dto.token) to enable lookup.
        // If security demands hashing, I would need to change the flow to send (id, token).
        // I will proceed with storing the raw JWT for this step to ensure functionality.

        // Wait, I can verify the hash if I fetch by userId.
        // Let's fetch by userId (which we got from JWT payload).
        // But `AuthRepository` doesn't have `findTokenByUserId`.
        // I'll use `findPasswordResetToken` with the token string.
        // So I must store the token string.

        // Correction: I will verify the JWT, then find the token in DB by `token` (the JWT string).
        // If found, proceed.

        // But wait, `createPasswordResetToken` hashes it in my previous thought? 
        // "const hashedToken = await bcrypt.hash(token, 10);" -> I will REMOVE this hashing to allow lookup.
        // Or I will use `findFirst` on `passwordResetTokens` where `userId` matches, then compare hash.
        // Let's do the latter for "Enterprise" security.

        const tokens = await this.authRepository.findPasswordResetTokensByUserId(user.id);
        let validTokenRecord = null;
        for (const t of tokens) {
            if (await bcrypt.compare(dto.token, t.token)) {
                validTokenRecord = t;
                break;
            }
        }

        if (!validTokenRecord) {
            throw new UnauthorizedException('Invalid or expired reset token (db)');
        }

        if (validTokenRecord.used) {
            throw new UnauthorizedException('Token already used');
        }

        if (new Date() > validTokenRecord.expiresAt) {
            throw new UnauthorizedException('Token expired');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        await this.authRepository.updateUserPassword(user.id, hashedPassword);

        // Mark as used
        await this.authRepository.markPasswordResetTokenAsUsed(validTokenRecord.id);

        // Revoke all sessions
        await this.sessionService.revokeAllUserSessions(user.id);

        await this.auditService.log(user.id, 'PASSWORD_RESET_SUCCESS', 'AUTH');
        return true;
    }
}
