import { ImageResponse } from "next/og";

import { brandMark } from "./icon-shared";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(brandMark(0), size);
}
