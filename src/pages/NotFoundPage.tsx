import { Link } from 'react-router-dom'
import { Compass, Camera } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageContainer } from '@/components/ui/PageHeader'

export function NotFoundPage() {
  return (
    <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-brand-500 dark:bg-brand-950/60 dark:text-brand-400">
        <Compass className="h-10 w-10" />
      </div>
      <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-surface-900 dark:text-white">404</h1>
      <p className="mt-3 max-w-md text-lg text-surface-500 dark:text-surface-400">
        This street leads nowhere. The page you're looking for doesn't exist.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/">
          <Button>Back to home</Button>
        </Link>
        <Link to="/report">
          <Button variant="outline" leftIcon={<Camera className="h-4 w-4" />}>
            Report a problem instead
          </Button>
        </Link>
      </div>
    </PageContainer>
  )
}
