#!/usr/bin/env ts-node

/**
 * Script to reset passwords for multiple users
 * 
 * Usage:
 *   ts-node scripts/reset-passwords.ts <newPassword> [email1] [email2] ...
 * 
 * Example:
 *   ts-node scripts/reset-passwords.ts NewPassword123! user1@example.com user2@example.com
 * 
 * Or reset all users in an organization:
 *   ts-node scripts/reset-passwords.ts NewPassword123! --all
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPasswords(newPassword: string, emails?: string[], resetAll: boolean = false) {
    try {
        if (!newPassword) {
            throw new Error('Password is required');
        }

        if (newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        let result;

        if (resetAll) {
            console.log('🔐 Resetting passwords for ALL users...\n');
            
            // Get organization
            const org = await prisma.organization.findFirst();
            if (!org) {
                throw new Error('No organization found');
            }

            result = await prisma.user.updateMany({
                where: {
                    organizationId: org.id,
                },
                data: {
                    password: hashedPassword,
                    isActive: true,
                },
            });
        } else if (emails && emails.length > 0) {
            console.log(`🔐 Resetting passwords for ${emails.length} user(s)...\n`);
            console.log('Emails:', emails.join(', '), '\n');

            result = await prisma.user.updateMany({
                where: {
                    email: {
                        in: emails.map(e => e.toLowerCase().trim()),
                    },
                },
                data: {
                    password: hashedPassword,
                    isActive: true,
                },
            });
        } else {
            throw new Error('Either provide email addresses or use --all flag');
        }

        console.log(`✅ Updated passwords for ${result.count} user(s).\n`);
        console.log('⚠️  IMPORTANT: Users will need to use the new password on next login.');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Get arguments from command line
const args = process.argv.slice(2);

if (args.length < 1) {
    console.error('Usage: ts-node scripts/reset-passwords.ts <newPassword> [email1] [email2] ... [--all]');
    console.error('Example: ts-node scripts/reset-passwords.ts NewPassword123! user1@example.com user2@example.com');
    console.error('Or: ts-node scripts/reset-passwords.ts NewPassword123! --all');
    process.exit(1);
}

const newPassword = args[0];
const resetAll = args.includes('--all');
const emails = resetAll ? undefined : args.slice(1).filter(arg => arg !== '--all');

resetPasswords(newPassword, emails, resetAll);
