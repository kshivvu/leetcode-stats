export async function lcFetch(url: string, body: object): Promise<Response> {
  const session = typeof window !== 'undefined'
    ? (localStorage.getItem('lc_session_cookie') ?? '')
    : ''

  return fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-lc-session': session,
    },
    body: JSON.stringify(body),
  })
}
