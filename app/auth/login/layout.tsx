import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Вход | TULPAR EXPRESS",
  description: "Войдите в систему TULPAR EXPRESS"
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
