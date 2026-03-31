import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import MockClient from './MockClient'

export default function MockPage({ params }: { params: { username: string } }) {
  const cookieStore = cookies()
  const auth = cookieStore.get('admin_auth')?.value
  const secret = process.env.ADMIN_SECRET

  // Secure server-side check
  if (!auth || !secret || auth !== secret) {
    redirect(`/login?callback=/profile/${params.username}/mock`)
  }

  return <MockClient />
}
