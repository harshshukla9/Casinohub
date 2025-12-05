import type { SafeAreaInsets } from '@/types'

interface SafeAreaContainerProps {
  children: React.ReactNode
  insets?: SafeAreaInsets
}

export const SafeAreaContainer = ({
  children,
  insets,
}: SafeAreaContainerProps) => (
  <main
    className="flex min-h-screen flex-col w-full"
    style={{
      marginTop: insets?.top ?? 0,
      marginBottom: insets?.bottom ?? 0,
      marginLeft: insets?.left ?? 0,
      marginRight: insets?.right ?? 0,
    }}
  >
    {children}
  </main>
)
