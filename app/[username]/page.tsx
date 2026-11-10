import { Chat } from '@/components/chat'

export default async function Home({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <div className="max-w">
    <Chat username={username} />
  </div>
}
