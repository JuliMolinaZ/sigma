import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api';

async function main() {
    console.log('🔍 Debugging API Request for Clients (using fetch)...\n');

    // 1. Get Admin User
    const email = 'admin@acme.com';
    const user = await prisma.user.findFirst({
        where: { email },
        include: { organization: true, role: true }
    });

    if (!user) {
        console.error('❌ User not found');
        return;
    }

    console.log(`👤 User: ${user.email}`);
    console.log(`   Org: ${user.organizationId} (${user.organization?.name})`);

    // 2. Login to get Token
    try {
        console.log('\n🔑 Attempting Login...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@acme.com',
                password: 'Admin123!'
            })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
        }

        const loginData = await loginRes.json();
        console.log('📦 Login Response:', JSON.stringify(loginData, null, 2));

        // Handle potential { data: ... } wrapper
        const payload = loginData.data || loginData;
        const { accessToken, user: loginUser } = payload;

        console.log('✅ Login Successful');
        console.log(`   Token: ${accessToken.substring(0, 20)}...`);
        console.log(`   OrgId from Login: ${loginUser.organizationId}`);

        // 3. Request Specific Project
        const projectId = '69831719-3593-460d-bb85-da6caf029c93';
        console.log(`\n📡 Requesting GET /projects/${projectId}...`);
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'x-org-id': loginUser.organizationId,
            'Content-Type': 'application/json'
        };

        const projectRes = await fetch(`${API_URL}/projects/${projectId}`, { headers });

        console.log(`✅ Response Status: ${projectRes.status}`);

        const projectData = await projectRes.json();
        console.log('📦 Response Data Structure:', JSON.stringify(projectData, null, 2));

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
