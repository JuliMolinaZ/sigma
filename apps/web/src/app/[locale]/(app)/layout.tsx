'use client'

import EnterpriseLayout from '@/components/layouts/EnterpriseLayout'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return <EnterpriseLayout>{children}</EnterpriseLayout>
}
