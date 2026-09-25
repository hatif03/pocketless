import { ImageResponse } from "next/og";

import { brandMark } from "./icon-shared";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(brandMark(0), size);
}
