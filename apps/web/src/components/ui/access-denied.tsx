import { ShieldAlert } from 'lucide-react'
import { Card } from '../ui/card'
import Link from 'next/link'
import { Button } from '../ui/button'

export default function AccessDenied() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <Card className="p-6 max-w-md text-center">
                <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Access Denied
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    You don't have permission to access this module. Please contact your administrator if you believe this is an error.
                </p>
                <Link href="/dashboard">
                    <Button>Back to Dashboard</Button>
                </Link>
            </Card>
        </div>
    )
}
