import { TextEncoder, TextDecoder } from "util";
import "@testing-library/jest-dom";

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder as typeof global.TextEncoder;
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}