import {
  generateSocialImage,
  socialImageAlt,
  socialImageContentType,
  socialImageSize,
  SOCIAL_IMAGE_REVALIDATE,
} from "@/lib/og/socialImage";

export const alt = socialImageAlt;
export const size = socialImageSize;
export const contentType = socialImageContentType;
export const revalidate = SOCIAL_IMAGE_REVALIDATE;
export const runtime = "nodejs";

export default async function Image() {
  return generateSocialImage();
}
