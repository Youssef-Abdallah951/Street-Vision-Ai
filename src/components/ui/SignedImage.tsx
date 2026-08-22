import { useSignedImageUrl } from '@/hooks/useSignedImageUrl'

export function SignedImage({
  path,
  alt,
  ...props
}: {
  path: string | null | undefined
  alt: string
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  const signedUrl = useSignedImageUrl(path)

  if (!signedUrl) {
    return null
  }

  return <img src={signedUrl} alt={alt} {...props} />
}
