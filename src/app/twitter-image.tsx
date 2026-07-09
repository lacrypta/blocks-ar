import {
  generateSocialImage,
  socialImageAlt,
  socialImageContentType,
  socialImageSize,
} from "@/lib/og/socialImage";

export const alt = socialImageAlt;
export const size = socialImageSize;
export const contentType = socialImageContentType;
export const revalidate = 1800;
export const runtime = "nodejs";

export default async function Image() {
  return generateSocialImage();
}
