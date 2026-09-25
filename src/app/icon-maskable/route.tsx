import { ImageResponse } from "next/og";

import { brandMark } from "../icon-shared";

export function GET() {
  return new ImageResponse(brandMark(80), { width: 512, height: 512 });
}
