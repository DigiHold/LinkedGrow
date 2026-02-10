import { getRequestConfig } from "next-intl/server";
import enMessages from "@/messages/en.json";

export default getRequestConfig(async () => {
  return {
    locale: "en",
    messages: enMessages,
  };
});
