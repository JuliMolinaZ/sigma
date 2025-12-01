#!/usr/bin/env ts-node

/**
 * Script to update user password
 * 
 * Usage:
 *   ts-node scripts/update-user-password.ts <email> <newPassword>
 * 
 * Example:
 *   ts-node scripts/update-user-password.ts user@example.com NewPassword123!
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function updateUserPassword(email: string, newPassword: string) {
    try {
        if (!email || !newPassword) {
            throw new Error('Email and password are required');
        }

        if (newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        console.log(`🔄 Updating password for user: ${email}\n`);

        // Get organization
        const org = await prisma.organization.findFirst();
        if (!org) {
            throw new Error('No organization found');
        }

        // Find user
        const user = await prisma.user.findFirst({
            where: {
                email: email.toLowerCase().trim(),
                organizationId: org.id,
            },
            include: {
                role: true,
            },
        });

        if (!user) {
            throw new Error(`User with email ${email} not found`);
        }

        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
            },
            include: {
                role: true,
            },
        });

        console.log('✅ Password updated successfully!\n');
        console.log('📧 Email:', updatedUser.email);
        console.log('👤 Name:', `${updatedUser.firstName} ${updatedUser.lastName}`);
        console.log('🎭 Role:', updatedUser.role.name);
        console.log('✅ Status: Active\n');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Get arguments from command line
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
    console.error('Usage: ts-node scripts/update-user-password.ts <email> <newPassword>');
    console.error('Example: ts-node scripts/update-user-password.ts user@example.com NewPassword123!');
    process.exit(1);
}

updateUserPassword(email, password);
