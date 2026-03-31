import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SubmissionsClient from './SubmissionsClient'

export default function SubmissionsPage({ params }: { params: { username: string } }) {
  const cookieStore = cookies()
  const auth = cookieStore.get('admin_auth')?.value
  const secret = process.env.ADMIN_SECRET

  // Secure server-side check
  if (!auth || !secret || auth !== secret) {
    redirect(`/login?callback=/profile/${params.username}/submissions`)
  }

  return <SubmissionsClient />
}
